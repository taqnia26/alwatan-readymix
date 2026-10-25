import test from "node:test";
import assert from "node:assert/strict";
import { mayUseAdminEndpoint, validGoogleMapsUrl } from "../src/lib/access-control.ts";
import { mayPublishStudio, scopedStudioSave, studioForUser } from "../src/lib/studio-access.ts";
import { ALL_PERMISSIONS, ACCESS_ROLES, defaultPermissions, hasPermission } from "@workspace/api-zod";

const user = permissions => ({ role: "custom", permissions });
test("all delegated roles need explicit grants; administrator retains full access", () => {
  for (const role of ACCESS_ROLES.filter(r => r.key !== "admin")) {
    assert.equal(mayUseAdminEndpoint({ role: role.key }, "GET", "/api/admin/users"), false);
    assert.equal(mayUseAdminEndpoint({ role: role.key, permissions: ALL_PERMISSIONS }, "POST", "/api/admin/users"), false);
    assert(defaultPermissions(role.key).every(p => ALL_PERMISSIONS.includes(p)));
  }
  assert.equal(mayUseAdminEndpoint({ role: "admin" }, "POST", "/api/admin/users"), true);
  assert.equal(hasPermission(null, "branches:edit"), false);
});
const routes = {
  branches: ["/api/admin/branches", "/api/branches/123"],
  products: ["/api/products", "/api/products/product-slug"],
  articles: ["/api/admin/blog", "/api/blog/article-slug"],
  certificates: ["/api/admin/certificates", "/api/certificates/123"],
  media: ["/api/admin/media", "/api/storage/uploads/request-url"],
  quotes: ["/api/admin/quotes.csv", "/api/admin/quotes/123"],
  messages: ["/api/admin/contact", "/api/admin/contact/123"],
  chats: ["/api/admin/chats", "/api/admin/chats/123/messages"],
  pages: ["/api/admin/content", "/api/admin/content/123"],
};
for (const [resource, [read, write]] of Object.entries(routes)) {
  test(`${resource}: read-only cannot mutate; a different section cannot cross boundaries`, () => {
    assert.equal(mayUseAdminEndpoint(user([`${resource}:view`]), "GET", read), true);
    assert.equal(mayUseAdminEndpoint(user([`${resource}:view`]), "PATCH", write), false);
    assert.equal(mayUseAdminEndpoint(user([`${resource}:view`, `${resource}:edit`]), "POST", write), true);
    assert.equal(mayUseAdminEndpoint(user(["dashboard:view"]), "GET", read), false);
  });
}
test("unknown protected routes fail closed and chat read is not reply permission", () => {
  assert.equal(mayUseAdminEndpoint(user(ALL_PERMISSIONS), "GET", "/api/admin/future-module"), false);
  assert.equal(mayUseAdminEndpoint(user(["chats:view"]), "POST", "/api/admin/chats/2/read"), true);
  assert.equal(mayUseAdminEndpoint(user(["chats:view"]), "POST", "/api/admin/chats/2/messages"), false);
});
const makeState = () => {
  const config = { branding: { nameAr: "Original" }, navigation: [], pages: [], homeSections: [], slides: [], videos: [], campaigns: [], banners: [] };
  return { draft: structuredClone(config), published: structuredClone(config), publishedAt: null, updatedAt: null };
};
test("section-scoped draft save preserves other departments and rejects forged changes", () => {
  const state = makeState();
  state.draft.branding.nameAr = "Private branding draft";
  const editor = user(["pages:view", "pages:edit"]);
  const visible = studioForUser(state, editor);
  assert.equal(visible.draft.branding.nameAr, "Original");
  const input = structuredClone(visible.draft);
  input.pages.push({ id: "new-page" });
  const saved = scopedStudioSave(state, input, editor);
  assert.equal(saved.branding.nameAr, "Private branding draft");
  assert.equal(saved.pages.length, 1);
  input.branding.nameAr = "Unauthorized edit";
  assert.equal(scopedStudioSave(state, input, editor), null);
});
test("publish permission alone cannot release other departments' unpublished drafts", () => {
  const state = makeState();
  state.draft.pages.push({ id: "new-page" });
  assert.equal(mayPublishStudio(state, user(["studio:publish"])), false);
  assert.equal(mayPublishStudio(state, user(["pages:edit", "studio:publish"])), true);
  state.draft.banners.push({ id: "marketing-banner" });
  assert.equal(mayPublishStudio(state, user(["pages:edit", "studio:publish"])), false);
  assert.equal(mayPublishStudio(state, { role: "admin" }), true);
});
test("Google Maps field accepts share links and blank removal, never executable or lookalike URLs", () => {
  for (const value of ["", "  ", "https://maps.app.goo.gl/example", "https://goo.gl/maps/example", "https://www.google.com/maps/place/Riyadh", "https://maps.google.com/?q=Riyadh", "https://www.google.com.sa/maps/place/Riyadh"]) assert.equal(validGoogleMapsUrl(value), true, value);
  for (const value of ["javascript:alert(1)", "http://maps.app.goo.gl/example", "https://google.com.evil.test/maps", "https://evil.test/?next=google.com/maps", "https://google.com@evil.test/maps", "https://user:pass@google.com/maps", "https://google.com:444/maps", "<iframe>https://google.com/maps</iframe>", null, "x".repeat(2001)]) assert.equal(validGoogleMapsUrl(value), false);
});
