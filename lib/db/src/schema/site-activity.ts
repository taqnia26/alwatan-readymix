import { index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Anonymous browser-session activity only: no IP, names, email, or full URLs.
export const siteActivityTable = pgTable("site_activity", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  event: text("event").notNull(),
  path: text("path").notNull(),
  source: text("source").notNull().default("direct"),
  campaign: text("campaign").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index("site_activity_created_at_idx").on(table.createdAt),
  index("site_activity_event_date_idx").on(table.event, table.createdAt),
]);

export const insertSiteActivitySchema = createInsertSchema(siteActivityTable).omit({ id: true, createdAt: true });
export type SiteActivity = typeof siteActivityTable.$inferSelect;
