import { LocalObjectStorage } from "./storage/local";
import { ReplitObjectStorage } from "./storage/replit";
import type { StorageService } from "./storage/types";

export function createObjectStorage(driver = process.env.MEDIA_STORAGE_DRIVER ?? "local", root?: string): StorageService {
  if (driver === "local") return new LocalObjectStorage(root);
  if (driver === "replit") return new ReplitObjectStorage();
  throw new Error("MEDIA_STORAGE_DRIVER must be local or replit");
}

export const objectStorage = createObjectStorage();
