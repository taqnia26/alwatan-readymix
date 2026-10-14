import BrandEnergyLines from '@/components/public/BrandEnergyLines';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Download, ExternalLink, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { trackSiteActivity } from '@/lib/site-activity';
import { usePublicStudio } from '@/hooks/use-public-studio';
import { ProfileError } from '@/components/public/profile/ProfileViewer';

const ProfileViewer = lazy(() => import('@/components/public/profile/ProfileViewer'));
const DEFAULT_PROFILE_URL = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/alwatan-company-profile.pdf`;

export default function CompanyProfile() {
  const { t } = useLanguage();
  const [showViewer, setShowViewer] = useState(false);
  const studio = usePublicStudio();
  const configFailed = !studio.data && studio.isError;
  const configLoading = !studio.data && !studio.isError;
  const configured = studio.data?.branding?.profileUrl?.trim() ?? '';
  const PROFILE_URL = configured || DEFAULT_PROFILE_URL;
  const isDefault = !configLoading && !configFailed && PROFILE_URL === DEFAULT_PROFILE_URL;

  useEffect(() => {
    document.title = t(
      'الملف التعريفي | شركة الوطن للخرسانة الجاهزة',
      'Company Profile | AlWatan Ready-Mix',
    );
  }, [t]);

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden bg-secondary py-20 text-secondary-foreground md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.2),transparent_42%)]" />
        <BrandEnergyLines />
        <div className="container relative mx-auto px-6 text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
            <FileText className="h-4 w-4" />
            {t('الملف التعريفي للشركة', 'Company Profile')}
          </span>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">
            {t('تعرّف على الوطن عن قرب', 'Discover AlWatan Up Close')}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-secondary-foreground/75">
            {t(
              'اطّلع على مسيرة الشركة وقدراتها ومشاريعها واعتماداتها من خلال الملف التعريفي الرسمي.',
              'Explore the company journey, capabilities, projects, and certifications through our official company profile.',
            )}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-6 py-14 md:py-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
          <div className="grid items-center gap-0 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="relative min-h-[360px] overflow-hidden bg-muted lg:min-h-[540px]">
              {isDefault ? <img
                src="/company-profile-cover.png"
                alt={t('غلاف الملف التعريفي لشركة الوطن', 'AlWatan company profile cover')}
                className="absolute inset-0 h-full w-full object-contain"
              /> : <div className="absolute inset-0 flex items-center justify-center bg-secondary text-primary"><FileText className="h-24 w-24" /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/45 via-transparent to-transparent" />
            </div>

            <div className="p-8 text-center md:p-12 lg:text-start">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-extrabold text-foreground md:text-4xl">
                {t('الملف التعريفي الرسمي', 'Official Company Profile')}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {t(
                  'تصفّح صفحات الملف التعريفي الرسمي، الذي يشمل نبذة الشركة وخدماتها ومشاريعها ووثائقها.',
                  'Browse the official company profile, covering the company, services, projects, and documents.',
                )}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:justify-start">
                <Button
                  size="lg"
                  className="h-13 gap-2 px-7 font-bold"
                  disabled={configLoading}
                  data-testid="button-browse-profile"
                  onClick={() => setShowViewer((current) => !current)}
                >
                  <Eye className="h-5 w-5" />
                  {showViewer
                    ? t('إغلاق المعاينة', 'Close Preview')
                    : t('تصفح داخل الصفحة', 'Browse on Page')}
                </Button>
                {!configFailed && !configLoading && <a href={PROFILE_URL} target="_blank" rel="noreferrer">
                  <Button size="lg" variant="outline" className="h-13 w-full gap-2 px-7 font-bold">
                    <ExternalLink className="h-5 w-5" />
                    {t('فتح في نافذة جديدة', 'Open in New Tab')}
                  </Button>
                </a>}
                {!configFailed && !configLoading && <a href={PROFILE_URL} download onClick={() => trackSiteActivity('profile_download')}>
                  <Button size="lg" variant="ghost" className="h-13 w-full gap-2 px-7 font-bold">
                    <Download className="h-5 w-5" />
                    {t('تحميل الملف', 'Download PDF')}
                  </Button>
                </a>}
              </div>
            </div>
          </div>

          {showViewer && (
            <div className="border-t border-border bg-muted/40 p-3 md:p-6">
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                {configFailed ? (
                  <ProfileError kind="config" config onRetry={() => void studio.refetch()} />
                ) : (
                  <Suspense fallback={<div className="h-[50vh] animate-pulse bg-muted" />}>
                    <ProfileViewer key={PROFILE_URL} url={PROFILE_URL} />
                  </Suspense>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mx-auto mt-6 max-w-6xl rounded-2xl border border-primary/20 bg-primary/5 px-6 py-4 text-center text-sm font-medium text-muted-foreground">
          {t(
            'حجم الملف كبير نسبيًا؛ قد تستغرق المعاينة عدة ثوانٍ حسب سرعة الاتصال.',
            'The profile is a large file; the preview may take a few seconds depending on your connection.',
          )}
        </div>
      </section>
    </div>
  );
}