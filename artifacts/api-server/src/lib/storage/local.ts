import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { constants, createReadStream, createWriteStream, openSync } from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";
import { PassThrough, Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileResponse, matchesType, objectId, publicPath, StorageError, UPLOAD_TTL_MS, uploadLimit } from "./policy";
import type { StorageFile, StorageService, UploadRequest } from "./types";

interface UploadClaims {
  v: 1;
  nonce: string;
  objectPath: string;
  contentType: string;
  size: number;
  maxBytes: number;
  expiresAt: number;
}

interface VerifiedRecord {
  v: 1;
  objectPath: string;
  contentType: string;
  size: number;
  verifiedAt: string;
}

const missing = () => new StorageError("Object not found", 404);
const isCode = (error: unknown, code: string) => !!error && typeof error === "object" && "code" in error && error.code === code;

export class LocalObjectStorage implements StorageService {
  readonly driver = "local" as const;
  readonly root: string;
  private ready?: Promise<void>;
  private signingKey?: Promise<Buffer>;
  private lastCleanup = 0;

  constructor(root = process.env.MEDIA_STORAGE_DIR || path.resolve(process.cwd(), "var/media")) {
    this.root = path.resolve(root);
    if (this.root.split(path.sep).some(segment => ["public", "dist", "build"].includes(segment))) {
      throw new Error("MEDIA_STORAGE_DIR must be outside public and build output directories");
    }
  }

  private init(): Promise<void> {
    return this.ready ??= (async () => {
      await fs.mkdir(this.root, { recursive: true, mode: 0o700 });
      const realRoot = await fs.realpath(this.root);
      if (realRoot.split(path.sep).some(segment => ["public", "dist", "build"].includes(segment))) {
        throw new Error("MEDIA_STORAGE_DIR resolves inside a public or build directory");
      }
      for (const name of ["uploads", "public-files", ".metadata", ".tmp", ".tickets", ".claimed"]) {
        const dir = path.join(this.root, name);
        await fs.mkdir(dir, { recursive: true, mode: 0o700 });
        const info = await fs.lstat(dir);
        if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("Storage subdirectories cannot be symlinks");
      }
    })();
  }

  private key(): Promise<Buffer> {
    return this.signingKey ??= this.loadKey();
  }

  private async loadKey(): Promise<Buffer> {
    await this.init();
    const keyPath = path.join(this.root, ".upload-signing-key");
    const temp = path.join(this.root, ".tmp", `${randomUUID()}.key`);
    try {
      await fs.writeFile(temp, randomBytes(32), { flag: "wx", mode: 0o600 });
      await fs.link(temp, keyPath);
    } catch (error) {
      if (!isCode(error, "EEXIST")) throw error;
    } finally { await fs.unlink(temp).catch(() => undefined); }
    const handle = await fs.open(keyPath, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const info = await handle.stat();
      if (!info.isFile() || info.size !== 32) throw new Error("Invalid storage signing key file");
      return await handle.readFile();
    } finally { await handle.close(); }
  }

  private locations(objectPath: string, isPublic = false) {
    const id = isPublic ? `public-${createHash("sha256").update(publicPath(objectPath)).digest("hex")}` : objectId(objectPath);
    return {
      file: path.join(this.root, isPublic ? "public-files" : "uploads", id),
      metadata: path.join(this.root, ".metadata", `${id}.json`),
    };
  }

  async uploadUrl(input: UploadRequest, options = { endpoint: "/api/storage/uploads/direct" }) {
    if (!uploadLimit(input.contentType) || !Number.isSafeInteger(input.size) || input.size <= 0 || input.size > uploadLimit(input.contentType)) {
      throw new StorageError("Invalid upload type or size");
    }
    await this.init();
    await this.cleanupExpired();
    const nonce = randomUUID();
    const claims: UploadClaims = {
      v: 1, nonce, objectPath: `/objects/uploads/${randomUUID()}`,
      contentType: input.contentType, size: input.size, maxBytes: input.size,
      expiresAt: Date.now() + UPLOAD_TTL_MS,
    };
    const encoded = Buffer.from(JSON.stringify(claims)).toString("base64url");
    const signature = createHmac("sha256", await this.key()).update(encoded).digest("base64url");
    // The pending ticket and atomic rename make consumption single-use across processes/restarts.
    await fs.writeFile(path.join(this.root, ".tickets", `${nonce}.json`), JSON.stringify(claims), { flag: "wx", mode: 0o600 });
    return { uploadURL: `${options.endpoint}?token=${encoded}.${signature}`, objectPath: claims.objectPath };
  }

