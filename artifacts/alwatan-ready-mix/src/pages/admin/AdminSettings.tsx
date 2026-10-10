import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetAdminSettings, useUpdateAdminSettings, getGetAdminSettingsQueryKey } from '@workspace/api-client-react';
import AdminBranding from './AdminBranding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const settings = useGetAdminSettings();
  const save = useUpdateAdminSettings();
  const [email, setEmail] = useState('');
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (settings.data && !dirty) setEmail(settings.data.quoteEmail ?? '');
  }, [settings.data, dirty]);

  return <div className="space-y-6">
    <AdminBranding />
    <form className="space-y-3 rounded-xl border bg-card p-5" onSubmit={async e => {
      e.preventDefault();
      try {
        await save.mutateAsync({ data: { quoteEmail: email.trim() } });
        await qc.invalidateQueries({ queryKey: getGetAdminSettingsQueryKey() });
        setDirty(false);
        toast({ title: t('تم حفظ بريد استقبال الطلبات', 'Quote notification email saved') });
      } catch (error) {
        toast({ title: t('تعذر حفظ البريد', 'Could not save email'), description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
      }
    }}>
      <h3 className="font-bold">{t('إشعارات طلبات التسعير', 'Quote notifications')}</h3>
      <p className="text-sm text-muted-foreground">{t('بيانات الموقع والتواصل أعلاه تستخدم المسودة والنشر. هذا البريد إعداد داخلي يُحفظ مباشرة.', 'Site and contact data above use draft/publish. This internal email setting saves immediately.')}</p>
      {settings.error ? <Button type="button" variant="outline" onClick={() => void settings.refetch()}>{t('إعادة تحميل الإعدادات', 'Reload settings')}</Button> : <>
        <label className="block text-sm font-semibold" htmlFor="quote-notification-email">{t('بريد استقبال الطلبات', 'Notification email')}</label>
        <Input id="quote-notification-email" type="email" dir="ltr" value={email} onChange={e => { setEmail(e.target.value); setDirty(true); }} disabled={settings.isLoading || save.isPending} />
        <Button type="submit" disabled={settings.isLoading || save.isPending || !dirty}>{save.isPending ? t('جارٍ الحفظ...', 'Saving...') : t('حفظ بريد الطلبات', 'Save notification email')}</Button>
      </>}
    </form>
  </div>;
}
