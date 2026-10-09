import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { blogPostsTable, certificatesTable, db, mediaAssetsTable, productsTable, pageContentTable, siteSettingsTable } from "@workspace/db";
import { requireAdmin, requireSameOrigin } from "../lib/auth";
import { objectStorage } from "../lib/objectStorage";

const router: IRouter = Router();
const write = [requireAdmin, requireSameOrigin] as const;
const stringValue = (value: unknown) => typeof value === "string" ? value : "";
const uploadLimit = (type: string): number => {
  if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(type)) return 10 * 1024 * 1024;
  if (type === "application/pdf") return 25 * 1024 * 1024;
  if (["video/mp4", "video/webm"].includes(type)) return 100 * 1024 * 1024;
  return 0;
};

router.post("/storage/uploads/request-url", ...write, async (req, res): Promise<void> => {
  const name = stringValue(req.body?.name).trim();
  const contentType = stringValue(req.body?.contentType).trim();
  const size = Number(req.body?.size);
  if (!name || name.length > 255 || !uploadLimit(contentType) || !Number.isSafeInteger(size) || size <= 0 || size > uploadLimit(contentType)) {
    res.status(400).json({ error: "صيغة أو حجم الملف غير مسموح: صور 10MB، PDF 25MB، MP4/WebM 100MB" }); return;
  }
  try {
    const signed = await objectStorage.uploadUrl();
    res.json({ ...signed, metadata: { name, contentType, size } });
  } catch (error) {
    req.log.error({ err: error }, "Failed to create object upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

router.get("/admin/media", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(mediaAssetsTable).orderBy(mediaAssetsTable.createdAt);
  res.json(rows);
});

router.post("/admin/media/finalize", ...write, async (req, res): Promise<void> => {
  const objectPath = stringValue(req.body?.objectPath);
  const originalName = stringValue(req.body?.originalName || req.body?.name);
  const contentType = stringValue(req.body?.contentType);
  if (!/^\/objects\/uploads\/[a-zA-Z0-9-]+$/.test(objectPath) || !originalName || originalName.length > 255 || !uploadLimit(contentType)) {
    res.status(400).json({ error: "objectPath, originalName and contentType are required" }); return;
  }
  try {
    const file = await objectStorage.file(objectPath);
    const [metadata] = await file.getMetadata();
    const actualSize = Number(metadata.size);
    if (metadata.contentType !== contentType || !Number.isSafeInteger(actualSize) || actualSize <= 0 || actualSize > uploadLimit(contentType)) {
      res.status(400).json({ error: "Uploaded file type or size does not match the allowed limits" }); return;
    }
    const [asset] = await db.insert(mediaAssetsTable).values({
      objectPath, originalName, contentType, size: actualSize,
      altText: stringValue(req.body?.altText), createdBy: req.adminUser?.id,
    }).onConflictDoUpdate({
      target: mediaAssetsTable.objectPath,
      set: { originalName, contentType, size: actualSize, altText: stringValue(req.body?.altText), updatedAt: new Date() },
    }).returning();
    res.status(201).json(asset);
  } catch (error) {
    req.log.error({ err: error }, "Failed to finalize media asset");
    res.status(400).json({ error: "Uploaded object was not found" });
  }
});

router.delete("/admin/media/:id", ...write, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: "Invalid media id" }); return; }
  const [asset] = await db.select().from(mediaAssetsTable).where(eq(mediaAssetsTable.id, id));
  if (!asset) { res.status(404).json({ error: "Media asset not found" }); return; }
  const [products, posts, certificates, content, settings] = await Promise.all([
    db.select({ value: productsTable.imageUrl }).from(productsTable),
    db.select({ value: blogPostsTable.coverImage }).from(blogPostsTable),
    db.select({ image: certificatesTable.imageUrl, file: certificatesTable.fileUrl }).from(certificatesTable),
    db.select({ ar: pageContentTable.valueAr, en: pageContentTable.valueEn }).from(pageContentTable),
    db.select({ value: siteSettingsTable.value }).from(siteSettingsTable),
  ]);
  const allValues = [
    ...products.map(row => row.value), ...posts.map(row => row.value),
    ...certificates.flatMap(row => [row.image, row.file]),
    ...content.flatMap(row => [row.ar, row.en]), ...settings.map(row => row.value),
  ];
  if (allValues.some(value => value.includes(asset.objectPath))) {
    res.status(409).json({ error: "هذا الملف مستخدم في محتوى أو مسودة أو نسخة منشورة. أزل ارتباطه أولًا." }); return;
  }
  await objectStorage.delete(asset.objectPath);
  await db.delete(mediaAssetsTable).where(eq(mediaAssetsTable.id, id));
  res.status(204).end();
});

router.get("/storage/objects/*path", async (req, res): Promise<void> => {
  const raw = req.params.path;
  const objectPath = `/objects/${Array.isArray(raw) ? raw.join("/") : raw}`;
  try {
    const response = await objectStorage.response(objectPath, req.get("range"));
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      const stream = await import("node:stream").then(({ Readable }) => Readable.fromWeb(response.body as ReadableStream));
      stream.on("error", error => { req.log.error({ err: error }, "Media stream failed"); res.destroy(); });
      res.on("close", () => stream.destroy());
      stream.pipe(res);
    } else res.end();
  } catch (error) {
    req.log.warn({ err: error }, "Object not found");
    res.status(404).json({ error: "Object not found" });
  }
});

router.get("/storage/public-objects/*filePath", async (req, res): Promise<void> => {
  const raw = req.params.filePath;
  const filePath = Array.isArray(raw) ? raw.join("/") : raw;
  try {
    const response = await objectStorage.publicResponse(filePath);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      const stream = await import("node:stream").then(({ Readable }) => Readable.fromWeb(response.body as ReadableStream));
      stream.pipe(res);
    } else res.end();
  } catch (error) {
    req.log.warn({ err: error }, "Public object not found");
    res.status(404).json({ error: "Object not found" });
  }
});

export default router;