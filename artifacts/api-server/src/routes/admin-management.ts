import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  adminUsersTable,
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
  };
}

router.get("/admin/branches", ...admin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(branchesTable).orderBy(asc(branchesTable.orderIndex));
  res.json(rows.map(mapBranch));
});
router.post("/branches", ...write, async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const required = ["nameAr", "nameEn", "addressAr", "addressEn", "city", "phone", "workingHours"];
  if (required.some((key) => !text(body[key]).trim()) || !Number.isFinite(Number(body.lat)) || !Number.isFinite(Number(body.lng))) {
    res.status(400).json({ error: "Invalid branch" }); return;
  }
  const [row] = await db.insert(branchesTable).values({
    nameAr: text(body.nameAr), nameEn: text(body.nameEn), addressAr: text(body.addressAr),
    addressEn: text(body.addressEn), city: text(body.city), lat: Number(body.lat), lng: Number(body.lng),
    phone: text(body.phone), workingHours: text(body.workingHours), orderIndex: Number(body.orderIndex) || 0,
  }).returning();
  res.status(201).json(mapBranch(row));
});
router.patch("/branches/:id", ...write, async (req, res): Promise<void> => {
  const id = asId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid branch id" }); return; }
  const body = req.body ?? {};
  const updates: Partial<typeof branchesTable.$inferInsert> = {};
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
  const [row] = await db.insert(adminUsersTable).values({
    username, email: text(body.email).trim(), name: text(body.name, username),
    role: text(body.role, "admin"), isActive: body.isActive !== false, passwordHash: await hashPassword(password),
  }).returning();
  res.status(201).json(publicUser(row));
});
router.patch("/admin/users/:id", ...write, async (req, res): Promise<void> => {
  const id = asId(req.params.id); if (!id) { res.status(400).json({ error: "Invalid user id" }); return; }
  const body = req.body ?? {};
  const updates: Partial<typeof adminUsersTable.$inferInsert> = {};
  for (const key of ["username", "name", "email", "role"] as const) if (body[key] !== undefined) updates[key] = text(body[key]);
  if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
  if (body.password) updates.passwordHash = await hashPassword(text(body.password));
  const [row] = await db.update(adminUsersTable).set(updates).where(eq(adminUsersTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Admin user not found" }); return; }
  res.json(publicUser(row));
});
router.patch("/admin/users/:id/status", ...write, async (req, res): Promise<void> => {
  const id = asId(req.params.id); if (!id || typeof req.body?.isActive !== "boolean") { res.status(400).json({ error: "isActive is required" }); return; }
  const [row] = await db.update(adminUsersTable).set({ isActive: req.body.isActive }).where(eq(adminUsersTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Admin user not found" }); return; }
  res.json(publicUser(row));
});
router.post("/admin/users/:id/password", ...write, async (req, res): Promise<void> => {
  const id = asId(req.params.id); const password = text(req.body?.password);
  if (!id || !password) { res.status(400).json({ error: "Password is required" }); return; }
  const [row] = await db.update(adminUsersTable).set({ passwordHash: await hashPassword(password) }).where(eq(adminUsersTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Admin user not found" }); return; }
  res.json(publicUser(row));
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