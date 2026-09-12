import { Router, type IRouter } from "express";
import { and, eq, or } from "drizzle-orm";
import { blogPostsTable, certificatesTable, db, mediaAssetsTable, productsTable } from "@workspace/db";
import { requireAdmin, requireSameOrigin } from "../lib/auth";
import { objectStorage } from "../lib/objectStorage";

const router: IRouter = Router();
const write = [requireAdmin, requireSameOrigin] as const;
const stringValue = (value: unknown) => typeof value === "string" ? value : "";

router.post("/storage/uploads/request-url", ...write, async (req, res): Promise<void> => {
  const name = stringValue(req.body?.name).trim();
  const contentType = stringValue(req.body?.contentType).trim();
  const size = Number(req.body?.size);
  if (!name || !contentType || !Number.isSafeInteger(size) || size < 0) {
    res.status(400).json({ error: "name, size and contentType are required" }); return;
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
  const size = Number(req.body?.size) || 0;
  if (!objectPath.startsWith("/objects/") || !originalName || !contentType) {
    res.status(400).json({ error: "objectPath, originalName and contentType are required" }); return;
  }
  try {
    const file = await objectStorage.file(objectPath);
    const [metadata] = await file.getMetadata();
    const [asset] = await db.insert(mediaAssetsTable).values({
      objectPath, originalName, contentType, size: size || Number(metadata.size || 0),
      altText: stringValue(req.body?.altText), createdBy: req.adminUser?.id,
    }).onConflictDoUpdate({
      target: mediaAssetsTable.objectPath,
      set: { originalName, contentType, size: size || Number(metadata.size || 0), altText: stringValue(req.body?.altText), updatedAt: new Date() },
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
  const references = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.imageUrl, asset.objectPath))
    .unionAll(db.select({ id: blogPostsTable.id }).from(blogPostsTable).where(eq(blogPostsTable.coverImage, asset.objectPath)))
    .unionAll(db.select({ id: certificatesTable.id }).from(certificatesTable).where(or(eq(certificatesTable.imageUrl, asset.objectPath), eq(certificatesTable.fileUrl, asset.objectPath))));
  if (references.length) { res.status(409).json({ error: "Media asset is still referenced by content" }); return; }
  await objectStorage.delete(asset.objectPath);
  await db.delete(mediaAssetsTable).where(eq(mediaAssetsTable.id, id));
  res.status(204).end();
});

router.get("/storage/objects/*path", async (req, res): Promise<void> => {
  const raw = req.params.path;
  const objectPath = `/objects/${Array.isArray(raw) ? raw.join("/") : raw}`;
  try {
    const response = await objectStorage.response(objectPath);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      const stream = await import("node:stream").then(({ Readable }) => Readable.fromWeb(response.body as ReadableStream));
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