import { useCallback, useMemo } from 'react';
import { useGetAuthMe } from '@workspace/api-client-react';
import { ACCESS_RESOURCES, adminPageResource, hasPermission, type AccessResource } from '@workspace/api-zod';

export const RESOURCE_PATHS: Record<string, string> = {
  dashboard: '/admin', pages: '/admin/pages', sliders: '/admin/sliders', marketing: '/admin/marketing',
  branding: '/admin/branding', content: '/admin/content', media: '/admin/media', products: '/admin/products',
  articles: '/admin/articles', certificates: '/admin/certificates', branches: '/admin/branches',
  quotes: '/admin/quotes', messages: '/admin/messages', chats: '/admin/chats', users: '/admin/users',
};
export const STUDIO_RESOURCES: AccessResource[] = ['pages', 'sliders', 'branding', 'marketing'];

export function useAdminAccess() {
  const q = useGetAuthMe();
  const user = q.data?.user as ({ role: string; permissions?: string[] | null; id?: number; name?: string } | undefined);
  const can = useCallback((p: string) => hasPermission(user, p), [user]);
  const canView = useCallback((r: string) => hasPermission(user, `${r}:view`), [user]);
  const canEdit = useCallback((r: string) => hasPermission(user, `${r}:edit`), [user]);
  const isAdmin = user?.role === 'admin';
  const canAccessPath = useCallback((path: string) => {
    const r = adminPageResource(path);
    if (!r) return false;
    if (!canView(r)) return false;
    return true;
  }, [canView]);
  const firstAllowedPath = useMemo(() => {
    for (const r of ACCESS_RESOURCES) {
      const p = RESOURCE_PATHS[r.key];
      if (p && (user ? hasPermission(user, `${r.key}:view`) : false)) return p;
    }
    return null;
  }, [user]);
  const hasStudioView = STUDIO_RESOURCES.some((r) => canView(r));
  return { user, isLoading: q.isLoading, error: q.error, can, canView, canEdit, isAdmin, canAccessPath, firstAllowedPath, hasStudioView };
}

/** Resource whose edit grant controls the studio bar for the current admin path. */
export function studioResourceForPath(path: string): AccessResource {
  const r = adminPageResource(path);
  return r ?? 'pages';
}
