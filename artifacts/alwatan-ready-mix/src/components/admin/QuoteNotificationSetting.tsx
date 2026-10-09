import { useEffect, useState } from 'react';
import { useGetAdminSettings, useUpdateAdminSettings, getGetAdminSettingsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from './studio-ui';

export default function QuoteNotificationSetting() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const query = useGetAdminSettings();
  const mutation = useUpdateAdminSettings();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  useEffect(() => { if (query.data) setEmail(query.data.quoteEmail || ''); }, [query.data]);
  return (
    <Card className="space-y-3">
      <h3 className="font-bold">{t('إشعارات رسائل التواصل', 'Contact message notifications')}</h3>
      <p className="text-sm text-muted-foreground">{t('بريد استقبال إشعارات التواصل عند تفعيل خدمة البريد. يحفظ مباشرة بشكل مستقل عن مسودة الموقع، ولا ينشئ حملات بريد.', 'Recipient for contact notifications when email is configured. Saved separately from the website draft; this does not create email campaigns.')}</p>
      {query.error ? <Button variant="outline" onClick={() => void query.refetch()}>{t('إعادة المحاولة', 'Retry')}</Button> : (
        <form className="flex flex-wrap gap-3" onSubmit={e => {
          e.preventDefault();
          mutation.mutate({ data: { quoteEmail: email.trim() } }, {
            onSuccess: () => { void qc.invalidateQueries({ queryKey: getGetAdminSettingsQueryKey() }); toast({ title: t('تم حفظ بريد الإشعارات', 'Notification email saved') }); },
            onError: () => toast({ title: t('تعذر الحفظ', 'Could not save'), variant: 'destructive' }),
          });
        }}>
          <Input type="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} disabled={query.isLoading} maxLength={200} placeholder="sales@example.com" className="min-w-52 flex-1" aria-label={t('بريد إشعارات التواصل', 'Contact notification email')} />
          <Button type="submit" disabled={query.isLoading || mutation.isPending}>{t('حفظ بريد الإشعارات', 'Save notification email')}</Button>
        </form>
      )}
    </Card>
  );
}
