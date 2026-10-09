import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createHmac, randomUUID } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, symlink, writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { request } from "node:http";
import express from "express";
import { createObjectStorage, objectStorage } from "../src/lib/objectStorage.ts";
import { LocalObjectStorage } from "../src/lib/storage/local.ts";
import { matchesType, uploadLimit } from "../src/lib/storage/policy.ts";
import { createStorageRouter } from "../src/routes/storage-router.ts";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jIxoAAAAASUVORK5CYII=", "base64");
const assets = new Map();
const references = [];
let root, storage, server, base, sidecarAttempts = 0;
const realFetch = globalThis.fetch;
const repository = {
  list: async () => [...assets.values()],
  find: async id => assets.get(id),
  async finalize(input) {
    const existing = [...assets.values()].find(value => value.objectPath === input.objectPath);
    const asset = { ...input, id: existing?.id ?? assets.size + 1 };
    assets.set(asset.id, asset);
    return asset;
  },
  referenceValues: async () => references,
  delete: async id => { assets.delete(id); },
};
const admin = (req, res, next) => req.get("x-test-admin") === "1" ? next() : res.status(401).end();
const sameOrigin = (req, res, next) => req.get("origin") === base ? next() : res.status(403).end();
const auth = () => ({ "x-test-admin": "1", origin: base, "content-type": "application/json" });
const apiPath = objectPath => `${base}/api/storage${objectPath}`;
const url = uploadURL => new URL(uploadURL, base).href;
const tokenOf = uploadURL => new URL(uploadURL, base).searchParams.get("token");
async function issue(size = png.length, contentType = "image/png") {
  const response = await fetch(`${base}/api/storage/uploads/request-url`, {
    method: "POST", headers: auth(), body: JSON.stringify({ name: "test.png", size, contentType }),
  });
  assert.equal(response.status, 200);
  return response.json();
}
async function put(signed, body = png, contentType = "image/png") {
  return fetch(url(signed.uploadURL), { method: "PUT", headers: { "content-type": contentType }, body });
}
async function finalize(signed, contentType = "image/png") {
  return fetch(`${base}/api/admin/media/finalize`, {
    method: "POST", headers: auth(), body: JSON.stringify({ objectPath: signed.objectPath, originalName: "test.png", contentType }),
  });
}

before(async () => {
  assert.equal(process.env.DATABASE_URL, undefined);
  for (const key of ["PRIVATE_OBJECT_DIR", "DEFAULT_OBJECT_STORAGE_BUCKET_ID", "PUBLIC_OBJECT_SEARCH_PATHS", "MEDIA_STORAGE_DRIVER", "MEDIA_STORAGE_DIR"]) assert.equal(process.env[key], undefined);
  globalThis.fetch = (input, options) => {
    if (String(input).includes("127.0.0.1:1106")) {
      sidecarAttempts++;
      throw new Error("Sidecar deliberately unreachable during local tests");
    }
    return realFetch(input, options);
  };
  root = await mkdtemp(path.join(tmpdir(), "alwatan-local-storage-"));
  storage = createObjectStorage(undefined, root);
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.log = { error() {}, warn() {} }; next(); });
  app.use("/api", createStorageRouter(storage, repository, admin, sameOrigin));
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  globalThis.fetch = realFetch;
  if (server) await new Promise(resolve => server.close(resolve));
  if (root) await rm(root, { recursive: true, force: true });
  assert.equal(sidecarAttempts, 0, "Local mode must never request sidecar credentials or URLs");
});

test("default is local without any storage environment or database; unknown drivers fail explicitly", () => {
  assert.equal(objectStorage.driver, "local");
  assert.equal(storage.driver, "local");
  assert.equal(objectStorage.root, path.resolve(process.cwd(), "var/media"));
  assert.throws(() => createObjectStorage("unknown"));
  assert.throws(() => new LocalObjectStorage("/tmp/public/uploads"));
});

