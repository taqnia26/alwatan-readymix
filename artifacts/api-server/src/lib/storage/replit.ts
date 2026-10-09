import { randomUUID } from "node:crypto";
import { Storage, type File } from "@google-cloud/storage";
import { fileResponse, objectId, publicPath } from "./policy";
import type { StorageFile, StorageService, UploadRequest } from "./types";

export const SIDECAR = "http://127.0.0.1:1106";

export function privateLocation() {
  const parts = (process.env.PRIVATE_OBJECT_DIR ?? "").replace(/^\/+/, "").split("/").filter(Boolean);
  const bucket = parts.shift() || process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "";
  if (!bucket) throw new Error("Replit storage requires PRIVATE_OBJECT_DIR or DEFAULT_OBJECT_STORAGE_BUCKET_ID");
  return { bucket, prefix: (parts.join("/") || "private").replace(/\/+$/, "") };
}

export function replitClient() {
  return new Storage({
    credentials: {
      audience: "replit", subject_token_type: "access_token", token_url: `${SIDECAR}/token`,
      type: "external_account",
      credential_source: { url: `${SIDECAR}/credential`, format: { type: "json", subject_token_field_name: "access_token" } },
      universe_domain: "googleapis.com",
    },
    projectId: "",
  });
}

function wrapFile(file: File): StorageFile {
  return {
    async getMetadata() {
      const [metadata] = await file.getMetadata();
      return [{ contentType: String(metadata.contentType || ""), size: metadata.size ?? 0 }];
    },
    createReadStream: options => file.createReadStream(options),
  };
}

/** Constructed only by the explicit replit driver or the owner-run export command. */
export class ReplitObjectStorage implements StorageService {
  readonly driver = "replit" as const;
  private readonly storage = replitClient();

  private target(objectPath: string) {
    const id = objectId(objectPath);
    const { bucket, prefix } = privateLocation();
    return this.storage.bucket(bucket).file(`${prefix}/uploads/${id}`);
  }

  async uploadUrl(_input: UploadRequest) {
    const { bucket, prefix } = privateLocation();
    const objectPath = `/objects/uploads/${randomUUID()}`;
    const response = await fetch(`${SIDECAR}/object-storage/signed-object-url`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bucket_name: bucket, object_name: `${prefix}/${objectPath.slice("/objects/".length)}`,
        method: "PUT", expires_at: new Date(Date.now() + 900_000).toISOString(),
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`Object storage signing failed (${response.status})`);
    const body = await response.json() as { signed_url?: string };
    if (!body.signed_url) throw new Error("Object storage returned no signed upload URL");
    return { uploadURL: body.signed_url, objectPath };
  }

  async file(objectPath: string) {
    const file = this.target(objectPath);
    const [exists] = await file.exists();
    if (!exists) throw new Error("Object not found");
    return wrapFile(file);
  }

  async response(objectPath: string, range?: string) { return fileResponse(await this.file(objectPath), range); }

  async publicResponse(filePath: string, range?: string) {
    publicPath(filePath);
    for (const searchPath of (process.env.PUBLIC_OBJECT_SEARCH_PATHS ?? "").split(",").map(item => item.trim()).filter(Boolean)) {
      const parts = searchPath.replace(/^\/+/, "").split("/");
      const bucket = parts.shift();
      if (!bucket) continue;
      const file = this.storage.bucket(bucket).file(`${parts.join("/")}/${filePath}`);
      const [exists] = await file.exists();
      if (exists) return fileResponse(wrapFile(file), range);
    }
    throw new Error("Object not found");
  }

  async delete(objectPath: string) { await this.target(objectPath).delete({ ignoreNotFound: true }); }
}
