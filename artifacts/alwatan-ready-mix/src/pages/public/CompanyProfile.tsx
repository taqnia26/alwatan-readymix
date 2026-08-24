import { useEffect } from 'react';
import { Link } from 'wouter';
import { FileText, Clock3, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';

export default function CompanyProfile() {
  const { t, isRtl } = useLanguage();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

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
              'سيكون الملف التعريفي المعتمد للشركة متاحًا للتصفح والتحميل من هذه الصفحة قريبًا.',
              'The approved company profile will soon be available to browse and download from this page.',
            )}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-8 text-center shadow-xl md:p-14">
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Clock3 className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground">
            {t('الملف قيد التجهيز', 'Profile Coming Soon')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t(
              'نعمل على تجهيز النسخة الرسمية. في الوقت الحالي يمكنك التعرف على منتجاتنا واعتماداتنا أو التواصل مع فريقنا مباشرة.',
              'We are preparing the official edition. In the meantime, explore our products and certifications or contact our team directly.',
            )}
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/about">
              <Button size="lg" className="h-13 gap-2 px-7 font-bold">
                {t('تعرف على الشركة', 'About the Company')}
                <ArrowIcon className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-13 px-7 font-bold">
                {t('تواصل معنا', 'Contact Us')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}