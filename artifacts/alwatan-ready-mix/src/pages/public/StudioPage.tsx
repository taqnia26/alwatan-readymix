import { useEffect } from 'react';
import { useParams } from 'wouter';
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { usePublicStudio } from '@/hooks/use-public-studio';
import { pick } from '@/lib/studio';
import StudioSections from '@/components/public/StudioSections';
import NotFound from '@/pages/not-found';

export default function StudioPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const studio = usePublicStudio();
  const page = studio.data?.pages.find((p) => p.slug === slug && p.published);
  const title = page ? pick(language, page.titleAr, page.titleEn) : '';
  const desc = page ? pick(language, page.descriptionAr, page.descriptionEn) : '';

  useEffect(() => {
    if (!page) return;
    const brand = studio.data ? pick(language, studio.data.branding.nameAr, studio.data.branding.nameEn) : '';
    document.title = `${title} | ${brand}`;
    const m = document.querySelector('meta[name="description"]');
    if (m && desc) m.setAttribute('content', desc);
  }, [page, title, desc, language, studio.data]);

  if (studio.isLoading) return <div className="container mx-auto space-y-4 px-6 py-16"><Skeleton className="h-16 w-2/3" /><Skeleton className="h-64" /></div>;
  if (studio.error) return <div className="container mx-auto px-6 py-24 text-center"><AlertTriangle className="mx-auto mb-4 h-10 w-10 text-destructive" /><Button onClick={() => studio.refetch()}>{t('إعادة المحاولة', 'Retry')}</Button></div>;
  if (!page) return <NotFound />;

  return (
    <div>
      <section className="relative overflow-hidden bg-secondary py-16 text-white md:py-24">
        <div className="absolute inset-0 grid-blueprint" />
        <div className="absolute inset-x-0 top-0 h-1 flow-line" />
        <div className="container relative mx-auto px-6">
          <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">{title}</h1>
          {desc && <p className="mt-5 max-w-2xl text-lg leading-loose text-white/75">{desc}</p>}
        </div>
      </section>
      <StudioSections sections={page.sections} />
    </div>
  );
}
