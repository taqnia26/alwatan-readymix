import { Router, type IRouter } from "express";
import { db, siteActivityTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { RecordSiteActivityBody } from "@workspace/api-zod";
import { requireAdmin, requireSameOrigin } from "../lib/auth";

const router: IRouter = Router();
const buckets = new Map<string, { count: number; until: number }>();

router.post("/public/activity", requireSameOrigin, async (req, res) => {
  const parsed = RecordSiteActivityBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid activity" }); return; }
  const event = parsed.data;
  if (!/^\/[a-zA-Z0-9/_-]*$/.test(event.path) || event.path.startsWith("/admin") ||
    !/^[a-zA-Z0-9-]{16,80}$/.test(event.sessionId) ||
    !/^[a-zA-Z0-9._-]{0,100}$/.test(event.source) ||
    !/^[a-zA-Z0-9_-]{0,100}$/.test(event.campaign)) {
    res.status(400).json({ error: "Invalid activity dimensions" }); return;
  }
  const now = Date.now();
  if (buckets.size > 5000) for (const [key, value] of buckets) if (value.until < now) buckets.delete(key);
  const key = req.ip || "unknown";
  const bucket = buckets.get(key);
  if (bucket && bucket.until > now && bucket.count >= 120) { res.status(429).end(); return; }
  buckets.set(key, bucket && bucket.until > now ? { ...bucket, count: bucket.count + 1 } : { count: 1, until: now + 60000 });
  if (buckets.size > 10000) buckets.delete(buckets.keys().next().value!);
  await db.insert(siteActivityTable).values(event);
  res.status(204).end();
});

router.get("/admin/insights", requireAdmin, async (req, res) => {
  const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days + 1);
  since.setUTCHours(0, 0, 0, 0);
  const [totals, quoteTotal, messageTotal, activityDays, quoteDays, messageDays, statuses, pages, campaigns] = await Promise.all([
    db.execute(sql`SELECT
      count(*) FILTER (WHERE event='page_view')::int AS views,
      count(DISTINCT session_id) FILTER (WHERE event='page_view')::int AS sessions,
      count(*) FILTER (WHERE event='whatsapp_click')::int AS whatsapp,
      count(*) FILTER (WHERE event='profile_download')::int AS downloads
      FROM site_activity WHERE created_at >= ${since}`),
    db.execute(sql`SELECT count(*)::int AS count FROM quote_requests WHERE created_at >= ${since}`),
    db.execute(sql`SELECT count(*)::int AS count FROM contact_messages WHERE created_at >= ${since}`),
    db.execute(sql`SELECT to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS date, count(*)::int AS count FROM site_activity WHERE created_at >= ${since} AND event='page_view' GROUP BY 1`),
    db.execute(sql`SELECT to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS date, count(*)::int AS count FROM quote_requests WHERE created_at >= ${since} GROUP BY 1`),
    db.execute(sql`SELECT to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS date, count(*)::int AS count FROM contact_messages WHERE created_at >= ${since} GROUP BY 1`),
    db.execute(sql`SELECT status AS name, count(*)::int AS count FROM quote_requests WHERE created_at >= ${since} GROUP BY status`),
    db.execute(sql`SELECT path AS name, count(*)::int AS count FROM site_activity WHERE created_at >= ${since} AND event='page_view' GROUP BY path ORDER BY count DESC LIMIT 10`),
    db.execute(sql`SELECT campaign AS name, count(*)::int AS count FROM site_activity WHERE created_at >= ${since} AND event='page_view' AND campaign <> '' GROUP BY campaign ORDER BY count DESC LIMIT 20`),
  ]);
  const daily = (rows: Record<string, unknown>[]) => new Map(rows.map(row => [String(row.date), Number(row.count)]));
  const viewMap = daily(activityDays.rows), quoteMap = daily(quoteDays.rows), messageMap = daily(messageDays.rows);
  const timeline = Array.from({ length: days }, (_, i) => {
    const day = new Date(since); day.setUTCDate(day.getUTCDate() + i);
    const date = day.toISOString().slice(0, 10);
    return { date, views: viewMap.get(date) || 0, quotes: quoteMap.get(date) || 0, messages: messageMap.get(date) || 0 };
  });
  const total = totals.rows[0];
  const counts = (rows: Record<string, unknown>[]) => rows.map(row => ({ name: String(row.name), count: Number(row.count) }));
  res.setHeader("Cache-Control", "no-store");
  res.json({
    days, views: Number(total.views), sessions: Number(total.sessions),
    whatsappClicks: Number(total.whatsapp), profileDownloads: Number(total.downloads),
    quotes: Number(quoteTotal.rows[0].count), messages: Number(messageTotal.rows[0].count),
    timeline, quoteStatuses: counts(statuses.rows), topPages: counts(pages.rows), campaigns: counts(campaigns.rows),
  });
});

export default router;
