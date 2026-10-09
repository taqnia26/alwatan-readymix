import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useGetHome } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { usePublicStudio } from '@/hooks/use-public-studio';
import { pick } from '@/lib/studio';
import HeroSlider from '@/components/public/HeroSlider';
import HomeSections from '@/components/public/HomeSections';

export default function Home() {
  const { t, language } = useLanguage();
  const studio = usePublicStudio();
  const home = useGetHome();
  const cfg = studio.data;

  useEffect(() => {
    if (!cfg) return;
    const title = pick(language, cfg.branding.seoTitleAr, cfg.branding.seoTitleEn);
    if (title) document.title = title;
    const d = pick(language, cfg.branding.seoDescriptionAr, cfg.branding.seoDescriptionEn);
    if (d) document.querySelector('meta[name="description"]')?.setAttribute('content', d);
  }, [cfg, language]);

  if (studio.isLoading) {
    return <div><Skeleton className="h-[78dvh] w-full rounded-none" /><div className="container mx-auto mt-10 grid gap-6 px-6 md:grid-cols-3"><Skeleton className="h-60" /><Skeleton className="h-60" /><Skeleton className="h-60" /></div></div>;
  }
  if (studio.error || !cfg) {
    return (
      <div className="container mx-auto px-6 py-24 text-center" data-testid="error-studio">
        <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-destructive" />
        <h2 className="mb-2 text-2xl font-extrabold">{t('تعذر تحميل محتوى الصفحة', 'Could not load page content')}</h2>
        <p className="mb-6 text-muted-foreground">{studio.error instanceof Error ? studio.error.message : ''}</p>
        <Button onClick={() => studio.refetch()}>{t('إعادة المحاولة', 'Retry')}</Button>
      </div>
    );
  }
  const slides = cfg.slides.filter((s) => s.enabled && s.imageUrl);
  return (
    <div className="flex flex-col">
      <HeroSlider slides={slides} />
      <HomeSections sections={cfg.homeSections} home={home.data} videos={cfg.videos} />
    </div>
  );
}
