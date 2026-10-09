import { eq } from "drizzle-orm";
import { blogPostsTable, certificatesTable, db, mediaAssetsTable, productsTable, pageContentTable, siteSettingsTable } from "@workspace/db";
import type { MediaRepository } from "./storage/types";

/** Existing database schema/queries; kept separate so storage tests need no database. */
export const mediaRepository: MediaRepository = {
  list: () => db.select().from(mediaAssetsTable).orderBy(mediaAssetsTable.createdAt),
  async find(id) {
    const [asset] = await db.select().from(mediaAssetsTable).where(eq(mediaAssetsTable.id, id));
    return asset;
  },
  async finalize(input) {
    const [asset] = await db.insert(mediaAssetsTable).values(input).onConflictDoUpdate({
      target: mediaAssetsTable.objectPath,
      set: {
        originalName: input.originalName, contentType: input.contentType,
        size: input.size, altText: input.altText, updatedAt: new Date(),
      },
    }).returning();
    return asset;
  },
  async referenceValues() {
    const [products, posts, certificates, content, settings] = await Promise.all([
      db.select({ value: productsTable.imageUrl }).from(productsTable),
      db.select({ value: blogPostsTable.coverImage }).from(blogPostsTable),
      db.select({ image: certificatesTable.imageUrl, file: certificatesTable.fileUrl }).from(certificatesTable),
      db.select({ ar: pageContentTable.valueAr, en: pageContentTable.valueEn }).from(pageContentTable),
      db.select({ value: siteSettingsTable.value }).from(siteSettingsTable),
    ]);
    return [
      ...products.map(row => row.value), ...posts.map(row => row.value),
      ...certificates.flatMap(row => [row.image, row.file]),
      ...content.flatMap(row => [row.ar, row.en]), ...settings.map(row => row.value),
    ].filter((value): value is string => typeof value === "string");
  },
  async delete(id) { await db.delete(mediaAssetsTable).where(eq(mediaAssetsTable.id, id)); },
};
