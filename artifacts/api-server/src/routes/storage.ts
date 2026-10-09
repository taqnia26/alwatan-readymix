import { requireAdmin, requireSameOrigin } from "../lib/auth";
import { objectStorage } from "../lib/objectStorage";
import { mediaRepository } from "../lib/media-repository";
import { createStorageRouter } from "./storage-router";

export default createStorageRouter(objectStorage, mediaRepository, requireAdmin, requireSameOrigin);
