import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  adminUsersTable,
  adminSessionsTable,
  blogPostsTable,
  branchesTable,
  certificatesTable,
  contactMessagesTable,
  db,
  pageContentTable,
  productsTable,
  quoteRequestsTable,
  siteSettingsTable,
} from "@workspace/db";
import { hashPassword, requireAdmin, requireSameOrigin } from "../lib/auth";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { ACCESS_ROLES, ALL_PERMISSIONS, defaultPermissions } from "@workspace/api-zod";
import { validGoogleMapsUrl } from "../lib/access-control";

const router: IRouter = Router();
const admin = [requireAdmin] as const;
const write = [requireAdmin, requireSameOrigin] as const;

const asId = (value: unknown) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
};
const text = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
const asDate = (value: Date | null | undefined) => value ? value.toISOString() : null;

function mapBranch(row: typeof branchesTable.$inferSelect) {
  return { ...row };
}
function mapCertificate(row: typeof certificatesTable.$inferSelect) {
  return { ...row, createdAt: asDate(row.createdAt), updatedAt: asDate(row.updatedAt) };
}
function mapPost(row: typeof blogPostsTable.$inferSelect) {
  return { ...row, publishedAt: asDate(row.publishedAt), createdAt: asDate(row.createdAt), updatedAt: asDate(row.updatedAt) };
}
function publicUser(row: typeof adminUsersTable.$inferSelect) {
  return {
    id: row.id, username: row.username, name: row.name, email: row.email,
    role: row.role, isActive: row.isActive, createdAt: asDate(row.createdAt), updatedAt: asDate(row.updatedAt),
    permissions: row.permissions ?? [],
  };
}

function accessInput(body: Record<string, unknown>, existingRole = "custom") {
  const role = body.role === undefined ? existingRole : body.role;
  if (!ACCESS_ROLES.some(item => item.key === role)) return null;
  const raw = body.permissions === undefined ? defaultPermissions(String(role)) : body.permissions;
  if (!Array.isArray(raw) || raw.length > 40 || raw.some(value => typeof value !== "string" || !ALL_PERMISSIONS.includes(value))) return null;
  const permissions = [...new Set(raw as string[])];
  for (const value of [...permissions]) {
    if (value.endsWith(":edit") && !permissions.includes(value.replace(":edit", ":view"))) permissions.push(value.replace(":edit", ":view"));
  }
  return { role: String(role), permissions };
}

class UserUpdateError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
async function updateUserSafely(callerId: number, id: number, updates: Partial<typeof adminUsersTable.$inferInsert>) {
  return db.transaction(async tx => {
    // Serialize privilege changes so two administrators cannot remove the
    // last active administrator through concurrent requests.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(8726034)`);
    const [caller] = await tx.select().from(adminUsersTable).where(eq(adminUsersTable.id, callerId));
    if (!caller || !caller.isActive || caller.role !== "admin") throw new UserUpdateError(403, "إدارة المستخدمين لمدير النظام فقط");
    const [existing] = await tx.select().from(adminUsersTable).where(eq(adminUsersTable.id, id));
    if (!existing) throw new UserUpdateError(404, "المستخدم غير موجود");
    if (id === callerId && ((updates.role !== undefined && updates.role !== existing.role) || updates.isActive === false)) {
      throw new UserUpdateError(409, "لا يمكنك إيقاف حسابك أو تغيير دورك بنفسك");
    }
    if (existing.isActive && existing.role === "admin" && (updates.isActive === false || (updates.role !== undefined && updates.role !== "admin"))) {
      const admins = await tx.select({ id: adminUsersTable.id }).from(adminUsersTable).where(and(eq(adminUsersTable.role, "admin"), eq(adminUsersTable.isActive, true)));
      if (admins.length <= 1) throw new UserUpdateError(409, "يجب الإبقاء على مدير نظام نشط واحد على الأقل");
    }
    const [row] = await tx.update(adminUsersTable).set(updates).where(eq(adminUsersTable.id, id)).returning();
    if (updates.passwordHash || updates.isActive === false) {
      await tx.update(adminSessionsTable).set({ revokedAt: new Date() }).where(eq(adminSessionsTable.adminUserId, id));
    }
    return row;
  });
}
function userMutationFailure(error: unknown, res: import("express").Response): boolean {
  if (error instanceof UserUpdateError) { res.status(error.status).json({ error: error.message }); return true; }
  const code = (error as { code?: string; cause?: { code?: string } })?.cause?.code ?? (error as { code?: string })?.code;
  if (code === "23505") { res.status(409).json({ error: "اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل" }); return true; }
  return false;
}

