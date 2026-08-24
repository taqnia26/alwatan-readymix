import { useLanguage } from '@/lib/i18n';
import { useGetHome } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowRight, ArrowLeft, CheckCircle2, ChevronRight, HardHat, Building2, Droplets } from 'lucide-react';
import heroImg from '@assets/Generated_Image_July_29,_2026_-_4_38AM_1787598707000.png';
import qualityImg from '@assets/Generated_Image_July_29,_2026_-_4_33AM_1787598707000.png';

export default function Home() {
  const { t, isRtl, language } = useLanguage();
  const { data: homeData, isLoading } = useGetHome();

  if (isLoading) {
    return (
      <div className="w-full min-h-screen p-8 flex flex-col gap-8">
        <Skeleton className="w-full h-[60vh] rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 container mx-auto">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImg} 
            alt="Construction Site" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-secondary/80 mix-blend-multiply"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10 text-white">
          <div className="max-w-3xl animate-in slide-in-from-bottom-8 duration-700 fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary-foreground border border-primary/30 mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-medium text-sm tracking-wider uppercase">{t('الجودة في كل قطرة', 'Quality in every drop')}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              {t('أساسات قوية لمستقبل مستدام', 'Strong Foundations for a Sustainable Future')}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-10 font-medium leading-relaxed max-w-2xl">
              {t(
                'الوطن للخرسانة الجاهزة. شريكك الموثوق في توريد الخرسانة عالية الأداء للمشاريع الضخمة والبنية التحتية في المملكة.',
                'AlWatan Ready-Mix. Your trusted partner for high-performance concrete supply for mega projects and infrastructure in the Kingdom.'
              )}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/quote">
                <Button size="lg" className="text-lg px-8 h-14 bg-primary hover:bg-primary/90 text-primary-foreground">
                  {t('اطلب تسعيرة الآن', 'Request a Quote Now')}
                  <ArrowIcon className={`w-5 h-5 ${isRtl ? 'mr-2' : 'ml-2'}`} />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white">
                  {t('تعرف علينا', 'Discover Us')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-primary font-bold tracking-wider uppercase mb-3 text-sm">
              {t('لماذا تختارنا', 'Why Choose Us')}
            </h2>
            <h3 className="text-4xl font-extrabold text-secondary">
              {t('معايير لا تقبل المساومة', 'Uncompromising Standards')}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                icon: HardHat,
                title: t('خبرة هندسية', 'Engineering Expertise'),
                desc: t('فريق متكامل من المهندسين والفنيين ذوي الخبرة العالية في تصميم الخلطات الخرسانية.', 'A complete team of engineers and technicians highly experienced in concrete mix design.')
              },
              {
                icon: Building2,
                title: t('مشاريع عملاقة', 'Mega Projects'),
                desc: t('سجل حافل بالنجاحات في توريد الخرسانة لأكبر المشاريع التنموية في الرياض.', 'A proven track record of success in supplying concrete to the largest developmental projects in Riyadh.')
              },
              {
                icon: Droplets,
                title: t('جودة عالية', 'High Quality'),
                desc: t('مواد خام مختارة بعناية واختبارات معملية دقيقة لضمان أعلى درجات المقاومة والتحمل.', 'Carefully selected raw materials and precise laboratory testing to ensure the highest degrees of resistance and durability.')
              }
            ].map((feat, idx) => (
              <div key={idx} className="bg-muted p-10 rounded-2xl hover:shadow-xl transition-all duration-300 border border-border group hover:-translate-y-2">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <feat.icon className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-secondary mb-4">{feat.title}</h4>
                <p className="text-muted-foreground font-medium leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Highlight */}
      <section className="py-24 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-primary font-bold tracking-wider uppercase mb-3 text-sm">
                {t('منتجاتنا', 'Our Products')}
              </h2>
              <h3 className="text-4xl font-extrabold text-white">
                {t('تشكيلة واسعة من الخرسانة الجاهزة', 'A Wide Range of Ready-Mix Concrete')}
              </h3>
            </div>
            <Link href="/products">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white h-12 px-6">
                {t('عرض كل المنتجات', 'View All Products')}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {homeData?.products?.slice(0, 3).map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`}>
                <div className="bg-secondary-foreground/5 rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-colors group">
                  <div className="h-48 overflow-hidden bg-black/20">
                    <img 
                      src={product.imageUrl || qualityImg} 
                      alt={language === 'ar' ? product.nameAr : product.nameEn}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                  </div>
                  <div className="p-8">
                    <h4 className="text-2xl font-bold text-white mb-2">
                      {language === 'ar' ? product.nameAr : product.nameEn}
                    </h4>
                    <p className="text-gray-400 font-medium mb-6 line-clamp-2">
                      {language === 'ar' ? product.descriptionAr : product.descriptionEn}
                    </p>
                    <div className="flex items-center text-primary font-bold group-hover:translate-x-2 transition-transform">
                      {t('اكتشف المزيد', 'Learn More')}
                      <ChevronRight className={`w-5 h-5 ${isRtl ? 'rotate-180 mr-1' : 'ml-1'}`} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-card">
        <div className="container mx-auto px-6 relative z-10">
          <div className="bg-primary rounded-3xl p-12 md:p-16 text-center text-primary-foreground shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
            
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 relative z-10">
              {t('هل لديك مشروع قادم؟', 'Do you have an upcoming project?')}
            </h2>
            <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto opacity-90 relative z-10 font-medium">
              {t(
                'دعنا نساعدك في بناء أساس قوي. فريقنا مستعد لتقديم الاستشارة والتسعيرة المناسبة لمشروعك.',
                'Let us help you build a strong foundation. Our team is ready to provide consultation and appropriate pricing for your project.'
              )}
            </p>
            <Link href="/quote">
              <Button size="lg" variant="secondary" className="text-lg px-10 h-16 text-secondary bg-white hover:bg-gray-100 font-bold relative z-10 shadow-xl">
                {t('اطلب تسعيرة', 'Request a Quote')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
