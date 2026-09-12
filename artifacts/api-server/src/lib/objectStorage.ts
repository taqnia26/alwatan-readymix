import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { File, Storage } from "@google-cloud/storage";

const SIDECAR = "http://127.0.0.1:1106";
const storage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${SIDECAR}/token`,
    type: "external_account",
    credential_source: { url: `${SIDECAR}/credential`, format: { type: "json", subject_token_field_name: "access_token" } },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

function privatePath(): { bucket: string; prefix: string } {
  const raw = process.env.PRIVATE_OBJECT_DIR ?? "";
  const parts = raw.replace(/^\/+/, "").split("/");
  const bucket = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || parts.shift() || "";
  if (!bucket) throw new Error("PRIVATE_OBJECT_DIR or DEFAULT_OBJECT_STORAGE_BUCKET_ID is required");
  return { bucket, prefix: (parts.join("/") || "private").replace(/\/+$/, "") };
}

function fileFor(objectPath: string): File {
  if (!objectPath.startsWith("/objects/")) throw new Error("Invalid object path");
  const { bucket, prefix } = privatePath();
  return storage.bucket(bucket).file(`${prefix}/${objectPath.slice("/objects/".length)}`);
}

async function publicFile(filePath: string): Promise<File | undefined> {
  const configured = (process.env.PUBLIC_OBJECT_SEARCH_PATHS ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  for (const searchPath of configured) {
    const pieces = searchPath.replace(/^\/+/, "").split("/");
    const bucket = pieces.shift() || process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucket) continue;
    const file = storage.bucket(bucket).file(`${pieces.join("/")}/${filePath.replace(/^\/+/, "")}`);
    const [exists] = await file.exists();
    if (exists) return file;
  }
  return undefined;
}

export class ObjectStorageService {
  async uploadUrl(): Promise<{ uploadURL: string; objectPath: string }> {
    const { bucket, prefix } = privatePath();
    const objectPath = `/objects/uploads/${randomUUID()}`;
    const response = await fetch(`${SIDECAR}/object-storage/signed-object-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bucket_name: bucket,
        object_name: `${prefix}/${objectPath.slice("/objects/".length)}`,
        method: "PUT",
        expires_at: new Date(Date.now() + 900_000).toISOString(),
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`Object storage signing failed (${response.status})`);
    const body = await response.json() as { url?: string };
    if (!body.url) throw new Error("Object storage returned no upload URL");
    return { uploadURL: body.url, objectPath };
  }

  async file(objectPath: string): Promise<File> {
    const file = fileFor(objectPath);
    const [exists] = await file.exists();
    if (!exists) throw new Error("Object not found");
    return file;
  }

  async response(objectPath: string): Promise<Response> {
    const file = await this.file(objectPath);
    const [metadata] = await file.getMetadata();
    const stream = Readable.toWeb(file.createReadStream()) as ReadableStream;
    return new Response(stream, {
      headers: {
        "Content-Type": String(metadata.contentType || "application/octet-stream"),
        "Cache-Control": "public, max-age=3600",
        ...(metadata.size ? { "Content-Length": String(metadata.size) } : {}),
      },
    });
  }

  async publicResponse(filePath: string): Promise<Response> {
    const file = await publicFile(filePath);
    if (!file) throw new Error("Object not found");
    const [metadata] = await file.getMetadata();
    return new Response(Readable.toWeb(file.createReadStream()) as ReadableStream, {
      headers: {
        "Content-Type": String(metadata.contentType || "application/octet-stream"),
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  async delete(objectPath: string): Promise<void> {
    const file = fileFor(objectPath);
    await file.delete({ ignoreNotFound: true });
  }
}

export const objectStorage = new ObjectStorageService();