router.get("/admin/branches", ...admin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(branchesTable).orderBy(asc(branchesTable.orderIndex));
  res.json(rows.map(mapBranch));
});
router.post("/branches", ...write, async (req, res): Promise<void> => {
  const body = req.body ?? {};
  if (!validGoogleMapsUrl(body.googleMapsUrl ?? "")) { res.status(400).json({ error: "رابط قوقل ماب غير صالح؛ استخدم رابط مشاركة HTTPS من Google Maps" }); return; }
  const required = ["nameAr", "nameEn", "addressAr", "addressEn", "city", "phone", "workingHours"];
  if (required.some((key) => !text(body[key]).trim()) || !Number.isFinite(Number(body.lat)) || !Number.isFinite(Number(body.lng))) {
    res.status(400).json({ error: "Invalid branch" }); return;
  }
  const [row] = await db.insert(branchesTable).values({
    nameAr: text(body.nameAr), nameEn: text(body.nameEn), addressAr: text(body.addressAr),
    addressEn: text(body.addressEn), city: text(body.city), lat: Number(body.lat), lng: Number(body.lng),
    phone: text(body.phone), workingHours: text(body.workingHours), orderIndex: Number(body.orderIndex) || 0,
    googleMapsUrl: text(body.googleMapsUrl).trim(),
  }).returning();
  res.status(201).json(mapBranch(row));
});
router.patch("/branches/:id", ...write, async (req, res): Promise<void> => {
  const id = asId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid branch id" }); return; }
  const body = req.body ?? {};
  const updates: Partial<typeof branchesTable.$inferInsert> = {};
  if (body.googleMapsUrl !== undefined) {
    if (!validGoogleMapsUrl(body.googleMapsUrl)) { res.status(400).json({ error: "رابط قوقل ماب غير صالح" }); return; }
    updates.googleMapsUrl = body.googleMapsUrl.trim();
  }
  for (const key of ["nameAr", "nameEn", "addressAr", "addressEn", "city", "phone", "workingHours"] as const) if (body[key] !== undefined) updates[key] = text(body[key]);
  for (const key of ["lat", "lng"] as const) if (body[key] !== undefined && Number.isFinite(Number(body[key]))) updates[key] = Number(body[key]);
  if (body.orderIndex !== undefined) updates.orderIndex = Number(body.orderIndex) || 0;
  const [row] = await db.update(branchesTable).set(updates).where(eq(branchesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Branch not found" }); return; }
  res.json(mapBranch(row));
});
router.delete("/branches/:id", ...write, async (req, res): Promise<void> => {
  const id = asId(req.params.id); if (!id) { res.status(400).json({ error: "Invalid branch id" }); return; }
  const [row] = await db.delete(branchesTable).where(eq(branchesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Branch not found" }); return; }
  res.status(204).end();
});

router.get("/admin/certificates", ...admin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(certificatesTable).orderBy(asc(certificatesTable.id));
  res.json(rows.map(mapCertificate));
});
router.post("/certificates", ...write, async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const required = ["titleAr", "titleEn", "descriptionAr", "descriptionEn", "issuedBy", "issuedDate"];
  if (required.some((key) => !text(body[key]).trim())) { res.status(400).json({ error: "Invalid certificate" }); return; }
  const [row] = await db.insert(certificatesTable).values({
    certificateNumber: body.certificateNumber == null ? null : text(body.certificateNumber),
    titleAr: text(body.titleAr), titleEn: text(body.titleEn), descriptionAr: text(body.descriptionAr),
    descriptionEn: text(body.descriptionEn), imageUrl: text(body.imageUrl), fileUrl: text(body.fileUrl),
    issuedBy: text(body.issuedBy), issuedDate: text(body.issuedDate),
  }).returning();
  res.status(201).json(mapCertificate(row));
});
router.patch("/certificates/:id", ...write, async (req, res): Promise<void> => {
  const id = asId(req.params.id); if (!id) { res.status(400).json({ error: "Invalid certificate id" }); return; }
  const body = req.body ?? {};
  const updates: Partial<typeof certificatesTable.$inferInsert> = {};
  for (const key of ["certificateNumber", "titleAr", "titleEn", "descriptionAr", "descriptionEn", "imageUrl", "fileUrl", "issuedBy", "issuedDate"] as const) {
    if (body[key] !== undefined) (updates as Record<string, unknown>)[key] = body[key] == null ? null : text(body[key]);
  }
  const [row] = await db.update(certificatesTable).set(updates).where(eq(certificatesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Certificate not found" }); return; }
  res.json(mapCertificate(row));
});
router.delete("/certificates/:id", ...write, async (req, res): Promise<void> => {
  const id = asId(req.params.id); if (!id) { res.status(400).json({ error: "Invalid certificate id" }); return; }
  const [row] = await db.delete(certificatesTable).where(eq(certificatesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Certificate not found" }); return; }
  res.status(204).end();
});

router.get("/admin/blog", ...admin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(blogPostsTable).orderBy(desc(blogPostsTable.createdAt));
  res.json(rows.map(mapPost));
});
router.patch("/blog/:slug", ...write, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [existing] = await db.select().from(blogPostsTable).where(eq(blogPostsTable.slug, slug));
  if (!existing) { res.status(404).json({ error: "Blog post not found" }); return; }
  const body = req.body ?? {};
  const updates: Partial<typeof blogPostsTable.$inferInsert> = {};
  for (const key of ["titleAr", "titleEn", "excerptAr", "excerptEn", "contentAr", "contentEn", "slug", "coverImage"] as const) if (body[key] !== undefined) updates[key] = text(body[key]);
  if (body.status === "draft" || body.status === "published") {
    updates.status = body.status;
    updates.publishedAt = body.status === "published" ? (existing.publishedAt ?? new Date()) : null;
  }
  const [row] = await db.update(blogPostsTable).set(updates).where(eq(blogPostsTable.id, existing.id)).returning();
  res.json(mapPost(row));
});
router.delete("/blog/:slug", ...write, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [row] = await db.delete(blogPostsTable).where(eq(blogPostsTable.slug, slug)).returning();
  if (!row) { res.status(404).json({ error: "Blog post not found" }); return; }
  res.status(204).end();
});

router.get("/admin/users", ...admin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(adminUsersTable).orderBy(asc(adminUsersTable.id));
  res.json(rows.map(publicUser));
});
router.post("/admin/users", ...write, async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const username = text(body.username).trim(), password = text(body.password);
  if (!username || !password || !text(body.email).trim()) { res.status(400).json({ error: "Username, email and password are required" }); return; }
  const access = accessInput(body);
  if (!access) { res.status(400).json({ error: "الدور أو الصلاحيات غير صالحة" }); return; }
  try {
  const [row] = await db.insert(adminUsersTable).values({
    username, email: text(body.email).trim(), name: text(body.name, username),
    ...access, isActive: body.isActive !== false, passwordHash: await hashPassword(password),
  }).returning();
  res.status(201).json(publicUser(row));
  } catch (error) { if (!userMutationFailure(error, res)) throw error; }
});
router.patch("/admin/users/:id", ...write, async (req, res): Promise<void> => {
  const id = asId(req.params.id); if (!id) { res.status(400).json({ error: "Invalid user id" }); return; }
  const body = req.body ?? {};
  const updates: Partial<typeof adminUsersTable.$inferInsert> = {};
  for (const key of ["username", "name", "email"] as const) if (body[key] !== undefined) {
    if (typeof body[key] !== "string" || !body[key].trim()) { res.status(400).json({ error: "بيانات المستخدم غير صالحة" }); return; }
    updates[key] = body[key].trim();
  }
  if (body.role !== undefined || body.permissions !== undefined) {
    const [existing] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.id, id));
    if (!existing) { res.status(404).json({ error: "المستخدم غير موجود" }); return; }
    const access = accessInput({ role: body.role ?? existing.role, permissions: body.permissions ?? existing.permissions }, existing.role);
    if (!access) { res.status(400).json({ error: "الدور أو الصلاحيات غير صالحة" }); return; }
    Object.assign(updates, access);
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") { res.status(400).json({ error: "حالة المستخدم غير صالحة" }); return; }
    updates.isActive = body.isActive;
  }
  if (body.password) updates.passwordHash = await hashPassword(text(body.password));
  if (!Object.keys(updates).length) { res.status(400).json({ error: "لا توجد تعديلات" }); return; }
  try { res.json(publicUser(await updateUserSafely(req.adminUser!.id, id, updates))); }
  catch (error) { if (!userMutationFailure(error, res)) throw error; }
});
router.patch("/admin/users/:id/status", ...write, async (req, res): Promise<void> => {
  const id = asId(req.params.id); if (!id || typeof req.body?.isActive !== "boolean") { res.status(400).json({ error: "isActive is required" }); return; }
  try { res.json(publicUser(await updateUserSafely(req.adminUser!.id, id, { isActive: req.body.isActive }))); }
  catch (error) { if (!userMutationFailure(error, res)) throw error; }
});
router.post("/admin/users/:id/password", ...write, async (req, res): Promise<void> => {
  const id = asId(req.params.id); const password = text(req.body?.password);
  if (!id || !password) { res.status(400).json({ error: "Password is required" }); return; }
  try { res.json(publicUser(await updateUserSafely(req.adminUser!.id, id, { passwordHash: await hashPassword(password) }))); }
  catch (error) { if (!userMutationFailure(error, res)) throw error; }
});

