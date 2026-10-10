import { useState } from 'react';
import { Plus, Eye, Navigation, FilePlus2, ExternalLink, ChevronDown } from 'lucide-react';
import type { StudioConfig, StudioPage, StudioPageSection } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/lib/i18n';
import { useStudioEditor } from '@/hooks/use-studio-editor';
import { moveItem, newPage, newSection, patchItem, removeItem, slugify, uid, pick, pageHref } from '@/lib/studio';
import { Bi, Card, ConfirmDelete, Field, Media, RowControls, Toggle, Txt } from './studio-ui';
import StudioSections from '@/components/public/StudioSections';
import { useToast } from '@/hooks/use-toast';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function SectionEditor({ s, i, count, onChange, onMove, onRemove }: { s: StudioPageSection; i: number; count: number; onChange: (p: Partial<StudioPageSection>) => void; onMove: (d: -1 | 1) => void; onRemove: () => void }) {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(true);
  const kinds: [StudioPageSection['kind'], string][] = [['text', t('نص', 'Text')], ['image', t('صورة', 'Image')], ['video', t('فيديو', 'Video')], ['cta', t('دعوة لإجراء', 'Call to action')]];
  return (
    <div className={`rounded-lg border bg-background ${s.visible ? '' : 'opacity-70'}`}>
      <div className="flex flex-wrap items-center gap-2 p-3">
        <button type="button" onClick={() => setOpen(!open)} className="flex flex-1 items-center gap-2 text-start min-w-0" aria-expanded={open}>
          <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? '' : '-rotate-90 rtl:rotate-90'}`} />
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{i + 1}. {kinds.find(([k]) => k === s.kind)?.[1]}</span>
          <span className="truncate text-sm font-semibold">{pick(language, s.headingAr, s.headingEn) || t('بدون عنوان', 'Untitled')}</span>
        </button>
        <Toggle label={t('ظاهر', 'Visible')} checked={s.visible} onChange={(v) => onChange({ visible: v })} />
        <RowControls index={i} count={count} onMove={onMove} onRemove={onRemove} />
      </div>
      {open && (
        <div className="space-y-4 border-t p-4">
          <Field label={t('نوع القسم', 'Section type')}>
            <Select value={s.kind} onValueChange={(v) => onChange({ kind: v as StudioPageSection['kind'] })}>
              <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
              <SelectContent>{kinds.map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Bi label={t('العنوان', 'Heading')} ar={s.headingAr} en={s.headingEn} onAr={(v) => onChange({ headingAr: v })} onEn={(v) => onChange({ headingEn: v })} max={200} />
          <Bi label={t('النص', 'Body')} multiline rows={5} ar={s.bodyAr} en={s.bodyEn} onAr={(v) => onChange({ bodyAr: v })} onEn={(v) => onChange({ bodyEn: v })} max={20000} />
          {(s.kind === 'image' || s.kind === 'video') && <Media label={s.kind === 'image' ? t('الصورة', 'Image') : t('ملف الفيديو', 'Video file')} kind={s.kind} value={s.mediaUrl} onChange={(v) => onChange({ mediaUrl: v })} />}
          {(s.kind === 'cta' || s.kind === 'text' || s.kind === 'image') && (
            <div className="grid gap-3 md:grid-cols-3">
              <Txt label={t('نص الزر (عربي)', 'Button (AR)')} value={s.buttonAr} onChange={(v) => onChange({ buttonAr: v })} dir="rtl" max={100} />
              <Txt label={t('نص الزر (إنجليزي)', 'Button (EN)')} value={s.buttonEn} onChange={(v) => onChange({ buttonEn: v })} dir="ltr" max={100} />
              <Txt label={t('الرابط', 'Link')} value={s.href} onChange={(v) => onChange({ href: v })} dir="ltr" placeholder="/quote" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PageEditor({ page, index, cfg, onBack }: { page: StudioPage; index: number; cfg: StudioConfig; onBack: () => void }) {
  const { t, language } = useLanguage();
  const { update } = useStudioEditor();
  const { toast } = useToast();
  const [preview, setPreview] = useState(false);
  const set = (p: Partial<StudioPage>) => update((c) => ({
    ...c, pages: patchItem(c.pages, index, p),
    navigation: c.navigation.map(n => n.href === pageHref(page.slug) ? {
      ...n, href: pageHref(p.slug ?? page.slug),
      labelAr: n.labelAr === page.titleAr ? p.titleAr ?? n.labelAr : n.labelAr,
      labelEn: n.labelEn === page.titleEn ? p.titleEn ?? n.labelEn : n.labelEn,
    } : n),
  }));
  const setSections = (fn: (s: StudioPageSection[]) => StudioPageSection[]) => update((c) => ({ ...c, pages: c.pages.map((p, k) => (k === index ? { ...p, sections: fn(p.sections) } : p)) }));
  const slugOk = SLUG_RE.test(page.slug) && !cfg.pages.some((p, k) => k !== index && p.slug === page.slug);
  const inNav = cfg.navigation.some((n) => n.href === pageHref(page.slug));
  const addNav = () => {
    update((c) => ({ ...c, navigation: [...c.navigation, { id: uid('nav'), labelAr: page.titleAr, labelEn: page.titleEn, href: pageHref(page.slug), visible: true }] }));
    toast({ title: t('أضيفت الصفحة إلى القائمة (في المسودة)', 'Page added to navigation (in draft)') });
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={onBack} data-testid="button-back-pages">{t('رجوع للصفحات', 'Back to pages')}</Button>
        <div className="ms-auto flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPreview(true)} data-testid="button-preview-page"><Eye className="h-4 w-4" />{t('معاينة المسودة', 'Preview draft')}</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={addNav} disabled={inNav || !slugOk} data-testid="button-add-nav"><Navigation className="h-4 w-4" />{inNav ? t('في القائمة', 'In navigation') : t('إضافة للقائمة', 'Add to navigation')}</Button>
        </div>
      </div>
      <Card className="space-y-4">
        <Bi label={t('عنوان الصفحة', 'Page title')} ar={page.titleAr} en={page.titleEn} onAr={(v) => set({ titleAr: v })} onEn={(v) => set({ titleEn: v })} max={200} testId="input-page-title" />
        <Bi label={t('وصف SEO', 'SEO description')} multiline rows={2} ar={page.descriptionAr} en={page.descriptionEn} onAr={(v) => set({ descriptionAr: v })} onEn={(v) => set({ descriptionEn: v })} max={500} />
        <div className="grid items-end gap-4 md:grid-cols-2">
          <Field label={t('الرابط المختصر (slug)', 'URL slug')} hint={slugOk ? pageHref(page.slug) : t('أحرف إنجليزية صغيرة وأرقام وشرطات، وفريد', 'Lowercase letters, digits, hyphens; must be unique')}>
            <Input value={page.slug} readOnly={page.slug === 'about'} dir="ltr" onChange={(e) => set({ slug: e.target.value })} className={slugOk ? '' : 'border-destructive'} data-testid="input-page-slug" />
          </Field>
          <div className="flex flex-wrap items-center gap-4">
            <Toggle label={page.published ? t('منشورة (عند النشر)', 'Published (on publish)') : t('مسودة', 'Draft')} checked={page.published} onChange={(v) => set({ published: v })} testId="switch-page-published" />
            {page.published && slugOk && <a href={pageHref(page.slug)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"><ExternalLink className="h-3.5 w-3.5" />{t('فتح العام', 'Open live')}</a>}
          </div>
        </div>
      </Card>
      <div className="space-y-3">
        <h3 className="font-extrabold text-secondary">{t('أقسام الصفحة', 'Page sections')} <span className="text-sm font-semibold text-muted-foreground">({page.sections.length}/60)</span></h3>
        {page.sections.length === 0 && <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">{t('لا أقسام بعد. أضف أول قسم.', 'No sections yet. Add the first one.')}</div>}
        {page.sections.map((s, i) => (
          <SectionEditor key={s.id} s={s} i={i} count={page.sections.length}
            onChange={(p) => setSections((arr) => patchItem(arr, i, p))}
            onMove={(d) => setSections((arr) => moveItem(arr, i, d))}
            onRemove={() => setSections((arr) => removeItem(arr, i))} />
        ))}
        <div className="flex flex-wrap gap-2">
          {(['text', 'image', 'video', 'cta'] as const).map((k) => (
            <Button key={k} variant="outline" size="sm" className="gap-1.5" disabled={page.sections.length >= 60} onClick={() => setSections((arr) => [...arr, newSection(k)])} data-testid={`button-add-section-${k}`}>
              <Plus className="h-4 w-4" />{{ text: t('نص', 'Text'), image: t('صورة', 'Image'), video: t('فيديو', 'Video'), cta: t('دعوة لإجراء', 'CTA') }[k]}
            </Button>
          ))}
        </div>
      </div>
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-h-[92dvh] max-w-5xl overflow-hidden p-0" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader className="border-b p-4"><DialogTitle>{t('معاينة المسودة', 'Draft preview')}</DialogTitle><DialogDescription>{t('هكذا ستظهر الصفحة بعد النشر.', 'How the page will look once published.')}</DialogDescription></DialogHeader>
          <div className="admin-scrollbar max-h-[75dvh] overflow-y-auto bg-background">
            <div className="bg-secondary px-6 py-10 text-white"><h1 className="text-3xl font-black">{pick(language, page.titleAr, page.titleEn) || t('بدون عنوان', 'Untitled')}</h1><p className="mt-3 text-white/75">{pick(language, page.descriptionAr, page.descriptionEn)}</p></div>
            <StudioSections sections={page.sections} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PageBuilder({ cfg }: { cfg: StudioConfig }) {
  const { t, language } = useLanguage();
  const { update } = useStudioEditor();
  const [sel, setSel] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [slug, setSlug] = useState('');
  const idx = cfg.pages.findIndex((p) => p.id === sel);
  const slugOk = SLUG_RE.test(slug) && !cfg.pages.some((p) => p.slug === slug);

  if (idx >= 0) return <PageEditor page={cfg.pages[idx]} index={idx} cfg={cfg} onBack={() => setSel(null)} />;

  const create = () => {
    const p = newPage(slug);
    update((c) => ({ ...c, pages: [...c.pages, p] }));
    setCreating(false); setSlug(''); setSel(p.id);
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t('من نحن مرتبطة مباشرة بـ /about. الصفحات الجديدة تُعرض على /p/الرابط بعد النشر.', 'About is connected to /about. Custom pages appear at /p/slug after publishing.')}</p>
        <Button className="gap-2" onClick={() => setCreating(true)} disabled={cfg.pages.length >= 60} data-testid="button-new-page"><FilePlus2 className="h-4 w-4" />{t('صفحة جديدة', 'New page')}</Button>
      </div>
      {cfg.pages.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-14 text-center"><FilePlus2 className="mx-auto mb-3 h-10 w-10 text-primary/50" /><p className="font-bold">{t('لا توجد صفحات مخصصة', 'No custom pages yet')}</p><p className="mb-4 text-sm text-muted-foreground">{t('أنشئ صفحة من أقسام نص وصورة وفيديو.', 'Build a page from text, image and video sections.')}</p><Button onClick={() => setCreating(true)}>{t('إنشاء صفحة', 'Create page')}</Button></div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {cfg.pages.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm" data-testid={`card-page-${p.slug}`}>
              <button className="min-w-0 flex-1 text-start" onClick={() => setSel(p.id)}>
                <div className="truncate font-extrabold text-secondary">{pick(language, p.titleAr, p.titleEn) || t('بدون عنوان', 'Untitled')}</div>
                <div className="mt-1 flex items-center gap-2 text-xs"><span dir="ltr" className="text-muted-foreground">{pageHref(p.slug)}</span><span className={`rounded-full px-2 py-0.5 font-bold ${p.published ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'}`}>{p.published ? t('منشورة', 'Published') : t('مسودة', 'Draft')}</span><span className="text-muted-foreground">{p.sections.length} {t('قسم', 'sections')}</span></div>
              </button>
              <Button variant="outline" size="sm" onClick={() => setSel(p.id)}>{t('تحرير', 'Edit')}</Button>
              {p.slug !== 'about' && <ConfirmDelete title={t('حذف هذه الصفحة؟', 'Remove this page?')} onConfirm={() => update((c) => ({ ...c, pages: removeItem(c.pages, i), navigation: c.navigation.filter((n) => n.href !== pageHref(p.slug)) }))}>
                {(open) => <Button variant="outline" size="icon" className="h-9 w-9 text-destructive" onClick={open} aria-label={t('حذف', 'Remove')}><span className="sr-only">x</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg></Button>}
              </ConfirmDelete>}
            </div>
          ))}
        </div>
      )}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{t('صفحة جديدة', 'New page')}</DialogTitle><DialogDescription>{t('اختر رابطا مختصرا بأحرف إنجليزية.', 'Choose a short English slug.')}</DialogDescription></DialogHeader>
          <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value) === e.target.value ? e.target.value : e.target.value.toLowerCase())} dir="ltr" placeholder="about-our-plants" data-testid="input-new-slug" />
          {slug && !slugOk && <p className="text-sm text-destructive">{t('الرابط غير صالح أو مستخدم', 'Slug invalid or already used')}</p>}
          <DialogFooter><Button variant="ghost" onClick={() => setCreating(false)}>{t('إلغاء', 'Cancel')}</Button><Button disabled={!slugOk} onClick={create} data-testid="button-create-page">{t('إنشاء', 'Create')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
