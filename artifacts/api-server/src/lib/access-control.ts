import { hasPermission, type AccessUser } from "@workspace/api-zod";

/** Unknown protected endpoints fail closed for delegated accounts. */
export function mayUseAdminEndpoint(user: AccessUser, method: string, path: string): boolean {
  if (user.role === "admin") return true;
  const read = method === "GET" || method === "HEAD";
  const clean = path.split("?")[0].replace(/^\/api(?=\/)/, "").replace(/\/+$/, "");
  if (clean === "/admin/studio") {
    return ["pages", "sliders", "branding", "marketing"].some(key => hasPermission(user, `${key}:${read ? "view" : "edit"}`));
  }
  if (clean === "/admin/studio/publish") return hasPermission(user, "studio:publish");
  if (/^\/admin\/users(?:\/|$)/.test(clean)) return read && hasPermission(user, "users:view");
  // Opening/reading a thread does not grant the right to send a reply.
  if (/^\/admin\/chats\/\d+\/read$/.test(clean)) return hasPermission(user, "chats:view");
  if (clean === "/admin/insights") return hasPermission(user, "dashboard:view") || hasPermission(user, "marketing:view");
  const resource = [
    [/^\/admin\/summary$/, "dashboard"],
    [/^\/(?:admin\/)?products(?:\/|$)/, "products"],
    [/^\/(?:admin\/)?branches(?:\/|$)/, "branches"],
    [/^\/(?:admin\/)?certificates(?:\/|$)/, "certificates"],
    [/^\/(?:admin\/)?blog(?:\/|$)/, "articles"],
    [/^\/admin\/quotes(?:[/.]|$)/, "quotes"],
    [/^\/admin\/contact(?:\/|$)/, "messages"],
    [/^\/admin\/chats(?:\/|$)/, "chats"],
    [/^\/admin\/content(?:\/|$)/, "pages"],
    [/^\/admin\/settings$/, "branding"],
    [/^\/(?:admin\/media|storage\/uploads)(?:\/|$)/, "media"],
  ].find(([pattern]) => (pattern as RegExp).test(clean))?.[1] as string | undefined;
  return !!resource && hasPermission(user, `${resource}:${read ? "view" : "edit"}`);
}

export function validGoogleMapsUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2000) return false;
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
    if (url.hostname === "maps.app.goo.gl") return true;
    if (url.hostname === "goo.gl") return url.pathname.startsWith("/maps/");
    if (/^(?:www\.|maps\.)?google\.(?:com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/.test(url.hostname)) {
      return url.hostname.startsWith("maps.") || /^\/maps(?:\/|$)/.test(url.pathname);
    }
    return false;
  } catch { return false; }
}
