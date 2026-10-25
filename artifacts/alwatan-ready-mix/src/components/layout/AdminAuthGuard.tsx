import { useEffect } from 'react';
import { Link, Redirect, useLocation } from 'wouter';
import { ShieldAlert } from 'lucide-react';
import { getGetAuthMeQueryKey, useGetAuthMe, useLogout } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { useAdminAccess } from '@/hooks/use-admin-access';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { t, isRtl } = useLanguage();
  const qc = useQueryClient();
  const logout = useLogout();
  // Poll so revoked grants / disabled accounts take effect within 15s.
  const { data: me, isLoading, error } = useGetAuthMe({ query: { queryKey: getGetAuthMeQueryKey(), refetchInterval: 15000 } });
  const access = useAdminAccess();

  useEffect(() => {
    if (!isLoading && (error || !me)) setLocation('/admin/login');
  }, [isLoading, me, error, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (error || !me) return null;

  if (!access.canAccessPath(location)) {
    const isRoot = location.replace(/\/+$/, '') === '/admin';
    if (isRoot && access.firstAllowedPath && access.firstAllowedPath !== '/admin') return <Redirect to={access.firstAllowedPath} />;
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-muted/40 p-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full rounded-xl border bg-card p-8 text-center space-y-4 shadow-sm" data-testid="screen-forbidden">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="text-xl font-extrabold text-secondary">{t('403 - لا تملك صلاحية', '403 - No permission')}</h1>
          <p className="text-sm text-muted-foreground">
            {access.firstAllowedPath
              ? t('ليس لديك صلاحية الوصول إلى هذه الصفحة.', 'You do not have permission to open this page.')
              : t('لم يتم منح حسابك أي صلاحية. تواصل مع مدير النظام.', 'Your account has no access grants. Contact an administrator.')}
          </p>
          {access.firstAllowedPath && (
            <Button asChild data-testid="link-first-allowed"><Link href={access.firstAllowedPath}>{t('الانتقال إلى أول قسم متاح', 'Go to your first available section')}</Link></Button>
          )}
          {!access.firstAllowedPath && (
            <Button variant="outline" data-testid="button-forbidden-logout" onClick={() => logout.mutate(undefined, { onSuccess: () => { qc.clear(); setLocation('/admin/login'); } })}>{t('تسجيل الخروج', 'Logout')}</Button>
          )}
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
