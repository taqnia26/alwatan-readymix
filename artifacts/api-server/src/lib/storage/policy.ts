import { Readable } from "node:stream";
import type { StorageFile } from "./types";

export const UPLOAD_TTL_MS = 15 * 60 * 1000;

export class StorageError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "StorageError";
  }
}

export function uploadLimit(type: string): number {
  if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(type)) return 10 * 1024 * 1024;
  if (type === "application/pdf") return 25 * 1024 * 1024;
  if (["video/mp4", "video/webm"].includes(type)) return 100 * 1024 * 1024;
  return 0;
}

export function objectId(objectPath: string): string {
  const match = /^\/objects\/uploads\/([a-zA-Z0-9-]{1,128})$/.exec(objectPath);
  if (!match) throw new StorageError("Invalid object path", 404);
  return match[1];
}

export function publicPath(filePath: string): string {
  if (!filePath || filePath.length > 1024 || /[\\\0?#]/.test(filePath) ||
      filePath.split("/").some(part => !part || part === "." || part === "..")) {
    throw new StorageError("Invalid public object path", 404);
  }
  return filePath;
}

/** Signature check, not a full media decoder. Never trusts a filename/extension. */
export function matchesType(head: Buffer, type: string): boolean {
  switch (type) {
    case "image/jpeg": return head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    case "image/png": return head.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    case "image/gif": return ["GIF87a", "GIF89a"].includes(head.toString("ascii", 0, 6));
    case "image/webp": return head.length >= 12 && head.toString("ascii", 0, 4) === "RIFF" && head.toString("ascii", 8, 12) === "WEBP";
    case "application/pdf": return head.toString("ascii", 0, 5) === "%PDF-";
    case "video/mp4": {
      if (head.length < 16 || head.toString("ascii", 4, 8) !== "ftyp" || head.readUInt32BE(0) < 16) return false;
      const end = Math.min(head.length, head.readUInt32BE(0), 512);
      const brands = [head.toString("ascii", 8, 12)];
      for (let i = 16; i + 4 <= end; i += 4) brands.push(head.toString("ascii", i, i + 4));
      return brands.some(brand => /^(isom|iso[2-9]|mp4[12]|avc1|dash|M4V |MSNV|3gp[4-9])$/.test(brand));
    }
    case "video/webm": {
      if (!head.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return false;
      // EBML DocType must be "webm", not another Matroska container.
      for (let i = 4; i + 3 < head.length; i++) {
        if (head[i] !== 0x42 || head[i + 1] !== 0x82) continue;
        const first = head[i + 2];
        let width = 1, mask = 0x80;
        while (width <= 8 && !(first & mask)) { width++; mask >>= 1; }
        if (width > 8 || i + 2 + width > head.length) continue;
        let length = first & (mask - 1);
        for (let j = 1; j < width; j++) length = length * 256 + head[i + 2 + j];
        if (length === 4 && head.toString("ascii", i + 2 + width, i + 6 + width) === "webm") return true;
      }
      return false;
    }
    default: return false;
  }
}

export async function fileResponse(file: StorageFile, range?: string): Promise<Response> {
  const [metadata] = await file.getMetadata();
  const size = Number(metadata.size);
  if (!uploadLimit(metadata.contentType) || !Number.isSafeInteger(size) || size <= 0 || size > uploadLimit(metadata.contentType)) {
    throw new StorageError("Object not found", 404);
  }
  const headers: Record<string, string> = {
    "Content-Type": metadata.contentType,
    "Cache-Control": "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  };
  const invalid = () => new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${size}` } });
  let start = 0, end = size - 1;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return invalid();
    if (match[1]) {
      start = Number(match[1]);
      const requestedEnd = match[2] ? Number(match[2]) : size - 1;
      if (!Number.isSafeInteger(requestedEnd)) return invalid();
      end = Math.min(requestedEnd, size - 1);
    } else {
      const suffix = Number(match[2]);
      if (!Number.isSafeInteger(suffix) || suffix <= 0) return invalid();
      start = Math.max(0, size - suffix);
    }
    if (!Number.isSafeInteger(start) || start > end || start >= size) return invalid();
    headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
  }
  headers["Content-Length"] = String(end - start + 1);
  return new Response(Readable.toWeb(file.createReadStream(range ? { start, end, validation: false } : undefined)) as ReadableStream, {
    status: range ? 206 : 200, headers,
  });
}
