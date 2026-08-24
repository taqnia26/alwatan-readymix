import { useLanguage } from '@/lib/i18n';
import { useGetHome } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowRight, ArrowLeft, ChevronRight, ChevronLeft, HardHat, Building2, Droplets } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import qualityImg from '@assets/Generated_Image_July_29,_2026_-_4_33AM_1787598707000.png';

const DESKTOP_SLIDES = [
  '/media/slider-fleet-day.png',
  '/media/slider-project-night.png',
  '/media/slider-branch-night.png',
  '/media/slider-fleet-night.png',
];

const MOBILE_SLIDES = [
  '/media/slider-yard-mobile.png',
  '/media/slider-plant-mobile.png',
  '/media/slider-project-night.png', // fallback
  '/media/slider-fleet-night.png',   // fallback
];

function HeroSlider({ isRtl }: { isRtl: boolean }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, direction: isRtl ? 'rtl' : 'ltr' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <div className="relative w-full h-[75vh] md:h-[85vh] overflow-hidden bg-secondary" ref={emblaRef}>
      <div className="flex h-full touch-pan-y">
        {DESKTOP_SLIDES.map((src, idx) => (
          <div key={idx} className="relative flex-[0_0_100%] min-w-0 h-full">
            <picture>
              <source media="(max-width: 768px)" srcSet={MOBILE_SLIDES[idx]} />
              <img 
                src={src} 
                alt={`AlWatan Ready-Mix Slide ${idx + 1}`} 
                className="w-full h-full object-cover object-center"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent opacity-60 pointer-events-none" />
          </div>
        ))}
      </div>
      
      {/* Controls */}
      <div className="absolute inset-x-0 bottom-8 flex justify-center items-center gap-6 z-10">
        <button onClick={scrollPrev} className="p-3 rounded-full bg-black/20 text-white hover:bg-black/50 transition-colors backdrop-blur-md border border-white/10" aria-label="Previous Slide">
          {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
        <div className="flex gap-3">
          {DESKTOP_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => emblaApi?.scrollTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${idx === selectedIndex ? 'w-10 bg-primary' : 'w-4 bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
        <button onClick={scrollNext} className="p-3 rounded-full bg-black/20 text-white hover:bg-black/50 transition-colors backdrop-blur-md border border-white/10" aria-label="Next Slide">
          {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

function IntroSection() {
  const { t, isRtl } = useLanguage();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section className="py-20 md:py-32 bg-background border-b border-border">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-16">
          <div className="flex-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-bold text-sm tracking-wider uppercase">{t('الجودة في كل قطرة', 'Quality in every drop')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-8">
              {t('أساسات قوية لمستقبل مستدام', 'Strong Foundations for a Sustainable Future')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 font-medium">
              {t(
                'الوطن للخرسانة الجاهزة. شريكك الموثوق في توريد الخرسانة عالية الأداء للمشاريع الضخمة والبنية التحتية في المملكة.',
                'AlWatan Ready-Mix. Your trusted partner for high-performance concrete supply for mega projects and infrastructure in the Kingdom.'
              )}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/quote">
                <Button size="lg" className="h-14 px-8 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                  {t('اطلب تسعيرة الآن', 'Request a Quote Now')}
                  <ArrowIcon className={`w-5 h-5 ${isRtl ? 'mr-2' : 'ml-2'}`} />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold bg-transparent">
                  {t('تعرف علينا', 'Discover Us')}
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full flex justify-end">
             <div className="relative w-full max-w-lg aspect-[4/3] rounded-3xl overflow-hidden border-8 border-card shadow-2xl">
               <img src={qualityImg} alt="Quality Concrete" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MediaSection() {
  const { t } = useLanguage();
  return (
    <section className="py-24 bg-card">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-4">
            {t('هويتنا وقدراتنا', 'Our Identity and Capabilities')}
          </h2>
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-6">
            {t('القوة والموثوقية في كل تفصيل', 'Strength and Reliability in Every Detail')}
          </h3>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t('تعرف على شركة مصنع الوطن للخرسانة الجاهزة من خلال هذه المقاطع التي تعكس التزامنا بالجودة وقدرتنا على تنفيذ أضخم المشاريع.', 'Discover AlWatan Ready-Mix Concrete Co. through these clips that reflect our commitment to quality and our capability to execute the largest projects.')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <div className="group rounded-3xl overflow-hidden shadow-xl bg-secondary border border-border flex flex-col">
            <div className="relative aspect-video bg-black">
              <video 
                controls 
                playsInline
                className="w-full h-full object-cover"
                poster="/media/slider-project-night.png"
                preload="metadata"
              >
                <source src="/media/company-voice.webm" type="video/webm" />
                <source src="/media/company-voice.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="p-8 bg-card flex-1 border-t border-border">
              <h4 className="text-2xl font-bold text-foreground mb-3">
                {t('صوت الوطن', 'Voice of AlWatan')}
              </h4>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {t('رسالة الشركة وأهدافها المستقبلية في بناء أساسات متينة تدعم رؤية المملكة التنموية الطموحة.', 'Our mission and future goals in building solid foundations that support the Kingdom\'s ambitious developmental vision.')}
              </p>
            </div>
          </div>
          
          <div className="group rounded-3xl overflow-hidden shadow-xl bg-secondary border border-border flex flex-col">
            <div className="relative aspect-video bg-black">
              <video 
                controls 
                playsInline
                className="w-full h-full object-cover"
                poster="/media/slider-branch-night.png"
                preload="metadata"
              >
                <source src="/media/company-music.webm" type="video/webm" />
                <source src="/media/company-music.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="p-8 bg-card flex-1 border-t border-border">
              <h4 className="text-2xl font-bold text-foreground mb-3">
                {t('قدراتنا الصناعية', 'Our Industrial Capabilities')}
              </h4>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {t('نظرة على أسطولنا الضخم ومصانعنا المتطورة التي تضمن إمداد المشاريع الكبرى بالخرسانة دون انقطاع.', 'A look at our massive fleet and advanced plants that ensure uninterrupted concrete supply to major projects.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { t, isRtl, language } = useLanguage();
  const { data: homeData, isLoading } = useGetHome();

  if (isLoading) {
    return (
      <div className="w-full min-h-screen p-8 flex flex-col gap-8">
        <Skeleton className="w-full h-[75vh] rounded-none" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 container mx-auto mt-12">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <HeroSlider isRtl={isRtl} />
      <IntroSection />
      
      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-primary font-bold tracking-widest uppercase mb-4 text-sm">
              {t('لماذا تختارنا', 'Why Choose Us')}
            </h2>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground">
              {t('معايير لا تقبل المساومة', 'Uncompromising Standards')}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: HardHat,
                title: t('خبرة هندسية', 'Engineering Expertise'),
                desc: t('فريق متكامل من المهندسين والفنيين ذوي الخبرة العالية في تصميم الخلطات الخرسانية المطابقة لأدق المواصفات.', 'A complete team of engineers and technicians highly experienced in designing concrete mixes that meet exact specifications.')
              },
              {
                icon: Building2,
                title: t('مشاريع عملاقة', 'Mega Projects'),
                desc: t('سجل حافل بالنجاحات والموثوقية في توريد الخرسانة لأكبر المشاريع التنموية ومشاريع البنية التحتية.', 'A proven track record of success and reliability in supplying concrete to the largest developmental and infrastructure projects.')
              },
              {
                icon: Droplets,
                title: t('جودة عالية', 'High Quality'),
                desc: t('مواد خام مختارة بعناية واختبارات معملية دقيقة ومستمرة لضمان أعلى درجات المقاومة والتحمل.', 'Carefully selected raw materials and precise, continuous laboratory testing to ensure the highest degrees of resistance and durability.')
              }
            ].map((feat, idx) => (
              <div key={idx} className="bg-card p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-border group hover:-translate-y-1">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <feat.icon className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-foreground mb-4">{feat.title}</h4>
                <p className="text-muted-foreground text-lg leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MediaSection />

      {/* Products Highlight */}
      <section className="py-24 bg-secondary text-secondary-foreground border-t-[12px] border-primary">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 border-b border-white/10 pb-8">
            <div className="max-w-2xl">
              <h2 className="text-primary font-bold tracking-widest uppercase mb-4 text-sm">
                {t('منتجاتنا', 'Our Products')}
              </h2>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
                {t('تشكيلة واسعة من الخرسانة الجاهزة', 'A Wide Range of Ready-Mix Concrete')}
              </h3>
            </div>
            <Link href="/products">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-secondary h-14 px-8 font-bold transition-colors text-lg">
                {t('عرض كل المنتجات', 'View All Products')}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {homeData?.products?.slice(0, 3).map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`}>
                <div className="bg-white/5 rounded-3xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1 flex flex-col h-full">
                  <div className="h-64 overflow-hidden bg-black/40 relative">
                    <img 
                      src={product.imageUrl || qualityImg} 
                      alt={language === 'ar' ? product.nameAr : product.nameEn}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <h4 className="text-2xl font-bold text-white mb-4">
                      {language === 'ar' ? product.nameAr : product.nameEn}
                    </h4>
                    <p className="text-gray-400 text-lg mb-8 line-clamp-3 leading-relaxed flex-1">
                      {language === 'ar' ? product.descriptionAr : product.descriptionEn}
                    </p>
                    <div className="flex items-center text-primary font-bold group-hover:translate-x-2 transition-transform text-lg">
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
      <section className="py-24 bg-background border-t border-border">
        <div className="container mx-auto px-6">
          <div className="bg-primary rounded-[2.5rem] p-12 md:p-20 text-center text-primary-foreground shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-black/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 relative z-10">
              {t('هل لديك مشروع قادم؟', 'Do you have an upcoming project?')}
            </h2>
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-primary-foreground/90 relative z-10 font-medium leading-relaxed">
              {t(
                'دعنا نساعدك في بناء أساس قوي. فريقنا الهندسي والتجاري مستعد لتقديم الاستشارة والتسعيرة المناسبة لمشروعك بأعلى معايير الجودة.',
                'Let us help you build a strong foundation. Our engineering and commercial team is ready to provide consultation and appropriate pricing for your project with the highest quality standards.'
              )}
            </p>
            <Link href="/quote">
              <Button size="lg" variant="secondary" className="h-16 px-12 text-xl font-bold bg-white text-secondary hover:bg-gray-50 shadow-xl relative z-10 transition-transform hover:scale-105">
                {t('اطلب تسعيرة الآن', 'Request a Quote Now')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