router.get("/admin/quotes.csv", ...admin, async (req, res): Promise<void> => {
  const rows = await db.select().from(quoteRequestsTable).orderBy(desc(quoteRequestsTable.createdAt));
  const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const header = ["id", "productId", "quantityEstimate", "projectLocation", "fullName", "phone", "email", "notes", "status", "createdAt"];
  const body = rows.map((row) => [row.id, row.productId, row.quantityEstimate, row.projectLocation, row.fullName, row.phone, row.email, row.notes, row.status, row.createdAt.toISOString()].map(csvCell).join(","));
  res.type("text/csv; charset=utf-8").send(`\uFEFF${header.join(",")}\n${body.join("\n")}\n`);
});
router.get("/admin/quotes/:id", ...admin, async (req, res): Promise<void> => {
  const id = asId(req.params.id); if (!id) { res.status(400).json({ error: "Invalid quote id" }); return; }
  const [row] = await db.select().from(quoteRequestsTable).where(eq(quoteRequestsTable.id, id));
  if (!row) { res.status(404).json({ error: "Quote request not found" }); return; }
  const [product] = await db.select({ nameAr: productsTable.nameAr }).from(productsTable).where(eq(productsTable.id, row.productId));
  res.json({ ...row, productName: product?.nameAr ?? "", createdAt: asDate(row.createdAt), updatedAt: asDate(row.updatedAt) });
});
router.delete("/admin/quotes/:id", ...write, async (req, res): Promise<void> => {
  const id = asId(req.params.id); if (!id) { res.status(400).json({ error: "Invalid quote id" }); return; }
  const [row] = await db.delete(quoteRequestsTable).where(eq(quoteRequestsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Quote request not found" }); return; }
  res.status(204).end();
});

router.get("/admin/settings", ...admin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(siteSettingsTable);
  res.json(Object.fromEntries(rows.filter(row => !row.key.startsWith("studio_")).map((row) => [row.key, row.value])));
});
router.patch("/admin/settings", ...write, async (req, res): Promise<void> => {
  const values = req.body && typeof req.body === "object" ? req.body : {};
  for (const [key, value] of Object.entries(values)) {
    if (typeof value !== "string" || key.startsWith("studio_")) continue;
    await db.insert(siteSettingsTable).values({ key, value }).onConflictDoUpdate({ target: siteSettingsTable.key, set: { value } });
  }
  const rows = await db.select().from(siteSettingsTable);
  res.json(Object.fromEntries(rows.filter(row => !row.key.startsWith("studio_")).map((row) => [row.key, row.value])));
});

router.post("/contact", async (req, res): Promise<void> => {
  const body = req.body ?? {};
  if (!text(body.fullName).trim() || !text(body.email).trim() || !text(body.message).trim()) {
    res.status(400).json({ error: "Name, email and message are required" }); return;
  }
  const [row] = await db.insert(contactMessagesTable).values({
    fullName: text(body.fullName), email: text(body.email), phone: text(body.phone),
    subject: text(body.subject), message: text(body.message),
  }).returning();
  req.log.info({ contactMessageId: row.id }, "Contact message received");
  try {
    const [recipientSetting] = await db.select({ value: siteSettingsTable.value })
      .from(siteSettingsTable).where(eq(siteSettingsTable.key, "quoteEmail"));
    const recipient = process.env.CONTACT_NOTIFICATION_EMAIL || recipientSetting?.value;
    const sender = process.env.CONTACT_FROM_EMAIL;
    if (recipient) {
      const emailPayload: Record<string, unknown> = {
        to: [recipient],
        subject: text(body.subject, "New AlWatan contact message"),
        text: `${text(body.fullName)} (${text(body.email)})\n\n${text(body.message)}`,
      };
      if (sender) emailPayload.from = sender;
      const response = await new ReplitConnectors().proxy("resend", "/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: emailPayload,
      });
      if (!response.ok) req.log.warn({ status: response.status, contactMessageId: row.id }, "Contact notification email was rejected");
    } else {
      req.log.warn({ contactMessageId: row.id }, "Contact notification email not configured");
    }
  } catch (error) {
    req.log.error({ err: error, contactMessageId: row.id }, "Contact notification email failed");
  }
  res.status(201).json({ id: row.id, submitted: true });
});
router.get("/admin/contact", ...admin, async (req, res): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1), pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const filters = [status ? eq(contactMessagesTable.status, status) : undefined, search ? or(ilike(contactMessagesTable.fullName, `%${search}%`), ilike(contactMessagesTable.email, `%${search}%`), ilike(contactMessagesTable.message, `%${search}%`)) : undefined].filter(Boolean);
  const where = filters.length ? and(...filters as [ReturnType<typeof eq>, ...ReturnType<typeof eq>[]]) : undefined;
  const [items, totalRows] = await Promise.all([
    db.select().from(contactMessagesTable).where(where).orderBy(desc(contactMessagesTable.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(contactMessagesTable).where(where),
  ]);
  res.json({ page, pageSize, total: Number(totalRows[0]?.count ?? 0), items: items.map((item) => ({ ...item, createdAt: asDate(item.createdAt), updatedAt: asDate(item.updatedAt) })) });
});
router.get("/admin/contact/:id", ...admin, async (req, res): Promise<void> => {
  const id = asId(req.params.id); if (!id) { res.status(400).json({ error: "Invalid contact message id" }); return; }
  const [row] = await db.select().from(contactMessagesTable).where(eq(contactMessagesTable.id, id));
  if (!row) { res.status(404).json({ error: "Contact message not found" }); return; }
  res.json({ ...row, createdAt: asDate(row.createdAt), updatedAt: asDate(row.updatedAt) });
});
router.patch("/admin/contact/:id", ...write, async (req, res): Promise<void> => {
  const id = asId(req.params.id); const status = text(req.body?.status);
  if (!id || !status) { res.status(400).json({ error: "Status is required" }); return; }
  const [row] = await db.update(contactMessagesTable).set({ status }).where(eq(contactMessagesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Contact message not found" }); return; }
  res.json({ ...row, createdAt: asDate(row.createdAt), updatedAt: asDate(row.updatedAt) });
});
router.delete("/admin/contact/:id", ...write, async (req, res): Promise<void> => {
  const id = asId(req.params.id); if (!id) { res.status(400).json({ error: "Invalid contact message id" }); return; }
  const [row] = await db.delete(contactMessagesTable).where(eq(contactMessagesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Contact message not found" }); return; }
  res.status(204).end();
});

router.post("/admin/content/upsert", ...write, async (req, res): Promise<void> => {
  const body = req.body ?? {};
  if (!text(body.pageSlug) || !text(body.sectionKey) || !text(body.fieldKey)) { res.status(400).json({ error: "Page, section and field are required" }); return; }
  const [row] = await db.insert(pageContentTable).values({
    pageSlug: text(body.pageSlug), sectionKey: text(body.sectionKey), fieldKey: text(body.fieldKey),
    valueAr: text(body.valueAr), valueEn: text(body.valueEn), contentType: ["text", "richtext", "url"].includes(body.contentType) ? body.contentType : "text",
    updatedBy: req.adminUser?.id,
  }).onConflictDoUpdate({ target: [pageContentTable.pageSlug, pageContentTable.sectionKey, pageContentTable.fieldKey], set: { valueAr: text(body.valueAr), valueEn: text(body.valueEn), contentType: body.contentType, updatedBy: req.adminUser?.id, updatedAt: new Date() } }).returning();
  res.json({ ...row, updatedAt: asDate(row.updatedAt) });
});

export default router;