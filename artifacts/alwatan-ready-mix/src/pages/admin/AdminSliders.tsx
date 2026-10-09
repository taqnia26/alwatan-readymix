import { Plus } from 'lucide-react';
import type { StudioSlide, StudioVideo } from '@workspace/api-client-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { useStudioEditor } from '@/hooks/use-studio-editor';
import { moveItem, newSlide, newVideo, patchItem, removeItem, pick } from '@/lib/studio';
import { Bi, Card, Media, PageHead, RowControls, StudioGate, Toggle, Txt } from '@/components/admin/studio-ui';
import { MediaThumb } from '@/components/admin/MediaPicker';

export default function AdminSliders() {
  const { t, language } = useLanguage();
  const { update } = useStudioEditor();
  const setSlides = (fn: (a: StudioSlide[]) => StudioSlide[]) => update((c) => ({ ...c, slides: fn(c.slides) }));
  const setVideos = (fn: (a: StudioVideo[]) => StudioVideo[]) => update((c) => ({ ...c, videos: fn(c.videos) }));
  return (
    <StudioGate>
      {(cfg) => (
        <div className="space-y-5">
          <PageHead title={t('الشرائح والفيديو', 'Sliders & videos')} desc={t('الترتيب هو ترتيب العرض. عطّل أي عنصر لإخفائه دون حذفه.', 'Order is display order. Disable an item to hide it without deleting.')} />
          <Tabs defaultValue="slides">
            <TabsList>
              <TabsTrigger value="slides" data-testid="tab-slides">{t('شرائح الرئيسية', 'Hero slides')} ({cfg.slides.length})</TabsTrigger>
              <TabsTrigger value="videos" data-testid="tab-videos">{t('الفيديوهات', 'Videos')} ({cfg.videos.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="slides" className="mt-4 space-y-3">
              {cfg.slides.length === 0 && <div className="rounded-xl border border-dashed bg-card p-10 text-center text-muted-foreground">{t('لا شرائح. الصفحة الرئيسية ستعرض بدون سلايدر.', 'No slides. The homepage will show without a slider.')}</div>}
              {cfg.slides.map((s, i) => (
                <Card key={s.id} className={`space-y-4 ${s.enabled ? '' : 'opacity-70'}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    {s.imageUrl ? <MediaThumb url={s.imageUrl} kind="image" className="h-14 w-24 rounded-md border" /> : <div className="h-14 w-24 rounded-md border border-dashed" />}
                    <div className="min-w-0 flex-1"><div className="text-xs font-bold text-primary">{t('شريحة', 'Slide')} {i + 1}</div><div className="truncate font-extrabold text-secondary">{pick(language, s.titleAr, s.titleEn) || t('بدون عنوان', 'Untitled')}</div></div>
                    <Toggle label={t('مفعّلة', 'Enabled')} checked={s.enabled} onChange={(v) => setSlides((a) => patchItem(a, i, { enabled: v }))} testId={`switch-slide-enabled-${i}`} />
                    <RowControls index={i} count={cfg.slides.length} onMove={(d) => setSlides((a) => moveItem(a, i, d))} onRemove={() => setSlides((a) => removeItem(a, i))} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Media label={t('صورة سطح المكتب', 'Desktop image')} value={s.imageUrl} onChange={(v) => setSlides((a) => patchItem(a, i, { imageUrl: v }))} />
                    <Media label={t('صورة الجوال (اختياري)', 'Mobile image (optional)')} value={s.mobileImageUrl} onChange={(v) => setSlides((a) => patchItem(a, i, { mobileImageUrl: v }))} />
                  </div>
                  <Bi label={t('العنوان', 'Title')} ar={s.titleAr} en={s.titleEn} onAr={(v) => setSlides((a) => patchItem(a, i, { titleAr: v }))} onEn={(v) => setSlides((a) => patchItem(a, i, { titleEn: v }))} max={200} />
                  <Bi label={t('العنوان الفرعي', 'Subtitle')} multiline rows={2} ar={s.subtitleAr} en={s.subtitleEn} onAr={(v) => setSlides((a) => patchItem(a, i, { subtitleAr: v }))} onEn={(v) => setSlides((a) => patchItem(a, i, { subtitleEn: v }))} max={1000} />
                  <div className="grid gap-3 md:grid-cols-3">
                    <Txt label={t('نص الزر (عربي)', 'Button (AR)')} value={s.buttonAr} onChange={(v) => setSlides((a) => patchItem(a, i, { buttonAr: v }))} dir="rtl" max={100} />
                    <Txt label={t('نص الزر (إنجليزي)', 'Button (EN)')} value={s.buttonEn} onChange={(v) => setSlides((a) => patchItem(a, i, { buttonEn: v }))} dir="ltr" max={100} />
                    <Txt label={t('رابط الزر', 'Button link')} value={s.href} onChange={(v) => setSlides((a) => patchItem(a, i, { href: v }))} dir="ltr" />
                  </div>
                </Card>
              ))}
              <Button variant="outline" className="gap-2" disabled={cfg.slides.length >= 20} onClick={() => setSlides((a) => [...a, newSlide()])} data-testid="button-add-slide"><Plus className="h-4 w-4" />{t('إضافة شريحة', 'Add slide')}</Button>
            </TabsContent>
            <TabsContent value="videos" className="mt-4 space-y-3">
              {cfg.videos.length === 0 && <div className="rounded-xl border border-dashed bg-card p-10 text-center text-muted-foreground">{t('لا فيديوهات.', 'No videos.')}</div>}
              {cfg.videos.map((v, i) => (
                <Card key={v.id} className={`space-y-4 ${v.enabled ? '' : 'opacity-70'}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1"><div className="text-xs font-bold text-primary">{t('فيديو', 'Video')} {i + 1}</div><div className="truncate font-extrabold text-secondary">{pick(language, v.titleAr, v.titleEn) || t('بدون عنوان', 'Untitled')}</div></div>
                    <Toggle label={t('مفعّل', 'Enabled')} checked={v.enabled} onChange={(x) => setVideos((a) => patchItem(a, i, { enabled: x }))} testId={`switch-video-enabled-${i}`} />
                    <RowControls index={i} count={cfg.videos.length} onMove={(d) => setVideos((a) => moveItem(a, i, d))} onRemove={() => setVideos((a) => removeItem(a, i))} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Media label={t('ملف الفيديو (MP4/WebM)', 'Video file (MP4/WebM)')} kind="video" value={v.src} onChange={(x) => setVideos((a) => patchItem(a, i, { src: x }))} />
                    <Media label={t('صورة الغلاف', 'Poster image')} value={v.poster} onChange={(x) => setVideos((a) => patchItem(a, i, { poster: x }))} />
                  </div>
                  <Bi label={t('العنوان', 'Title')} ar={v.titleAr} en={v.titleEn} onAr={(x) => setVideos((a) => patchItem(a, i, { titleAr: x }))} onEn={(x) => setVideos((a) => patchItem(a, i, { titleEn: x }))} max={200} />
                  <Bi label={t('الوصف', 'Description')} multiline rows={2} ar={v.descriptionAr} en={v.descriptionEn} onAr={(x) => setVideos((a) => patchItem(a, i, { descriptionAr: x }))} onEn={(x) => setVideos((a) => patchItem(a, i, { descriptionEn: x }))} max={1000} />
                </Card>
              ))}
              <Button variant="outline" className="gap-2" disabled={cfg.videos.length >= 20} onClick={() => setVideos((a) => [...a, newVideo()])} data-testid="button-add-video"><Plus className="h-4 w-4" />{t('إضافة فيديو', 'Add video')}</Button>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </StudioGate>
  );
}