test("request-url/finalize/delete still require both injected admin and same-origin guards", async () => {
  for (const [route, method, body] of [
    ["/storage/uploads/request-url", "POST", { name: "x", size: 1, contentType: "image/png" }],
    ["/admin/media/finalize", "POST", {}], ["/admin/media/1", "DELETE", {}],
  ]) {
    const anonymous = await fetch(`${base}/api${route}`, { method, headers: { "content-type": "application/json", origin: base }, body: JSON.stringify(body) });
    assert.equal(anonymous.status, 401);
    const crossOrigin = await fetch(`${base}/api${route}`, { method, headers: { ...auth(), origin: "https://untrusted.invalid" }, body: JSON.stringify(body) });
    assert.equal(crossOrigin.status, 403);
  }
});

test("HTTP upload, finalize, 200/206/416 serve, reference protection, and delete round trip", async () => {
  const signed = await issue();
  assert.match(signed.objectPath, /^\/objects\/uploads\/[a-f0-9-]+$/);
  assert.equal((await fetch(apiPath(signed.objectPath))).status, 404, "Cannot serve an unuploaded ticket");
  assert.equal((await put(signed)).status, 204, "PUT intentionally uses no admin cookie or authentication headers");
  const final = await finalize(signed);
  assert.equal(final.status, 201);
  const asset = await final.json();
  assert.equal(asset.size, png.length);
  const full = await fetch(apiPath(signed.objectPath));
  assert.equal(full.status, 200);
  assert.equal(full.headers.get("content-type"), "image/png");
  assert.equal(full.headers.get("x-content-type-options"), "nosniff");
  assert.equal(full.headers.get("cache-control"), "public, max-age=3600");
  assert.deepEqual(Buffer.from(await full.arrayBuffer()), png);
  const partial = await fetch(apiPath(signed.objectPath), { headers: { range: "bytes=0-15" } });
  assert.equal(partial.status, 206);
  assert.equal(partial.headers.get("content-range"), `bytes 0-15/${png.length}`);
  assert.deepEqual(Buffer.from(await partial.arrayBuffer()), png.subarray(0, 16));
  for (const range of ["bytes=9999-", "bytes=-0", "bytes=4-2", "bytes=0-1,3-4", "invalid"]) {
    const invalid = await fetch(apiPath(signed.objectPath), { headers: { range } });
    assert.equal(invalid.status, 416);
    assert.equal(invalid.headers.get("content-range"), `bytes */${png.length}`);
    assert.equal(invalid.headers.get("x-content-type-options"), "nosniff");
  }
  const suffix = await fetch(apiPath(signed.objectPath), { headers: { range: "bytes=-8" } });
  assert.equal(suffix.status, 206);
  assert.deepEqual(Buffer.from(await suffix.arrayBuffer()), png.subarray(-8));
  assert.equal((await finalize(signed, "application/pdf")).status, 400, "Finalize uses verified MIME, not client claims");
  references.push(JSON.stringify({ studio_draft: { sections: [{ mediaUrl: `/api/storage${signed.objectPath}` }] } }));
  const del = () => fetch(`${base}/api/admin/media/${asset.id}`, { method: "DELETE", headers: auth() });
  assert.equal((await del()).status, 409);
  assert.equal((await fetch(apiPath(signed.objectPath))).status, 200);
  references.length = 0;
  assert.equal((await del()).status, 204);
  assert.equal((await fetch(apiPath(signed.objectPath))).status, 404);
  await assert.rejects(readFile(path.join(root, "uploads", signed.objectPath.split("/").pop())));
});

test("single-use tokens, including concurrent requests and consumption across service instances", async () => {
  const signed = await issue();
  const results = await Promise.all([put(signed), put(signed)]);
  assert.deepEqual(results.map(value => value.status).sort(), [204, 409]);
  const restarted = new LocalObjectStorage(root);
  await assert.rejects(restarted.receiveUpload(tokenOf(signed.uploadURL), Readable.from([png]), "image/png", String(png.length)), error => error.status === 409);
  await storage.delete(signed.objectPath);
});

