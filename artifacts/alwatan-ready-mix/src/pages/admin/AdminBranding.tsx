import { Plus } from 'lucide-react';
import type { StudioBranding } from '@workspace/api-client-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { useStudioEditor } from '@/hooks/use-studio-editor';
import { moveItem, patchItem, removeItem, uid } from '@/lib/studio';
import { Bi, Card, Media, PageHead, RowControls, StudioGate, Toggle, Txt } from '@/components/admin/studio-ui';
import QuoteNotificationSetting from '@/components/admin/QuoteNotificationSetting';

export default function AdminBranding() {
  const { t } = useLanguage();
  const { update } = useStudioEditor();
  const setB = (p: Partial<StudioBranding>) => update((c) => ({ ...c, branding: { ...c.branding, ...p } }));
  return (
    <StudioGate>
      {(cfg) => {
        const b = cfg.branding;
        return (
          <div className="space-y-5">
            <PageHead title={t('الهوية والقائمة والتذييل', 'Branding, navigation & footer')} desc={t('هذه البيانات تحل محل الإعدادات القديمة للهاتف والتواصل بعد النشر.', 'After publishing, these values drive phone and social details site-wide.')} />
            <Tabs defaultValue="identity">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="identity">{t('الهوية', 'Identity')}</TabsTrigger>
                <TabsTrigger value="contact">{t('التواصل', 'Contact & social')}</TabsTrigger>
                <TabsTrigger value="nav">{t('القائمة', 'Navigation')}</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>
              <TabsContent value="identity" className="mt-4"><Card className="space-y-4">
                <Bi label={t('اسم الشركة', 'Company name')} ar={b.nameAr} en={b.nameEn} onAr={(v) => setB({ nameAr: v })} onEn={(v) => setB({ nameEn: v })} max={200} />
                <Media label={t('الشعار', 'Logo')} value={b.logoUrl} onChange={(v) => setB({ logoUrl: v })} />
                <Bi label={t('نص التذييل', 'Footer text')} multiline rows={3} ar={b.footerAr} en={b.footerEn} onAr={(v) => setB({ footerAr: v })} onEn={(v) => setB({ footerEn: v })} max={3000} />
              </Card></TabsContent>
              <TabsContent value="contact" className="mt-4 space-y-4"><Card className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <Txt label={t('رقم التواصل ١ (الرئيسي)', 'Contact number 1 (primary)')} value={b.phone} dir="ltr" onChange={(v) => setB({ phone: v })} max={50} testId="input-contact-phone-1" />
                  <Txt label={t('رقم التواصل ٢', 'Contact number 2')} value={b.phone2 || ''} dir="ltr" onChange={(v) => setB({ phone2: v })} max={50} testId="input-contact-phone-2" />
                  <Txt label={t('رقم التواصل ٣', 'Contact number 3')} value={b.phone3 || ''} dir="ltr" onChange={(v) => setB({ phone3: v })} max={50} testId="input-contact-phone-3" />
                  <Txt label={t('رقم التواصل ٤', 'Contact number 4')} value={b.phone4 || ''} dir="ltr" onChange={(v) => setB({ phone4: v })} max={50} testId="input-contact-phone-4" />
                  <Txt label={t('البريد الإلكتروني للتواصل', 'Contact email')} value={b.email} dir="ltr" onChange={(v) => setB({ email: v })} max={200} testId="input-contact-email" />
                  <Txt label={t('البريد الإلكتروني الثاني (اختياري)', 'Second contact email (optional)')} value={b.email2 || ''} dir="ltr" onChange={(v) => setB({ email2: v })} max={200} testId="input-contact-email-2" />
                  <Txt label={t('واتساب (أرقام فقط)', 'WhatsApp (digits)')} value={b.whatsapp} dir="ltr" onChange={(v) => setB({ whatsapp: v })} max={50} />
                </div>
                <Media label={t('الملف التعريفي PDF', 'Company profile PDF')} kind="pdf" value={b.profileUrl} onChange={(v) => setB({ profileUrl: v })} />
                <div className="grid gap-3 md:grid-cols-3">
                  <Txt label="Facebook" value={b.facebook} dir="ltr" onChange={(v) => setB({ facebook: v })} />
                  <Txt label="Instagram" value={b.instagram} dir="ltr" onChange={(v) => setB({ instagram: v })} />
                  <Txt label="LinkedIn" value={b.linkedin} dir="ltr" onChange={(v) => setB({ linkedin: v })} />
                </div>
              </Card><QuoteNotificationSetting /></TabsContent>
              <TabsContent value="nav" className="mt-4 space-y-3">
                {cfg.navigation.map((n, i) => (
                  <Card key={n.id} className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Toggle label={t('ظاهر', 'Visible')} checked={n.visible} onChange={(v) => update((c) => ({ ...c, navigation: patchItem(c.navigation, i, { visible: v }) }))} />
                      <RowControls index={i} count={cfg.navigation.length} onMove={(d) => update((c) => ({ ...c, navigation: moveItem(c.navigation, i, d) }))} onRemove={() => update((c) => ({ ...c, navigation: removeItem(c.navigation, i) }))} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Txt label={t('التسمية (عربي)', 'Label (AR)')} value={n.labelAr} dir="rtl" max={100} onChange={(v) => update((c) => ({ ...c, navigation: patchItem(c.navigation, i, { labelAr: v }) }))} />
                      <Txt label={t('التسمية (إنجليزي)', 'Label (EN)')} value={n.labelEn} dir="ltr" max={100} onChange={(v) => update((c) => ({ ...c, navigation: patchItem(c.navigation, i, { labelEn: v }) }))} />
                      <Txt label={t('الرابط', 'Link')} value={n.href} dir="ltr" onChange={(v) => update((c) => ({ ...c, navigation: patchItem(c.navigation, i, { href: v }) }))} />
                    </div>
                  </Card>
                ))}
                <Button variant="outline" className="gap-2" disabled={cfg.navigation.length >= 20} onClick={() => update((c) => ({ ...c, navigation: [...c.navigation, { id: uid('nav'), labelAr: '', labelEn: '', href: '/', visible: true }] }))}><Plus className="h-4 w-4" />{t('إضافة رابط', 'Add link')}</Button>
              </TabsContent>
              <TabsContent value="seo" className="mt-4"><Card className="space-y-4">
                <Bi label={t('عنوان SEO', 'SEO title')} ar={b.seoTitleAr} en={b.seoTitleEn} onAr={(v) => setB({ seoTitleAr: v })} onEn={(v) => setB({ seoTitleEn: v })} max={200} />
                <Bi label={t('وصف SEO', 'SEO description')} multiline rows={3} ar={b.seoDescriptionAr} en={b.seoDescriptionEn} onAr={(v) => setB({ seoDescriptionAr: v })} onEn={(v) => setB({ seoDescriptionEn: v })} max={500} />
              </Card></TabsContent>
            </Tabs>
          </div>
        );
      }}
    </StudioGate>
  );
}
