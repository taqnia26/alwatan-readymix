// This module replaces @workspace/db at bundle time. No pool, connection,
// SQL execution, or workspace data can be reached by this test suite.
import { pgTable, text } from "drizzle-orm/pg-core";

export const siteSettingsTable = pgTable("fixture_settings", { key: text("key"), value: text("value") });
export const pageContentTable = pgTable("fixture_content", { pageSlug: text("page_slug") });
export const auditLogTable = {};
export const blogPostsTable = {};
export const branchesTable = {};
export const certificatesTable = {};
export const productsTable = {};
export const quoteRequestsTable = {};

let settings = [];
let content = [];
let audit = [];
export function resetFixture(rows = [], copy = []) {
  settings = structuredClone(rows);
  content = structuredClone(copy);
  audit = [];
}
export function snapshotFixture() { return structuredClone({ settings, content, audit }); }

export const db = {
  select() {
    return {
      from(table) {
        if (table !== siteSettingsTable && table !== pageContentTable) throw new Error("Unexpected fixture read");
        const rows = () => structuredClone(table === siteSettingsTable ? settings : content);
        return { where: () => Promise.resolve(rows()), then: (resolve, reject) => Promise.resolve(rows()).then(resolve, reject) };
      },
    };
  },
  insert(table) {
    return {
      values(row) {
        if (table === auditLogTable) { audit.push(structuredClone(row)); return Promise.resolve(); }
        if (table !== siteSettingsTable) throw new Error("Unexpected fixture write");
        return {
          async onConflictDoUpdate() {
            const i = settings.findIndex(item => item.key === row.key);
            if (i < 0) settings.push(structuredClone(row));
            else settings[i] = structuredClone(row);
          },
        };
      },
    };
  },
  async transaction(fn) {
    const before = snapshotFixture();
    try { return await fn(db); }
    catch (error) {
      settings = before.settings; content = before.content; audit = before.audit;
      throw error;
    }
  },
};
