import { Copy, Plus } from 'lucide-react';
import { useGetSiteInsights } from '@workspace/api-client-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { useStudioEditor } from '@/hooks/use-studio-editor';
import { patchItem, removeItem, moveItem, uid } from '@/lib/studio';
import { Bi, Card, PageHead, RowControls, StudioGate, Toggle, Txt } from '@/components/admin/studio-ui';

export default function AdminMarketing() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { update } = useStudioEditor();
  const ins = useGetSiteInsights({ days: 30 });
  const base = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}`;
  const link = (c: { id: string; source: string; medium: string; target: string }) => {
    const path = c.target && c.target.startsWith('/') ? c.target : '/';
    const q = new URLSearchParams({ utm_campaign: c.id });
    if (c.source) q.set('utm_source', c.source);
    if (c.medium) q.set('utm_medium', c.medium);
    return `${base}${path}${path.includes('?') ? '&' : '?'}${q.toString()}`;
  };
  return (
    <StudioGate>
      {(cfg) => (
        <div className="space-y-5">
          <PageHead title={t('التسويق', 'Marketing')} desc={t('شريط إعلاني أعلى الموقع وروابط حملات قابلة للتتبع.', 'Top-of-site banners and trackable campaign links.')} />
          <Tabs defaultValue="banners">
            <TabsList>
              <TabsTrigger value="banners">{t('الشرائط الإعلانية', 'Banners')} ({cfg.banners.length})</TabsTrigger>
              <TabsTrigger value="campaigns">{t('الحملات', 'Campaigns')} ({cfg.campaigns.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="banners" className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">{t('يظهر أول شريط مفعّل فقط.', 'Only the first enabled banner is shown.')}</p>
              {cfg.banners.length === 0 && <div className="rounded-xl border border-dashed bg-card p-10 text-center text-muted-foreground">{t('لا شرائط.', 'No banners.')}</div>}
              {cfg.banners.map((b, i) => (
                <Card key={b.id} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Toggle label={t('مفعّل', 'Enabled')} checked={b.enabled} onChange={(v) => update((c) => ({ ...c, banners: patchItem(c.banners, i, { enabled: v }) }))} testId={`switch-banner-${i}`} />
                    <RowControls index={i} count={cfg.banners.length} onMove={(d) => update((c) => ({ ...c, banners: moveItem(c.banners, i, d) }))} onRemove={() => update((c) => ({ ...c, banners: removeItem(c.banners, i) }))} />
                  </div>
                  <Bi label={t('النص', 'Text')} ar={b.textAr} en={b.textEn} onAr={(v) => update((c) => ({ ...c, banners: patchItem(c.banners, i, { textAr: v }) }))} onEn={(v) => update((c) => ({ ...c, banners: patchItem(c.banners, i, { textEn: v }) }))} max={500} />
                  <Txt label={t('الرابط', 'Link')} value={b.href} dir="ltr" placeholder="/quote" onChange={(v) => update((c) => ({ ...c, banners: patchItem(c.banners, i, { href: v }) }))} />
                </Card>
              ))}
              <Button variant="outline" className="gap-2" onClick={() => update((c) => ({ ...c, banners: [...c.banners, { id: uid('banner'), textAr: '', textEn: '', href: '', enabled: false }] }))} data-testid="button-add-banner"><Plus className="h-4 w-4" />{t('إضافة شريط', 'Add banner')}</Button>
            </TabsContent>
            <TabsContent value="campaigns" className="mt-4 space-y-3">
              {cfg.campaigns.length === 0 && <div className="rounded-xl border border-dashed bg-card p-10 text-center text-muted-foreground">{t('لا حملات.', 'No campaigns.')}</div>}
              {cfg.campaigns.map((c, i) => {
                const count = ins.data?.campaigns.find((x) => x.name === c.id)?.count;
                const url = link(c);
                return (
                  <Card key={c.id} className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="rounded bg-primary/10 px-2 py-1 text-xs font-bold text-primary" dir="ltr">{c.id}</span>
                      <span className="text-sm font-semibold text-muted-foreground">{ins.isLoading ? '...' : ins.error ? t('تعذر جلب العدد', 'Count unavailable') : `${count ?? 0} ${t('زيارة (30 يوم)', 'visits (30d)')}`}</span>
                      <RowControls index={i} count={cfg.campaigns.length} onMove={(d) => update((x) => ({ ...x, campaigns: moveItem(x.campaigns, i, d) }))} onRemove={() => update((x) => ({ ...x, campaigns: removeItem(x.campaigns, i) }))} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-4">
                      <Txt label={t('اسم الحملة', 'Name')} value={c.name} max={100} onChange={(v) => update((x) => ({ ...x, campaigns: patchItem(x.campaigns, i, { name: v }) }))} />
                      <Txt label="utm_source" value={c.source} dir="ltr" onChange={(v) => update((x) => ({ ...x, campaigns: patchItem(x.campaigns, i, { source: v }) }))} />
                      <Txt label="utm_medium" value={c.medium} dir="ltr" onChange={(v) => update((x) => ({ ...x, campaigns: patchItem(x.campaigns, i, { medium: v }) }))} />
                      <Txt label={t('الصفحة المستهدفة', 'Target path')} value={c.target} dir="ltr" placeholder="/quote" onChange={(v) => update((x) => ({ ...x, campaigns: patchItem(x.campaigns, i, { target: v }) }))} />
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
                      <code className="min-w-0 flex-1 truncate text-xs" dir="ltr">{url}</code>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { void navigator.clipboard.writeText(url); toast({ title: t('تم نسخ الرابط', 'Link copied') }); }}><Copy className="h-3.5 w-3.5" />{t('نسخ', 'Copy')}</Button>
                    </div>
                  </Card>
                );
              })}
              <Button variant="outline" className="gap-2" onClick={() => update((c) => ({ ...c, campaigns: [...c.campaigns, { id: uid('camp'), name: '', source: '', medium: '', target: '/' }] }))} data-testid="button-add-campaign"><Plus className="h-4 w-4" />{t('إضافة حملة', 'Add campaign')}</Button>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </StudioGate>
  );
}
