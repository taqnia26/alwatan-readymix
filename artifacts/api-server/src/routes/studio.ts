import { Router, type IRouter } from "express";
import { db, siteSettingsTable, auditLogTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { SaveStudioDraftBody } from "@workspace/api-zod";
import { requireAdmin, requireSameOrigin } from "../lib/auth";
import { readStudio, STUDIO_KEYS, validateStudioLinks } from "../lib/site-studio";
import { studioForUser, scopedStudioSave, mayPublishStudio } from "../lib/studio-access";

const router: IRouter = Router();
const write = [requireAdmin, requireSameOrigin] as const;

router.get("/public/studio", async (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const state = await readStudio();
  // Only published pages and visible media are exposed to anonymous visitors.
  res.json({ ...state.published,
    pages: state.published.pages.filter(page => page.published),
    navigation: state.published.navigation.filter(item => item.visible &&
      (!(item.href.startsWith("/p/") || item.href === "/about") ||
        state.published.pages.some(page => page.published &&
          item.href === (page.slug === "about" ? "/about" : `/p/${page.slug}`)))),
    slides: state.published.slides.filter(slide => slide.enabled),
    videos: state.published.videos.filter(video => video.enabled),
    campaigns: [],
  });
});

router.get("/admin/studio", requireAdmin, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(studioForUser(await readStudio(), req.adminUser));
});

router.put("/admin/studio", ...write, async (req, res) => {
  const parsed = SaveStudioDraftBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "بيانات الموقع غير صالحة", details: parsed.error.flatten() }); return; }
  const timestamp = new Date().toISOString();
  await db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(8726035)`);
    // Read through the locked transaction connection, never the global pool:
    // waiting writers may already occupy its remaining connections.
    const config = scopedStudioSave(await readStudio(tx), parsed.data.config, req.adminUser);
    if (!config) { res.status(403).json({ error: "تتضمن المسودة تعديلات في أقسام لا تملك صلاحية تعديلها" }); return; }
    const error = validateStudioLinks(config);
    if (error) { res.status(400).json({ error }); return; }
    for (const [key, value] of [[STUDIO_KEYS.draft, JSON.stringify(config)], [STUDIO_KEYS.updatedAt, timestamp]]) {
      await tx.insert(siteSettingsTable).values({ key, value }).onConflictDoUpdate({ target: siteSettingsTable.key, set: { value } });
    }
  });
  if (!res.headersSent) res.json(studioForUser(await readStudio(), req.adminUser));
});

router.post("/admin/studio/publish", ...write, async (req, res) => {
  await db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(8726035)`);
    const state = await readStudio(tx);
    if (!mayPublishStudio(state, req.adminUser)) { res.status(403).json({ error: "لا يمكنك نشر تعديلات أقسام خارج صلاحياتك؛ اطلب النشر من مدير النظام" }); return; }
    const error = validateStudioLinks(state.draft);
    if (error) { res.status(400).json({ error }); return; }
    for (const [key, value] of [[STUDIO_KEYS.published, JSON.stringify(state.draft)], [STUDIO_KEYS.publishedAt, new Date().toISOString()]]) {
      await tx.insert(siteSettingsTable).values({ key, value }).onConflictDoUpdate({ target: siteSettingsTable.key, set: { value } });
    }
    await tx.insert(auditLogTable).values({ adminUserId: req.adminUser?.id, action: "publish", entityType: "site_studio" });
  });
  if (!res.headersSent) res.json(studioForUser(await readStudio(), req.adminUser));
});

export default router;
