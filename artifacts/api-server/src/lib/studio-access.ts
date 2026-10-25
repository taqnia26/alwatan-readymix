import { hasPermission, STUDIO_ACCESS, type AccessUser } from "@workspace/api-zod";
import type { readStudio } from "./site-studio";

type State = Awaited<ReturnType<typeof readStudio>>;
type Config = State["draft"];
export function studioForUser(state: State, user: AccessUser | undefined): State {
  if (user?.role === "admin") return state;
  const draft = { ...state.draft }, published = { ...state.published };
  for (const [key, resource] of Object.entries(STUDIO_ACCESS) as [keyof typeof STUDIO_ACCESS, string][]) {
    if (!hasPermission(user, `${resource}:view`)) {
      // Unpublished content is not exposed to accounts without section access.
      Object.assign(draft, { [key]: key === "campaigns" ? [] : state.published[key] });
      if (key === "campaigns") Object.assign(published, { [key]: [] });
    }
  }
  return { ...state, draft, published };
}
export function scopedStudioSave(state: State, config: Config, user: AccessUser | undefined): Config | null {
  if (user?.role === "admin") return config;
  const presented = studioForUser(state, user).draft;
  const merged = { ...state.draft };
  for (const [key, resource] of Object.entries(STUDIO_ACCESS) as [keyof typeof STUDIO_ACCESS, string][]) {
    if (hasPermission(user, `${resource}:edit`)) Object.assign(merged, { [key]: config[key] });
    else if (JSON.stringify(config[key]) !== JSON.stringify(presented[key])) return null;
  }
  return merged;
}
export function mayPublishStudio(state: State, user: AccessUser | undefined): boolean {
  return hasPermission(user, "studio:publish") && Object.entries(STUDIO_ACCESS).every(([key, resource]) =>
    hasPermission(user, `${resource}:edit`) ||
    JSON.stringify(state.draft[key as keyof Config]) === JSON.stringify(state.published[key as keyof Config]),
  );
}
