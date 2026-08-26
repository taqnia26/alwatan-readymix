import { useEffect, useState } from 'react';
import { Download, ExternalLink, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';

const PROFILE_URL = '/alwatan-company-profile.pdf';

export default function CompanyProfile() {
  const { t } = useLanguage();
  const [showViewer, setShowViewer] = useState(false);

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
              <img
                src="/company-profile-cover.png"
                alt={t('غلاف الملف التعريفي لشركة الوطن', 'AlWatan company profile cover')}
                className="absolute inset-0 h-full w-full object-cover"
              />
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
                  'نسخة متكاملة من 43 صفحة تشمل نبذة الشركة ورؤيتها وخدماتها ومشاريعها وعملاءها ووثائقها الرسمية.',
                  'A comprehensive 43-page profile covering the company, vision, services, projects, clients, and official documents.',
                )}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:justify-start">
                <Button
                  size="lg"
                  className="h-13 gap-2 px-7 font-bold"
                  onClick={() => setShowViewer((current) => !current)}
                >
                  <Eye className="h-5 w-5" />
                  {showViewer
                    ? t('إغلاق المعاينة', 'Close Preview')
                    : t('تصفح داخل الصفحة', 'Browse on Page')}
                </Button>
                <a href={PROFILE_URL} target="_blank" rel="noreferrer">
                  <Button size="lg" variant="outline" className="h-13 w-full gap-2 px-7 font-bold">
                    <ExternalLink className="h-5 w-5" />
                    {t('فتح في نافذة جديدة', 'Open in New Tab')}
                  </Button>
                </a>
                <a href={PROFILE_URL} download>
                  <Button size="lg" variant="ghost" className="h-13 w-full gap-2 px-7 font-bold">
                    <Download className="h-5 w-5" />
                    {t('تحميل الملف', 'Download PDF')}
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {showViewer && (
            <div className="border-t border-border bg-muted/40 p-3 md:p-6">
              <iframe
                src={`${PROFILE_URL}#view=FitH`}
                title={t('عارض الملف التعريفي لشركة الوطن', 'AlWatan company profile viewer')}
                className="h-[72vh] min-h-[620px] w-full rounded-2xl border border-border bg-white"
              />
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