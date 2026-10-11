import assert from "node:assert/strict";
import { before, after, beforeEach, test } from "node:test";
import express from "express";
import studioRouter from "../src/routes/studio.ts";
import alwatanRouter from "../src/routes/alwatan.ts";
import { defaultStudio, readStudio, STUDIO_KEYS } from "../src/lib/site-studio.ts";
import { resetFixture, snapshotFixture } from "./fixtures/studio-db.mjs";

let server;
let origin;
const clone = value => structuredClone(value);
const about = config => config.pages.find(page => page.slug === "about");
const legacyCopy = [
  { pageSlug: "about", sectionKey: "intro", fieldKey: "title", valueAr: "عنوان من التجهيز", valueEn: "Fixture About" },
  { pageSlug: "about", sectionKey: "story", fieldKey: "content", valueAr: "قصتنا الأصلية", valueEn: "Original story" },
  { pageSlug: "about", sectionKey: "values", fieldKey: "vision", valueAr: "الرؤية القديمة", valueEn: "Legacy vision" },
];
before(async () => {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api", studioRouter, alwatanRouter);
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
beforeEach(() => resetFixture([], legacyCopy));

async function request(path, method = "GET", body, expected = 200, admin = true) {
  const res = await fetch(`${origin}/api${path}`, {
    method, headers: { "content-type": "application/json", origin: "http://fixture.test", ...(admin ? { "x-fixture-admin": "yes" } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  assert.equal(res.status, expected, JSON.stringify(data));
  if (path.includes("studio") && method === "GET" && expected === 200) assert.equal(res.headers.get("cache-control"), "no-store");
  return data;
}
async function seed() {
  const initial = await defaultStudio();
  resetFixture([
    { key: STUDIO_KEYS.draft, value: JSON.stringify(initial) },
    { key: STUDIO_KEYS.published, value: JSON.stringify(initial) },
    { key: "phone", value: "LEGACY-PHONE-NOT-LIVE" },
    { key: "quoteEmail", value: "notifications@example.test" },
  ], legacyCopy);
  return initial;
}
const save = config => request("/admin/studio", "PUT", { config });
const publish = () => request("/admin/studio/publish", "POST");
const publicStudio = () => request("/public/studio", "GET", undefined, 200, false);

test("bootstrap includes About on /about with legacy bilingual content and no writes", async () => {
  const before = snapshotFixture();
  const state = await request("/admin/studio");
  assert.equal(about(state.draft).id, "builtin-about");
  assert.equal(about(state.draft).titleAr, "عنوان من التجهيز");
  assert.equal(about(state.draft).titleEn, "Fixture About");
  assert.equal(about(state.draft).sections[0].bodyEn, "Original story");
  assert.equal(about(state.draft).sections[1].bodyAr, "الرؤية القديمة");
  assert(state.draft.navigation.some(item => item.href === "/about"));
  assert.deepEqual(state.draft, state.published);
  assert.deepEqual(await publicStudio(), { ...state.published, campaigns: [] });
  assert.deepEqual(snapshotFixture(), before);
});

test("older saved configs gain About without replacing either real draft or published custom content", async () => {
  const initial = await defaultStudio();
  const oldPublished = { ...clone(initial), pages: [{ ...clone(about(initial)), id: "custom", slug: "custom", titleAr: "منشور مخصص" }] };
  const oldDraft = clone(oldPublished);
  oldDraft.pages[0].titleAr = "مسودة مخصصة";
  oldDraft.branding.phone = "DRAFT-PHONE";
  resetFixture([
    { key: STUDIO_KEYS.draft, value: JSON.stringify(oldDraft) },
    { key: STUDIO_KEYS.published, value: JSON.stringify(oldPublished) },
  ], legacyCopy);
  const before = snapshotFixture();
  const state = await readStudio();
  assert.equal(state.draft.pages.filter(page => page.slug === "about").length, 1);
  assert.equal(state.draft.pages.find(page => page.slug === "custom").titleAr, "مسودة مخصصة");
  assert.equal(state.published.pages.find(page => page.slug === "custom").titleAr, "منشور مخصص");
  assert.equal(state.draft.branding.phone, "DRAFT-PHONE");
  assert.deepEqual(snapshotFixture(), before);
});

test("saving draft never leaks; publish matches all edited fields and survives fresh reads", async () => {
  const initial = await seed();
  const config = clone(initial);
  const page = about(config);
  page.titleAr = "عنوان جديد"; page.titleEn = "New title";
  page.descriptionAr = "وصف جديد"; page.descriptionEn = "New description";
  page.sections[0].headingAr = "قصتنا الجديدة";
  page.sections[0].bodyAr = "<p>قصة <strong>جديدة</strong></p>";
  page.sections[0].bodyEn = "<p>New <strong>story</strong></p>";
  page.sections[1].visible = false;
  const saved = await save(config);
  assert.deepEqual(about(saved.draft), page);
  assert.deepEqual(about(await publicStudio()), about(initial));
  assert.deepEqual(about((await request("/admin/studio")).draft), page);
  const published = await publish();
  assert.deepEqual(published.draft, published.published);
  for (let refresh = 0; refresh < 2; refresh++) {
    assert.deepEqual(about(await publicStudio()), page);
    assert.deepEqual(about((await request("/admin/studio")).draft), page);
  }
  assert.equal(snapshotFixture().audit.length, 1);
});

test("contact settings use published identity, not legacy settings or unpublished branding", async () => {
  const config = await seed();
  const before = await request("/settings/public", "GET", undefined, 200, false);
  assert.equal(before.phone, config.branding.phone);
  assert.notEqual(before.phone, "LEGACY-PHONE-NOT-LIVE");
  Object.assign(config.branding, { phone: "0123456789", email: "hello@example.test", whatsapp: "966123456789", instagram: "https://example.test/ig", linkedin: "https://example.test/in" });
  await save(config);
  assert.deepEqual(await request("/settings/public"), before);
  await publish();
  const settings = await request("/settings/public");
  assert.deepEqual(settings, {
    phone: config.branding.phone, email: config.branding.email, whatsapp: config.branding.whatsapp,
    instagramUrl: config.branding.instagram, linkedinUrl: config.branding.linkedin,
    quoteEmail: "notifications@example.test",
  });
  assert.deepEqual(await request("/settings/public"), settings);
});

test("renamed page links switch only on publish; unpublished and deleted pages disappear", async () => {
  const config = await seed();
  config.pages.push({ ...clone(about(config)), id: "new-page", slug: "old-slug" });
  config.navigation.push({ id: "new-link", labelAr: "صفحة", labelEn: "Page", href: "/p/old-slug", visible: true });
  await save(config); await publish();
  config.pages[1].slug = "new-slug";
  config.navigation.find(item => item.id === "new-link").href = "/p/new-slug";
  await save(config);
  assert((await publicStudio()).navigation.some(item => item.href === "/p/old-slug"));
  await publish();
  const renamed = await publicStudio();
  assert(renamed.navigation.some(item => item.href === "/p/new-slug"));
  assert(!renamed.navigation.some(item => item.href === "/p/old-slug"));
  config.pages[1].published = false;
  about(config).published = false;
  await save(config);
  assert.equal((await publicStudio()).pages.length, 2);
  await publish();
  const hidden = await publicStudio();
  assert.equal(hidden.pages.length, 0);
  assert(!hidden.navigation.some(item => ["/about", "/p/new-slug"].includes(item.href)));
  assert(hidden.navigation.some(item => item.href === "/products"));
  assert.equal((await request("/admin/studio")).draft.pages.length, 2);
  config.pages.splice(1, 1);
  await save(config); await publish();
  assert(!(await publicStudio()).navigation.some(item => item.href === "/p/new-slug"));
});

test("anonymous public responses never expose draft-only pages, links, or campaigns", async () => {
  const config = await seed();
  config.pages.push({ ...clone(about(config)), id: "private", slug: "private", published: false, titleAr: "PRIVATE" });
  config.navigation.push({ id: "private-link", href: "/p/private", labelAr: "خاص", labelEn: "Private", visible: true });
  config.navigation[0].visible = false;
  config.campaigns.push({ id: "private-campaign", name: "INTERNAL", source: "fixture", medium: "website", target: "/" });
  await save(config); await publish();
  const publicConfig = await publicStudio();
  assert(!publicConfig.pages.some(page => page.slug === "private"));
  assert(!publicConfig.navigation.some(item => item.id === "private-link" || item.id === "home"));
  assert.deepEqual(publicConfig.campaigns, []);
});

test("invalid saves and unauthenticated mutations cannot replace the isolated draft", async () => {
  const config = await seed();
  const before = snapshotFixture();
  await request("/admin/studio", "PUT", { config }, 401, false);
  await request("/admin/studio/publish", "POST", undefined, 401, false);
  await request("/admin/studio", "PUT", { config: {} }, 400);
  config.pages.push(clone(about(config)));
  await request("/admin/studio", "PUT", { config }, 400);
  assert.deepEqual(snapshotFixture(), before);
});