test("tampered claims, expiry, bound type, bound length, and chunked stream hard cap", async () => {
  const signed = await issue();
  const [encoded, signature] = tokenOf(signed.uploadURL).split(".");
  const claims = JSON.parse(Buffer.from(encoded, "base64url"));
  claims.objectPath = `/objects/uploads/${randomUUID()}`;
  const tampered = Buffer.from(JSON.stringify(claims)).toString("base64url") + "." + signature;
  assert.equal((await fetch(`${base}/api/storage/uploads/direct?token=${tampered}`, { method: "PUT", body: png, headers: { "content-type": "image/png" } })).status, 403);
  claims.expiresAt = Date.now() - 1;
  const expiredPayload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const testKey = await readFile(path.join(root, ".upload-signing-key")); // Isolated generated test key only, never logged.
  const expired = expiredPayload + "." + createHmac("sha256", testKey).update(expiredPayload).digest("base64url");
  assert.equal((await fetch(`${base}/api/storage/uploads/direct?token=${expired}`, { method: "PUT", body: png, headers: { "content-type": "image/png" } })).status, 410);
  assert.equal((await put(signed, png, "application/pdf")).status, 415);
  assert.equal((await put(signed)).status, 409, "Even a failed upload consumes its ticket");
  const tooLong = await issue(8);
  const response = await fetch(url(tooLong.uploadURL), {
    method: "PUT", headers: { "content-type": "image/png" },
    body: Readable.from([png.subarray(0, 8), png.subarray(8)]), duplex: "half",
  });
  assert.equal(response.status, 413, "No Content-Length shortcut; the streaming cap must reject this");
  assert.equal((await fetch(apiPath(tooLong.objectPath))).status, 404);
  const tooShort = await issue(png.length + 1);
  assert.equal((await put(tooShort)).status, 400);
  assert.deepEqual(await readdir(path.join(root, ".tmp")), []);
  assert.deepEqual(await readdir(path.join(root, ".claimed")), []);
});

test("all seven allowed signatures; SVG, HTML, mismatches and oversized declarations rejected", async () => {
  const fixtures = [
    ["image/png", png], ["image/jpeg", Buffer.from([255, 216, 255, 224, 1, 2, 255, 217])],
    ["image/gif", Buffer.from("GIF89a123456")], ["image/webp", Buffer.from("RIFF0000WEBPVP8 ")],
    ["application/pdf", Buffer.from("%PDF-1.7\n%%EOF\n")],
    ["video/mp4", Buffer.from("000000186674797069736f6d0000000069736f6d6d703431", "hex")],
    ["video/webm", Buffer.from("1a45dfa3874282847765626d", "hex")],
  ];
  for (const [type, bytes] of fixtures) {
    assert.equal(matchesType(bytes, type), true, type);
    const signed = await issue(bytes.length, type);
    assert.equal((await put(signed, bytes, type)).status, 204, type);
    const response = await fetch(apiPath(signed.objectPath));
    assert.equal(response.headers.get("content-type"), type);
    await response.arrayBuffer();
    await storage.delete(signed.objectPath);
    const invalid = Buffer.from("<html><script>alert(1)</script></html>");
    const bad = await issue(invalid.length, type);
    assert.equal((await put(bad, invalid, type)).status, 415, type);
    assert.equal((await fetch(apiPath(bad.objectPath))).status, 404);
  }
  for (const type of ["image/svg+xml", "text/html", "application/javascript", "application/octet-stream"]) {
    assert.equal((await fetch(`${base}/api/storage/uploads/request-url`, { method: "POST", headers: auth(), body: JSON.stringify({ name: "bad", contentType: type, size: 100 }) })).status, 400);
  }
  for (const type of ["image/png", "application/pdf", "video/mp4"]) {
    assert.equal((await fetch(`${base}/api/storage/uploads/request-url`, { method: "POST", headers: auth(), body: JSON.stringify({ name: "large", contentType: type, size: uploadLimit(type) + 1 }) })).status, 400);
  }
});

