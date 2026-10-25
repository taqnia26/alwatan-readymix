export const ACCESS_RESOURCES = [
  { key: "dashboard", ar: "لوحة التحكم والتحليلات", en: "Dashboard & analytics" },
  { key: "pages", ar: "الصفحات والرئيسية ونصوص المحتوى", en: "Pages, home & content" },
  { key: "sliders", ar: "الشرائح والفيديو", en: "Sliders & video" },
  { key: "marketing", ar: "التسويق", en: "Marketing" },
  { key: "branding", ar: "الهوية والتواصل والقائمة", en: "Branding & contact" },
  { key: "media", ar: "الوسائط", en: "Media" },
  { key: "products", ar: "المنتجات", en: "Products" },
  { key: "articles", ar: "المقالات", en: "Articles" },
  { key: "certificates", ar: "الشهادات", en: "Certificates" },
  { key: "branches", ar: "الفروع", en: "Branches" },
  { key: "quotes", ar: "طلبات التسعير", en: "Quotes" },
  { key: "messages", ar: "رسائل التواصل", en: "Contact messages" },
  { key: "chats", ar: "المحادثات المباشرة", en: "Live chat" },
  { key: "users", ar: "المستخدمون (الإدارة لمدير النظام فقط)", en: "Users (management is administrator-only)" },
] as const;
export type AccessResource = typeof ACCESS_RESOURCES[number]["key"];
export const ACCESS_ROLES = [
  { key: "admin", ar: "مدير النظام", en: "Administrator" },
  { key: "manager", ar: "مدير الموقع", en: "Site manager" },
  { key: "editor", ar: "محرر محتوى", en: "Content editor" },
  { key: "marketing", ar: "مسؤول التسويق", en: "Marketing specialist" },
  { key: "support", ar: "خدمة العملاء", en: "Customer support" },
  { key: "viewer", ar: "مشاهد", en: "Viewer" },
  { key: "custom", ar: "صلاحيات مخصصة", en: "Custom access" },
] as const;
export const ALL_PERMISSIONS: string[] = ACCESS_RESOURCES.flatMap(r =>
  r.key === "users" ? ["users:view"] : [`${r.key}:view`, `${r.key}:edit`],
).concat("studio:publish");
export type AccessUser = { role: string; permissions?: string[] | null };
export function hasPermission(user: AccessUser | null | undefined, permission: string): boolean {
  return !!user && (user.role === "admin" || !!user.permissions?.includes(permission));
}
export function defaultPermissions(role: string): string[] {
  const resources: string[] = role === "manager" ? ACCESS_RESOURCES.filter(r => r.key !== "users").map(r => r.key)
    : role === "editor" ? ["pages", "sliders", "media", "products", "articles", "certificates", "branches"]
    : role === "marketing" ? ["marketing", "media"]
    : role === "support" ? ["quotes", "messages", "chats"] : [];
  if (role === "viewer") return ACCESS_RESOURCES.filter(r => r.key !== "users").map(r => `${r.key}:view`);
  return resources.flatMap(r => [`${r}:view`, `${r}:edit`]).concat(role === "manager" ? ["studio:publish"] : []);
}
export const STUDIO_ACCESS = { branding: "branding", navigation: "branding", pages: "pages", homeSections: "pages", slides: "sliders", videos: "sliders", campaigns: "marketing", banners: "marketing" } as const;
export function adminPageResource(path: string): AccessResource | undefined {
  const part = path.replace(/\/+$/, "").split("/")[2];
  if (!part) return "dashboard";
  if (part === "settings") return "branding";
  if (part === "content") return "pages";
  return ACCESS_RESOURCES.find(r => r.key === part)?.key;
}