  private async claim(token: string): Promise<UploadClaims> {
    if (token.length > 2048 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) throw new StorageError("Invalid upload token", 403);
    const [encoded, signature] = token.split(".");
    const expected = createHmac("sha256", await this.key()).update(encoded).digest();
    const received = Buffer.from(signature, "base64url");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new StorageError("Invalid upload token", 403);
    let claims: UploadClaims;
    try { claims = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")); }
    catch { throw new StorageError("Invalid upload token", 403); }
    if (!claims || claims.v !== 1 || !/^[a-f0-9-]{36}$/.test(claims.nonce) ||
        !uploadLimit(claims.contentType) || !Number.isSafeInteger(claims.size) ||
        claims.size <= 0 || claims.maxBytes !== claims.size || claims.size > uploadLimit(claims.contentType) ||
        !Number.isSafeInteger(claims.expiresAt)) throw new StorageError("Invalid upload token", 403);
    objectId(claims.objectPath);
    if (claims.expiresAt <= Date.now()) throw new StorageError("Upload token expired", 410);
    const pending = path.join(this.root, ".tickets", `${claims.nonce}.json`);
    const claimed = path.join(this.root, ".claimed", `${claims.nonce}.json`);
    try { await fs.rename(pending, claimed); }
    catch (error) {
      if (isCode(error, "ENOENT")) throw new StorageError("Upload token already used or revoked", 409);
      throw error;
    }
    const stored = await fs.readFile(claimed, "utf8");
    if (stored !== JSON.stringify(claims)) {
      await fs.unlink(claimed).catch(() => undefined);
      throw new StorageError("Invalid upload ticket", 403);
    }
    return claims;
  }

  async receiveUpload(token: string, source: Readable, contentType: string, contentLength?: string): Promise<void> {
    const claims = await this.claim(token);
    try {
      if (contentType !== claims.contentType) throw new StorageError("Upload Content-Type does not match the token", 415);
      if (contentLength !== undefined && (!/^\d+$/.test(contentLength) || Number(contentLength) !== claims.size)) {
        throw new StorageError("Upload length does not match the token", Number(contentLength) > claims.size ? 413 : 400);
      }
      await this.commit(claims.objectPath, source, claims.contentType, claims.maxBytes, claims.size, false, claims.expiresAt);
    } finally { await fs.unlink(path.join(this.root, ".claimed", `${claims.nonce}.json`)).catch(() => undefined); }
  }

  private async commit(objectPath: string, source: Readable, contentType: string, limit: number, expectedSize?: number, isPublic = false, expiresAt = Date.now() + UPLOAD_TTL_MS) {
    await this.init();
    if (!uploadLimit(contentType) || limit > uploadLimit(contentType)) throw new StorageError("Unsupported media type", 415);
    const destination = this.locations(objectPath, isPublic);
    const temp = path.join(this.root, ".tmp", `${randomUUID()}.part`);
    const metadataTemp = `${temp}.json`;
    let head = Buffer.alloc(0);
    let size = 0;
    let promoted = false;
    const verifier = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        size += chunk.length;
        if (size > limit) { callback(new StorageError("Upload exceeds the allowed size", 413)); return; }
        if (head.length < 512) head = Buffer.concat([head, chunk.subarray(0, 512 - head.length)]);
        callback(null, chunk);
      },
    });
    // Do not give pipeline ownership of the HTTP request socket: errors can still return a 4xx.
    const input = new PassThrough();
    const forwardError = (error: Error) => input.destroy(error);
    source.on("error", forwardError);
    const forwardClose = () => { if (!source.readableEnded) input.destroy(new StorageError("Upload interrupted")); };
    source.on("close", forwardClose);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(1, expiresAt - Date.now()));
    timer.unref();
    try {
      const result = pipeline(input, verifier, createWriteStream(temp, { flags: "wx", mode: 0o600 }), { signal: controller.signal });
      source.pipe(input);
      await result;
      if (size <= 0 || (expectedSize !== undefined && size !== expectedSize)) throw new StorageError("Uploaded size does not match the token");
      if (!matchesType(head, contentType)) throw new StorageError("File signature does not match the declared type", 415);
      const record: VerifiedRecord = { v: 1, objectPath, contentType, size, verifiedAt: new Date().toISOString() };
      await fs.writeFile(metadataTemp, JSON.stringify(record), { flag: "wx", mode: 0o600 });
      // Atomic non-overwriting promotion; metadata is published only after all byte checks pass.
      await fs.link(temp, destination.file);
      promoted = true;
      await fs.rename(metadataTemp, destination.metadata);
    } catch (error) {
      if (promoted) await fs.unlink(destination.file).catch(() => undefined);
      if (isCode(error, "EEXIST")) throw new StorageError("Object already exists", 409);
      if (controller.signal.aborted) throw new StorageError("Upload token expired while streaming", 410);
      throw error;
    } finally {
      clearTimeout(timer);
      source.unpipe(input);
      source.off("error", forwardError);
      source.off("close", forwardClose);
      if (!source.destroyed && !source.readableEnded) source.resume();
      await Promise.all([temp, metadataTemp].map(file => fs.unlink(file).catch(() => undefined)));
    }
  }

  /** Owner-run imports use the same streaming verification and never overwrite an existing object. */
  async importObject(objectPath: string, source: Readable, contentType: string, isPublic = false): Promise<void> {
    await this.commit(objectPath, source, contentType, uploadLimit(contentType), undefined, isPublic);
  }

  private async verifiedFile(objectPath: string, isPublic = false): Promise<StorageFile> {
    await this.init();
    const location = this.locations(objectPath, isPublic);
    let record: VerifiedRecord;
    try {
      const handle = await fs.open(location.metadata, constants.O_RDONLY | constants.O_NOFOLLOW);
      try {
        const info = await handle.stat();
        if (!info.isFile() || info.size > 4096) throw missing();
        record = JSON.parse(await handle.readFile("utf8"));
      } finally { await handle.close(); }
      const info = await fs.lstat(location.file);
      if (!info.isFile() || info.isSymbolicLink() || record.v !== 1 || record.objectPath !== objectPath ||
          !uploadLimit(record.contentType) || !Number.isSafeInteger(record.size) || record.size <= 0 ||
          record.size > uploadLimit(record.contentType) || info.size !== record.size) throw missing();
    } catch { throw missing(); }
    return {
      getMetadata: async () => [{ size: record.size, contentType: record.contentType }],
      createReadStream: options => createReadStream(location.file, {
        fd: openSync(location.file, constants.O_RDONLY | constants.O_NOFOLLOW),
        autoClose: true, ...(options ? { start: options.start, end: options.end } : {}),
      }),
    };
  }

  file(objectPath: string) { return this.verifiedFile(objectPath); }
  async response(objectPath: string, range?: string) { return fileResponse(await this.file(objectPath), range); }
  async publicResponse(filePath: string, range?: string) { return fileResponse(await this.verifiedFile(publicPath(filePath), true), range); }

  async delete(objectPath: string): Promise<void> {
    await this.init();
    const location = this.locations(objectPath);
    await fs.unlink(location.metadata).catch(error => { if (!isCode(error, "ENOENT")) throw error; });
    await fs.unlink(location.file).catch(error => { if (!isCode(error, "ENOENT")) throw error; });
  }

  private async cleanupExpired(): Promise<void> {
    if (Date.now() - this.lastCleanup < 60_000) return;
    this.lastCleanup = Date.now();
    for (const folder of [".tickets", ".claimed", ".tmp"]) {
      for (const name of await fs.readdir(path.join(this.root, folder))) {
        const file = path.join(this.root, folder, name);
        const info = await fs.lstat(file).catch(() => undefined);
        if (info && info.mtimeMs < Date.now() - UPLOAD_TTL_MS * 2) await fs.unlink(file).catch(() => undefined);
      }
    }
  }
}
