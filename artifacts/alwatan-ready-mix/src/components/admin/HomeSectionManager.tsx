import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import type { StudioConfig, StudioHomeSection } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/lib/i18n';
import { useStudioEditor } from '@/hooks/use-studio-editor';
import { HOME_KEY_LABELS, moveItem, newHomeSection, patchItem, removeItem, pick } from '@/lib/studio';
import { Bi, Media, RowControls, Toggle, Txt } from './studio-ui';

export default function HomeSectionManager({ cfg }: { cfg: StudioConfig }) {
  const { t, language } = useLanguage();
  const { update } = useStudioEditor();
  const [openId, setOpenId] = useState<string | null>(null);
  const set = (fn: (a: StudioHomeSection[]) => StudioHomeSection[]) => update((c) => ({ ...c, homeSections: fn(c.homeSections) }));
  const label = (k: string) => (language === 'ar' ? HOME_KEY_LABELS[k][0] : HOME_KEY_LABELS[k][1]);
  const keys = Object.keys(HOME_KEY_LABELS) as StudioHomeSection['key'][];
  const addable = keys.filter((k) => k === 'custom' || !cfg.homeSections.some((s) => s.key === k));
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t('الترتيب هنا هو ترتيب ظهور الأقسام في الصفحة الرئيسية. الحقول الفارغة تستخدم النصوص الافتراضية من إدارة المحتوى.', 'Order here is the order on the homepage. Empty fields fall back to existing Content text.')}</p>
      {cfg.homeSections.map((s, i) => {
        const open = openId === s.id;
        return (
          <div key={s.id} className={`rounded-xl border bg-card shadow-sm ${s.visible ? '' : 'opacity-70'}`} data-testid={`row-home-${s.key}-${i}`}>
            <div className="flex flex-wrap items-center gap-2 p-3">
              <button className="flex min-w-0 flex-1 items-center gap-3 text-start" onClick={() => setOpenId(open ? null : s.id)} aria-expanded={open}>
                <ChevronDown className={`h-4 w-4 transition ${open ? '' : '-rotate-90 rtl:rotate-90'}`} />
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-xs font-black text-white">{i + 1}</span>
                <span className="font-extrabold text-secondary">{label(s.key)}</span>
                <span className="truncate text-sm text-muted-foreground">{pick(language, s.titleAr, s.titleEn)}</span>
              </button>
              <Toggle label={t('ظاهر', 'Visible')} checked={s.visible} onChange={(v) => set((a) => patchItem(a, i, { visible: v }))} testId={`switch-home-visible-${i}`} />
              <RowControls index={i} count={cfg.homeSections.length} onMove={(d) => set((a) => moveItem(a, i, d))} onRemove={() => set((a) => removeItem(a, i))} />
            </div>
            {open && (
              <div className="space-y-4 border-t p-4">
                <Bi label={t('العنوان', 'Title')} ar={s.titleAr} en={s.titleEn} onAr={(v) => set((a) => patchItem(a, i, { titleAr: v }))} onEn={(v) => set((a) => patchItem(a, i, { titleEn: v }))} max={200} />
                <Bi label={t('النص', 'Body')} multiline rows={4} ar={s.bodyAr} en={s.bodyEn} onAr={(v) => set((a) => patchItem(a, i, { bodyAr: v }))} onEn={(v) => set((a) => patchItem(a, i, { bodyEn: v }))} max={10000} />
                {(s.key === 'intro' || s.key === 'custom') && <Media label={t('الصورة', 'Image')} value={s.imageUrl} onChange={(v) => set((a) => patchItem(a, i, { imageUrl: v }))} />}
                <Txt label={t('رابط الزر / الصفحة', 'Button / page link')} value={s.href} onChange={(v) => set((a) => patchItem(a, i, { href: v }))} dir="ltr" placeholder="/quote" />
              </div>
            )}
          </div>
        );
      })}
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="outline" className="gap-2" disabled={cfg.homeSections.length >= 30 || addable.length === 0} data-testid="button-add-home-section"><Plus className="h-4 w-4" />{t('إضافة قسم', 'Add section')}</Button></DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {addable.map((k) => <DropdownMenuItem key={k} onClick={() => { const n = newHomeSection(k); set((a) => [...a, n]); setOpenId(n.id); }}>{label(k)}</DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
