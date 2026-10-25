import { ShieldAlert } from 'lucide-react';
import AdminPages from './AdminPages';
import { useLanguage } from '@/lib/i18n';
import { useAdminAccess } from '@/hooks/use-admin-access';

// Text editing uses the page builder, which needs pages access.
export default function AdminContent() {
  const { t } = useLanguage();
  const { canView } = useAdminAccess();
  if (!canView('pages')) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center space-y-2" data-testid="notice-content-needs-pages">
        <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="font-bold text-secondary">{t('محرر النصوص يتطلب صلاحية الصفحات', 'The text editor requires Pages access')}</p>
        <p className="text-sm text-muted-foreground">{t('اطلب من مدير النظام منحك عرض الصفحات.', 'Ask an administrator to grant you Pages view.')}</p>
      </div>
    );
  }
  return <AdminPages initialTab="pages" />;
}
