import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { NextFunction, Request, Response } from "express";
import { and, eq, gt, isNull } from "drizzle-orm";
import { adminSessionsTable, adminUsersTable, db, pageContentTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const scrypt = promisify(scryptCallback);

export const ADMIN_SESSION_COOKIE = "alwatan_admin_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

declare global {
  namespace Express {
    interface Request {
      adminUser?: typeof adminUsersTable.$inferSelect;
    }
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string | null): Promise<boolean> {
  if (!encoded) return false;
  const [saltHex, hashHex] = encoded.split(":");
  if (!saltHex || !hashHex) return false;
  try {
    const expected = Buffer.from(hashHex, "hex");
    const actual = (await scrypt(password, Buffer.from(saltHex, "hex"), expected.length)) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS,
  };
}

export async function createAdminSession(adminUserId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(adminSessionsTable).values({
    adminUserId,
    tokenHash: hashToken(token),
    expiresAt,
  });
  return { token, expiresAt };
}

export async function revokeAdminSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await db
    .update(adminSessionsTable)
    .set({ revokedAt: new Date() })
    .where(and(eq(adminSessionsTable.tokenHash, hashToken(token)), isNull(adminSessionsTable.revokedAt)));
}

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

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await getAdminFromToken(req.cookies?.[ADMIN_SESSION_COOKIE]);
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    req.adminUser = user;
    next();
  } catch (error) {
    req.log.error({ err: error }, "Admin authentication failed");
    res.status(401).json({ error: "Authentication required" });
  }
}

function allowedOrigins(req: Request): Set<string> {
  const configured = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const replit = [
    process.env.REPLIT_DEV_DOMAIN,
    ...(process.env.REPLIT_DOMAINS ?? "").split(","),
  ]
    .map((domain) => domain?.trim())
    .filter((domain): domain is string => Boolean(domain))
    .map((domain) => domain.startsWith("http") ? domain : `https://${domain}`);
  const host = req.get("host");
  const protocol = req.protocol;
  return new Set([
    ...configured,
    ...replit,
    ...(host ? [`${protocol}://${host}`] : []),
  ]);
}

export function requireSameOrigin(req: Request, res: Response, next: NextFunction): void {
  const origin = req.get("origin");
  if (origin && !allowedOrigins(req).has(origin)) {
    res.status(403).json({ error: "Cross-origin request rejected" });
    return;
  }
  next();
}

export async function bootstrapAdmin(): Promise<void> {
  await ensureAlwatanConstraints();
  await seedCmsDefaults();
  const [existing] = await db.select().from(adminUsersTable).limit(1);
  if (existing?.username && existing.passwordHash) return;
  if (!process.env.ADMIN_BOOTSTRAP_USERNAME || !process.env.ADMIN_BOOTSTRAP_PASSWORD) return;
  const username = process.env.ADMIN_BOOTSTRAP_USERNAME.trim();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!username || !password) return;
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim() || `${username}@localhost.invalid`;
  const passwordHash = await hashPassword(password);
  if (existing) {
    await db.update(adminUsersTable).set({
      username, email, name: username, passwordHash, role: "admin", isActive: true,
    }).where(eq(adminUsersTable.id, existing.id));
  } else {
    await db.insert(adminUsersTable).values({
      username, email, name: username, passwordHash, role: "admin", isActive: true,
    });
  }
}

async function seedCmsDefaults(): Promise<void> {
  const defaults = [
    ["home", "hero", "title", "خرسانة الوطن الجاهزة", "AlWatan Ready-Mix Concrete", "text"],
    ["home", "hero", "subtitle", "جودة موثوقة لكل مشروع", "Reliable quality for every project", "text"],
    ["home", "hero", "cta", "اطلب عرض سعر", "Request a quote", "text"],
    ["home", "company", "story", "نصنع الفرق في كل صبة", "We make a difference in every pour", "richtext"],
    ["home", "company", "vision", "أن نكون شريك البناء الأول في المملكة", "To be the Kingdom's first construction partner", "richtext"],
    ["home", "company", "mission", "تقديم خرسانة عالية الجودة بموثوقية وسرعة", "Deliver high-quality concrete with reliability and speed", "richtext"],
    ["about", "story", "story", "نمتلك خبرة تشغيلية عميقة في الخرسانة الجاهزة", "We bring deep operational expertise in ready-mix concrete", "richtext"],
    ["about", "values", "vision", "أن نكون الخيار الأكثر ثقة لمشاريع المملكة", "To be the most trusted choice for projects across the Kingdom", "richtext"],
    ["about", "values", "mission", "نخدم شركاءنا بجودة وسلامة والتزام", "Serve our partners with quality, safety, and commitment", "richtext"],
  ] as const;
  for (const [pageSlug, sectionKey, fieldKey, valueAr, valueEn, contentType] of defaults) {
    await db.insert(pageContentTable).values({ pageSlug, sectionKey, fieldKey, valueAr, valueEn, contentType })
      .onConflictDoNothing();
  }
  await db.execute(sql`
    UPDATE branches
    SET name_en = 'Al Nazim Branch'
    WHERE name_ar LIKE '%النظيم%' AND name_en <> 'Al Nazim Branch'
  `);
}

/** Completes constraints that cannot safely be inferred by a non-interactive drizzle push. */
async function ensureAlwatanConstraints(): Promise<void> {
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS certificates_certificate_number_unique
    ON certificates (certificate_number)
    WHERE certificate_number IS NOT NULL
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS page_content_page_section_field_unique
    ON page_content (page_slug, section_key, field_key)
  `);
}