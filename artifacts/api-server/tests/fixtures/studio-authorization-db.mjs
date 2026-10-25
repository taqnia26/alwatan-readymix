import { db as storage } from "./studio-db.mjs";
export * from "./studio-db.mjs";
export const adminUsersTable = {};
export const adminSessionsTable = {};
export const cmsCalls = [];
export function resetCmsCalls() { cmsCalls.length = 0; }
// Any unexpected persistence operation fails; no connection or SQL is available.
export const db = {
  select(...args) { cmsCalls.push("select"); return storage.select(...args); },
  insert(...args) { cmsCalls.push("insert"); return storage.insert(...args); },
  transaction(fn) { cmsCalls.push("transaction"); return storage.transaction(() => fn(db)); },
  execute(query) { cmsCalls.push("lock"); return storage.execute(query); },
};
