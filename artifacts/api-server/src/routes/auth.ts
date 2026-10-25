import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { adminUsersTable, db } from "@workspace/db";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  getAdminFromToken,
  requireSameOrigin,
  revokeAdminSession,
  sessionCookieOptions,
  verifyPassword,
} from "../lib/auth";

const router: IRouter = Router();

function publicAdmin(user: typeof adminUsersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions ?? [],
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

router.post("/auth/login", requireSameOrigin, async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const [user] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.username, username));
  if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const session = await createAdminSession(user.id);
  res.cookie(ADMIN_SESSION_COOKIE, session.token, sessionCookieOptions());
  res.json({ user: publicAdmin(user), expiresAt: session.expiresAt.toISOString() });
});

router.post("/auth/logout", requireSameOrigin, async (req, res): Promise<void> => {
  await revokeAdminSession(req.cookies?.[ADMIN_SESSION_COOKIE]);
  res.clearCookie(ADMIN_SESSION_COOKIE, sessionCookieOptions());
  res.status(204).end();
});

router.get("/auth/me", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const user = await getAdminFromToken(req.cookies?.[ADMIN_SESSION_COOKIE]);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.json({ user: publicAdmin(user) });
});

export default router;