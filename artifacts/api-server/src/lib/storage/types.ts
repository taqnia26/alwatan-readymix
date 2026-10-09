import type { Readable } from "node:stream";

export interface UploadRequest {
  contentType: string;
  size: number;
}

export interface StorageMetadata {
  contentType: string;
  size: string | number;
}

export interface StorageFile {
  getMetadata(): Promise<[StorageMetadata]>;
  createReadStream(options?: { start?: number; end?: number; validation?: false }): Readable;
}

export interface StorageService {
  readonly driver: "local" | "replit";
  uploadUrl(input: UploadRequest, options?: { endpoint: string }): Promise<{ uploadURL: string; objectPath: string }>;
  file(objectPath: string): Promise<StorageFile>;
  response(objectPath: string, range?: string): Promise<Response>;
  publicResponse(filePath: string, range?: string): Promise<Response>;
  delete(objectPath: string): Promise<void>;
  receiveUpload?(token: string, source: Readable, contentType: string, contentLength?: string): Promise<void>;
}

export interface MediaRecord {
  id: number;
  objectPath: string;
  [key: string]: unknown;
}

export interface MediaInput {
  objectPath: string;
  originalName: string;
  contentType: string;
  size: number;
  altText: string;
  createdBy?: number;
}

export interface MediaRepository {
  list(): Promise<MediaRecord[]>;
  find(id: number): Promise<MediaRecord | undefined>;
  finalize(input: MediaInput): Promise<MediaRecord>;
  referenceValues(): Promise<string[]>;
  delete(id: number): Promise<void>;
}