test("interrupted uploads never publish bytes or metadata and remove temporary files", async () => {
  const signed = await issue(100_000);
  await new Promise(resolve => {
    const upload = request(url(signed.uploadURL), { method: "PUT", headers: { "content-type": "image/png" } });
    upload.on("error", () => resolve());
    upload.write(png);
    // Leave the body incomplete, then disconnect the socket.
    setTimeout(() => { upload.destroy(); resolve(); }, 50);
  });
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.equal((await fetch(apiPath(signed.objectPath))).status, 404);
  assert.deepEqual(await readdir(path.join(root, ".tmp")), []);
  assert.deepEqual(await readdir(path.join(root, ".claimed")), []);
});

test("legacy object paths retain identity after verified import; absent bytes/metadata return 404", async () => {
  const legacy = "/objects/uploads/legacy-media-record";
  assert.equal((await fetch(apiPath(legacy))).status, 404);
  await storage.importObject(legacy, Readable.from([png]), "image/png");
  assert.deepEqual(Buffer.from(await (await fetch(apiPath(legacy))).arrayBuffer()), png);
  await assert.rejects(storage.importObject(legacy, Readable.from([png]), "image/png"), error => error.status === 409);
  await storage.delete(legacy);
  await writeFile(path.join(root, "uploads", "unverified"), png);
  assert.equal((await fetch(apiPath("/objects/uploads/unverified"))).status, 404);
  await unlink(path.join(root, "uploads", "unverified"));
  await storage.importObject("logos/legacy.png", Readable.from([png]), "image/png", true);
  const publicResponse = await fetch(`${base}/api/storage/public-objects/logos/legacy.png`, { headers: { range: "bytes=0-7" } });
  assert.equal(publicResponse.status, 206);
  assert.deepEqual(Buffer.from(await publicResponse.arrayBuffer()), png.subarray(0, 8));
});

test("traversal, symlinks, corrupted sizes and forged HTML metadata cannot be served", async () => {
  for (const key of ["/objects/uploads/../outside", "/objects/uploads/a/b", "/objects/uploads/%2e%2e", "/objects/uploads/a\\b"]) await assert.rejects(storage.response(key));
  for (const key of ["../outside", "/outside", "a/../outside", "a\\b", "a//b"]) await assert.rejects(storage.publicResponse(key));
  const signed = await issue();
  assert.equal((await put(signed)).status, 204);
  const id = signed.objectPath.split("/").pop();
  const dataPath = path.join(root, "uploads", id);
  const recordPath = path.join(root, ".metadata", `${id}.json`);
  const record = JSON.parse(await readFile(recordPath, "utf8"));
  await writeFile(recordPath, JSON.stringify({ ...record, contentType: "text/html" }));
  assert.equal((await fetch(apiPath(signed.objectPath))).status, 404);
  await writeFile(recordPath, JSON.stringify(record));
  await writeFile(dataPath, Buffer.from("changed"));
  assert.equal((await fetch(apiPath(signed.objectPath))).status, 404);
  await unlink(dataPath);
  const outside = path.join(root, "outside.png");
  await writeFile(outside, png);
  await symlink(outside, dataPath);
  assert.equal((await fetch(apiPath(signed.objectPath))).status, 404);
  await storage.delete(signed.objectPath);
});

test("Replit cloud round trip is skipped when sidecar/configuration is absent", {
  skip: !process.env.PRIVATE_OBJECT_DIR || !process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID,
}, async t => {
  // The isolated local runner deliberately removes Replit configuration.
  const probe = await realFetch("http://127.0.0.1:1106/credential", { signal: AbortSignal.timeout(300) }).catch(() => undefined);
  if (!probe?.ok) { t.skip("Replit sidecar is absent"); return; }
  const cloud = createObjectStorage("replit");
  const signed = await cloud.uploadUrl({ contentType: "image/png", size: png.length });
  try {
    assert.ok((await realFetch(signed.uploadURL, { method: "PUT", headers: { "content-type": "image/png" }, body: png })).ok);
    assert.deepEqual(Buffer.from(await (await cloud.response(signed.objectPath)).arrayBuffer()), png);
  } finally { await cloud.delete(signed.objectPath); }
});
