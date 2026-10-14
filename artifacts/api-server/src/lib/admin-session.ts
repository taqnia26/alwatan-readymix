import { createHash } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { adminSessionsTable, adminUsersTable, db } from "@workspace/db";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Session persistence boundary; authorization remains in requireAdmin. */
export async function getAdminFromToken(token: string | undefined) {
  if (!token) return undefined;
  const [row] = await db
    .select({ session: adminSessionsTable, user: adminUsersTable })
    .from(adminSessionsTable)
    .innerJoin(adminUsersTable, eq(adminSessionsTable.adminUserId, adminUsersTable.id))
    .where(
      and(
        eq(adminSessionsTable.tokenHash, hashToken(token)),
        isNull(adminSessionsTable.revokedAt),
        gt(adminSessionsTable.expiresAt, new Date()),
        eq(adminUsersTable.isActive, true),
      ),
    );
  if (!row) return undefined;
  await db
    .update(adminSessionsTable)
    .set({ lastUsedAt: new Date() })
    .where(eq(adminSessionsTable.id, row.session.id));
  return row.user;
}
