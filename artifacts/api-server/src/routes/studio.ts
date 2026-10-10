import { Router, type IRouter } from "express";
import { db, siteSettingsTable, auditLogTable } from "@workspace/db";
import { SaveStudioDraftBody } from "@workspace/api-zod";
import { requireAdmin, requireSameOrigin } from "../lib/auth";
import { readStudio, STUDIO_KEYS, validateStudioLinks } from "../lib/site-studio";

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

router.get("/admin/studio", requireAdmin, async (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(await readStudio());
});

router.put("/admin/studio", ...write, async (req, res) => {
  const parsed = SaveStudioDraftBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "بيانات الموقع غير صالحة", details: parsed.error.flatten() }); return; }
  const error = validateStudioLinks(parsed.data.config);
  if (error) { res.status(400).json({ error }); return; }
  const timestamp = new Date().toISOString();
  await db.transaction(async tx => {
    for (const [key, value] of [[STUDIO_KEYS.draft, JSON.stringify(parsed.data.config)], [STUDIO_KEYS.updatedAt, timestamp]]) {
      await tx.insert(siteSettingsTable).values({ key, value }).onConflictDoUpdate({ target: siteSettingsTable.key, set: { value } });
    }
  });
  res.json(await readStudio());
});

router.post("/admin/studio/publish", ...write, async (req, res) => {
  const state = await readStudio();
  const error = validateStudioLinks(state.draft);
  if (error) { res.status(400).json({ error }); return; }
  await db.transaction(async tx => {
    for (const [key, value] of [[STUDIO_KEYS.published, JSON.stringify(state.draft)], [STUDIO_KEYS.publishedAt, new Date().toISOString()]]) {
      await tx.insert(siteSettingsTable).values({ key, value }).onConflictDoUpdate({ target: siteSettingsTable.key, set: { value } });
    }
    await tx.insert(auditLogTable).values({ adminUserId: req.adminUser?.id, action: "publish", entityType: "site_studio" });
  });
  res.json(await readStudio());
});

export default router;
