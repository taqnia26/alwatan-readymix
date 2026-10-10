import { Router, type IRouter, type RequestHandler, type Request, type Response as ExpressResponse } from "express";
import { Readable } from "node:stream";
import { objectId, StorageError, uploadLimit } from "../lib/storage/policy";
import type { MediaRepository, StorageService } from "../lib/storage/types";

const stringValue = (value: unknown) => typeof value === "string" ? value : "";

async function sendObject(req: Request, res: ExpressResponse, response: Response) {
  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (!response.body) { res.end(); return; }
  const stream = Readable.fromWeb(response.body as ReadableStream);
  stream.on("error", error => { req.log.error({ err: error }, "Media stream failed"); res.destroy(); });
  res.on("close", () => stream.destroy());
  stream.pipe(res);
}

export function createStorageRouter(storage: StorageService, media: MediaRepository, admin: RequestHandler, sameOrigin: RequestHandler): IRouter {
  const router: IRouter = Router();
  const write = [admin, sameOrigin] as const;

  router.post("/storage/uploads/request-url", ...write, async (req, res): Promise<void> => {
    const name = stringValue(req.body?.name).trim();
    const contentType = stringValue(req.body?.contentType).trim();
    const size = Number(req.body?.size);
    if (!name || name.length > 255 || !uploadLimit(contentType) || !Number.isSafeInteger(size) || size <= 0 || size > uploadLimit(contentType)) {
      res.status(400).json({ error: "صيغة أو حجم الملف غير مسموح: صور 10MB، PDF 25MB، MP4/WebM 100MB" }); return;
    }
    try {
      const signed = await storage.uploadUrl({ contentType, size }, { endpoint: `${req.baseUrl}/storage/uploads/direct` });
      res.json({ ...signed, metadata: { name, contentType, size } });
    } catch (error) {
      req.log.error({ err: error }, "Failed to create object upload URL");
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Authentication here is the one-use signed token, not an admin session cookie.
  router.put("/storage/uploads/direct", async (req, res): Promise<void> => {
    if (!storage.receiveUpload) { req.resume(); res.status(405).json({ error: "Direct uploads are only available with local storage" }); return; }
    const token = stringValue(req.query.token);
    req.setTimeout(120_000, () => req.destroy());
    try {
      await storage.receiveUpload(token, req, req.get("content-type") || "", req.get("content-length"));
      res.status(204).end();
    } catch (error) {
      req.resume();
      const status = error instanceof StorageError ? error.status : 500;
      req.log.warn({ status }, "Direct media upload rejected");
      if (!res.headersSent && !res.destroyed) res.status(status).json({ error: error instanceof StorageError ? error.message : "Media upload failed" });
    }
  });

  router.get("/admin/media", admin, async (_req, res): Promise<void> => { res.json(await media.list()); });

  router.post("/admin/media/finalize", ...write, async (req, res): Promise<void> => {
    const objectPath = stringValue(req.body?.objectPath);
    const originalName = stringValue(req.body?.originalName || req.body?.name);
    const contentType = stringValue(req.body?.contentType);
    try { objectId(objectPath); }
    catch { res.status(400).json({ error: "Invalid objectPath" }); return; }
    if (!originalName || originalName.length > 255 || !uploadLimit(contentType)) {
      res.status(400).json({ error: "objectPath, originalName and contentType are required" }); return;
    }
    let actualSize: number;
    try {
      const [metadata] = await (await storage.file(objectPath)).getMetadata();
      actualSize = Number(metadata.size);
      if (metadata.contentType !== contentType || !Number.isSafeInteger(actualSize) || actualSize <= 0 || actualSize > uploadLimit(contentType)) {
        res.status(400).json({ error: "Uploaded file type or size does not match the allowed limits" }); return;
      }
    } catch (error) {
      req.log.error({ err: error }, "Uploaded object validation failed");
      res.status(400).json({ error: "Uploaded object was not found or is unreadable" });
      return;
    }
    try {
      const asset = await media.finalize({
        objectPath, originalName, contentType, size: actualSize,
        altText: stringValue(req.body?.altText), createdBy: req.adminUser?.id,
      });
      res.status(201).json(asset);
    } catch (error) {
      req.log.error({ err: error }, "Failed to finalize media asset");
      res.status(500).json({ error: "تعذر تسجيل الملف في مكتبة الوسائط. حاول مجددًا أو تحقق من إعدادات قاعدة البيانات." });
    }
  });

  router.delete("/admin/media/:id", ...write, async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: "Invalid media id" }); return; }
    const asset = await media.find(id);
    if (!asset) { res.status(404).json({ error: "Media asset not found" }); return; }
    if ((await media.referenceValues()).some(value => value.includes(asset.objectPath))) {
      res.status(409).json({ error: "هذا الملف مستخدم في محتوى أو مسودة أو نسخة منشورة. أزل ارتباطه أولًا." }); return;
    }
    await storage.delete(asset.objectPath);
    await media.delete(id);
    res.status(204).end();
  });

  router.get("/storage/objects/*path", async (req, res): Promise<void> => {
    const raw = req.params.path;
    const objectPath = `/objects/${Array.isArray(raw) ? raw.join("/") : raw}`;
    try { await sendObject(req, res, await storage.response(objectPath, req.get("range"))); }
    catch (error) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
    }
  });

  router.get("/storage/public-objects/*filePath", async (req, res): Promise<void> => {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    try { await sendObject(req, res, await storage.publicResponse(filePath, req.get("range"))); }
    catch (error) {
      req.log.warn({ err: error }, "Public object not found");
      res.status(404).json({ error: "Object not found" });
    }
  });
  return router;
}
