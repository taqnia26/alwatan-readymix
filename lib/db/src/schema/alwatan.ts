import {
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const quoteStatusEnum = pgEnum("quote_status", [
  "new",
  "contacted",
  "closed",
]);

export const postStatusEnum = pgEnum("post_status", ["draft", "published"]);

export const contentTypeEnum = pgEnum("content_type", [
  "text",
  "richtext",
  "url",
]);

export const adminUsersTable = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug").notNull().unique(),
  descriptionAr: text("description_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
  specsAr: text("specs_ar").notNull(),
  specsEn: text("specs_en").notNull(),
  imageUrl: text("image_url").notNull(),
  compressiveStrength: text("compressive_strength").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const branchesTable = pgTable("branches", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  addressAr: text("address_ar").notNull(),
  addressEn: text("address_en").notNull(),
  city: text("city").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  phone: text("phone").notNull(),
  workingHours: text("working_hours").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
});

export const certificatesTable = pgTable("certificates", {
  id: serial("id").primaryKey(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  descriptionAr: text("description_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
  imageUrl: text("image_url").notNull(),
  issuedBy: text("issued_by").notNull(),
  issuedDate: text("issued_date").notNull(),
});

export const quoteRequestsTable = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  quantityEstimate: text("quantity_estimate").notNull(),
  projectLocation: text("project_location").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  notes: text("notes").notNull().default(""),
  status: quoteStatusEnum("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const blogPostsTable = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  excerptAr: text("excerpt_ar").notNull(),
  excerptEn: text("excerpt_en").notNull(),
  contentAr: text("content_ar").notNull(),
  contentEn: text("content_en").notNull(),
  slug: text("slug").notNull().unique(),
  coverImage: text("cover_image").notNull(),
  status: postStatusEnum("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  authorId: integer("author_id"),
});

export const pageContentTable = pgTable("page_content", {
  id: serial("id").primaryKey(),
  pageSlug: text("page_slug").notNull(),
  sectionKey: text("section_key").notNull(),
  fieldKey: text("field_key").notNull(),
  valueAr: text("value_ar").notNull(),
  valueEn: text("value_en").notNull(),
  contentType: contentTypeEnum("content_type").notNull().default("text"),
  updatedBy: integer("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const auditLogTable = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});