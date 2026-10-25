// Test-only middleware, substituted by the bundler. Production auth stays intact.
export function requireAdmin(req, res, next) {
  if (req.headers["x-fixture-admin"] !== "yes") { res.status(401).json({ error: "Unauthorized fixture" }); return; }
  req.adminUser = { id: 1, role: "admin", permissions: [] };
  next();
}
export function requireSameOrigin(req, res, next) {
  if (req.headers.origin !== "http://fixture.test") { res.status(403).json({ error: "Forbidden fixture" }); return; }
  next();
}
