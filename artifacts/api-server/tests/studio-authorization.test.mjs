import assert from "node:assert/strict";
import { before, after, beforeEach, test } from "node:test";
import express from "express";
import cookieParser from "cookie-parser";
import studioRouter from "../src/routes/studio.ts";
import { ADMIN_SESSION_COOKIE, requireAdmin, requireSameOrigin } from "../src/lib/auth.ts";
import { defaultStudio, STUDIO_KEYS } from "../src/lib/site-studio.ts";
import { resetFixture, snapshotFixture, cmsCalls, resetCmsCalls } from "./fixtures/studio-authorization-db.mjs";
import { sessionLookups, resetSessions } from "./fixtures/admin-session.mjs";

let server, origin, config;
const allowed = "https://cms.example.test";
const logErrors = [];
before(async () => {
  const app = express();
  app.use(express.json(), cookieParser());
  app.use((req, _res, next) => {
    req.log = { error: (...args) => logErrors.push(args) };
    next();
  });
  app.get("/probe/admin", requireAdmin, (req, res) => res.json({ id: req.adminUser.id }));
  app.post("/probe/origin", requireSameOrigin, (_req, res) => res.json({ allowed: true }));
  app.use("/api", studioRouter);
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
beforeEach(async () => {
  process.env.NODE_ENV = "production";
  process.env.ALLOWED_ORIGINS = ` ${allowed} , https://second.example.test `;
  delete process.env.REPLIT_DEV_DOMAIN;
  delete process.env.REPLIT_DOMAINS;
  resetFixture();
  config = await defaultStudio();
  resetFixture([
    { key: STUDIO_KEYS.draft, value: JSON.stringify(config) },
    { key: STUDIO_KEYS.published, value: JSON.stringify(config) },
  ]);
  resetCmsCalls();
  resetSessions();
  logErrors.length = 0;
});

async function request(path, { method = "GET", token, requestOrigin = allowed, body } = {}) {
  const headers = { "content-type": "application/json" };
  if (token !== undefined) headers.cookie = `${ADMIN_SESSION_COOKIE}=${token}`;
  if (requestOrigin !== null) headers.origin = requestOrigin;
  const response = await fetch(`${origin}${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}
const protectedRoutes = [
  ["/api/admin/studio", "GET"],
  ["/api/admin/studio", "PUT"],
  ["/api/admin/studio/publish", "POST"],
];

for (const [label, token, status, error] of [
  ["anonymous visitor", undefined, 401, "Authentication required"],
  ["unknown session", "unknown", 401, "Authentication required"],
  ["expired session", "expired", 401, "Authentication required"],
  ["revoked session", "revoked", 401, "Authentication required"],
  ["non-admin user", "visitor", 403, "Administrator permission required"],
  ["disabled admin", "disabled", 401, "Authentication required"],
  ["missing permission", "unprivileged", 403, "Administrator permission required"],
  ["editor role", "editor", 403, "Administrator permission required"],
  ["session service failure", "service-error", 401, "Authentication required"],
]) {
  test(`${label} cannot read, save or publish with the real authorization middleware`, async () => {
    const before = snapshotFixture();
    for (const [path, method] of protectedRoutes) {
      assert.deepEqual(await request(path, { method, token, body: method === "PUT" ? { config } : undefined }), {
        status, body: { error },
      });
    }
    assert.deepEqual(snapshotFixture(), before);
    assert.deepEqual(cmsCalls, [], "rejected requests must not reach CMS persistence");
    assert.equal(sessionLookups.length, protectedRoutes.length);
    assert.equal(logErrors.length, token === "service-error" ? protectedRoutes.length : 0);
  });
}

test("real requireAdmin attaches only the authorized administrator", async () => {
  assert.deepEqual(await request("/probe/admin", { token: "administrator" }), { status: 200, body: { id: 101 } });
  assert.deepEqual(sessionLookups, ["administrator"]);
});

for (const requestOrigin of [
  "https://attacker.example.test", "null", "http://cms.example.test",
  "https://cms.example.test.attacker.test", "https://cms.example.test:444",
  "http://localhost", "http://127.0.0.1",
]) {
  test(`save and publish reject disallowed origin ${requestOrigin} without CMS side effects`, async () => {
    const before = snapshotFixture();
    for (const [path, method] of protectedRoutes.slice(1)) {
      assert.deepEqual(await request(path, { method, token: "administrator", requestOrigin, body: method === "PUT" ? { config } : undefined }), {
        status: 403, body: { error: "Cross-origin request rejected" },
      });
    }
    assert.deepEqual(snapshotFixture(), before);
    assert.deepEqual(cmsCalls, []);
  });
}

for (const requestOrigin of [allowed, "https://second.example.test", null, "same-host"]) {
  test(`authorized admin can save and publish with origin ${requestOrigin}`, async () => {
    const actualOrigin = requestOrigin === "same-host" ? origin : requestOrigin;
    config.branding.phone = "DRAFT-ONLY";
    const saved = await request("/api/admin/studio", { method: "PUT", token: "administrator", requestOrigin: actualOrigin, body: { config } });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.draft.branding.phone, "DRAFT-ONLY");
    assert.notEqual(saved.body.published.branding.phone, "DRAFT-ONLY");
    const published = await request("/api/admin/studio/publish", { method: "POST", token: "administrator", requestOrigin: actualOrigin });
    assert.equal(published.status, 200);
    assert.deepEqual(published.body.draft, published.body.published);
    assert.deepEqual(snapshotFixture().audit, [{ adminUserId: 101, action: "publish", entityType: "site_studio" }]);
  });
}

test("real origin middleware respects configured Replit domains and development-only localhost", async () => {
  process.env.REPLIT_DEV_DOMAIN = "preview.example.test";
  process.env.REPLIT_DOMAINS = " public.example.test,https://other.example.test ";
  for (const requestOrigin of ["https://preview.example.test", "https://public.example.test", "https://other.example.test"]) {
    assert.equal((await request("/probe/origin", { method: "POST", requestOrigin })).status, 200);
  }
  process.env.NODE_ENV = "development";
  assert.equal((await request("/probe/origin", { method: "POST", requestOrigin: "http://localhost" })).status, 200);
  assert.equal((await request("/probe/origin", { method: "POST", requestOrigin: "https://attacker.example.test" })).status, 403);
});

test("public studio remains readable without authentication and reveals only published state", async () => {
  const result = await request("/api/public/studio", { requestOrigin: null });
  assert.equal(result.status, 200);
  assert.equal(result.body.branding.phone, config.branding.phone);
  assert.deepEqual(sessionLookups, []);
  assert.deepEqual(snapshotFixture().audit, []);
});
