import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, HardHat, Building2, Droplets, MapPin, Phone, Clock, Award, FileText } from 'lucide-react';
import { Link } from 'wouter';
import type { HomePayload, StudioHomeSection, StudioVideo, PageContent } from '@workspace/api-client-react';
import { useLanguage } from '@/lib/i18n';
import { pick } from '@/lib/studio';
import Reveal from './Reveal';
import RichText from './RichText';
import SmartLink from './SmartLink';
import qualityImg from '@assets/Generated_Image_July_29,_2026_-_4_33AM_1787598707000.png';

type Ctx = { home: HomePayload | undefined; videos: StudioVideo[] };

function Heading({ n, eyebrow, title, body, light }: { n: number; eyebrow: string; title: string; body?: string; light?: boolean }) {
  return (
    <div className="mb-12 max-w-3xl">
      <Reveal>
        <div className="mb-4 flex items-center gap-3">
          <span className="text-5xl font-black leading-none text-primary/25 tabular-nums">{String(n).padStart(2, '0')}</span>
          <span className="h-px w-10 bg-primary" />
          <span className="text-sm font-bold text-primary">{eyebrow}</span>
        </div>
        <h2 className={`text-3xl font-black leading-tight md:text-5xl ${light ? 'text-white' : 'text-secondary'}`}>{title}</h2>
        {body && <RichText value={body} className={`mt-4 text-lg ${light ? 'text-white/70' : 'text-muted-foreground'}`} />}
      </Reveal>
    </div>
  );
}

function cms(content: PageContent[] | undefined, section: string, field: string, isAr: boolean) {
  const i = content?.find((c) => c.sectionKey === section && c.fieldKey === field);
  return i ? (isAr ? i.valueAr : i.valueEn) : '';
}

function Intro({ s, ctx }: { s: StudioHomeSection; ctx: Ctx }) {
  const { t, language, isRtl } = useLanguage();
  const reduce = useReducedMotion();
  const c = ctx.home?.content;
  const title = pick(language, s.titleAr, s.titleEn) || cms(c, 'intro', 'title', isRtl) || t('أساسات قوية لمستقبل مستدام', 'Strong Foundations for a Sustainable Future');
  const body = pick(language, s.bodyAr, s.bodyEn) || cms(c, 'intro', 'subtitle', isRtl) || t('الوطن للخرسانة الجاهزة. شريكك الموثوق في توريد الخرسانة عالية الأداء للمشاريع الضخمة والبنية التحتية في المملكة.', 'AlWatan Ready-Mix. Your trusted partner for high-performance concrete supply for mega projects and infrastructure in the Kingdom.');
  const feats = [
    { icon: HardHat, k: 'feature_1', t: t('خبرة هندسية', 'Engineering Expertise'), d: t('فريق متكامل من المهندسين والفنيين ذوي الخبرة العالية في تصميم الخلطات الخرسانية المطابقة لأدق المواصفات.', 'A complete team of engineers and technicians experienced in designing concrete mixes to exact specifications.') },
    { icon: Building2, k: 'feature_2', t: t('مشاريع عملاقة', 'Mega Projects'), d: t('سجل حافل بالموثوقية في توريد الخرسانة لمشاريع البنية التحتية والمشاريع التنموية.', 'A proven record of reliability supplying concrete to infrastructure and developmental projects.') },
    { icon: Droplets, k: 'feature_3', t: t('جودة عالية', 'High Quality'), d: t('مواد خام مختارة واختبارات معملية مستمرة لضمان أعلى درجات المقاومة والتحمل.', 'Carefully selected raw materials and continuous lab testing for the highest strength and durability.') },
  ].map((f) => ({ ...f, t: cms(c, f.k, 'title', isRtl) || f.t, d: cms(c, f.k, 'description', isRtl) || f.d }));
  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-28">
      <div className="container mx-auto px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <Reveal>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" /><span className="relative h-2 w-2 rounded-full bg-primary" /></span>
                {t('الجودة في كل قطرة', 'Quality in every drop')}
              </div>
              <h1 className="text-4xl font-black leading-[1.3] text-secondary md:text-6xl">{title}</h1>
              <RichText value={body} className="mt-6 text-lg font-medium text-muted-foreground md:text-xl" />
              <div className="mt-9 flex flex-wrap gap-3">
                <SmartLink href={s.href || '/quote'} className="inline-flex h-14 items-center gap-2 rounded-md bg-primary px-8 text-lg font-bold text-white shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:shadow-xl">{t('اطلب تسعيرة الآن', 'Request a Quote Now')}<ArrowUpRight className="h-5 w-5 rtl:-scale-x-100" /></SmartLink>
                <Link href="/about" className="inline-flex h-14 items-center rounded-md border-2 border-secondary/15 px-8 text-lg font-bold text-secondary transition hover:border-primary hover:text-primary">{t('تعرف علينا', 'Discover Us')}</Link>
              </div>
            </Reveal>
          </div>
          <Reveal x={isRtl ? -40 : 40} delay={0.1}>
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-primary/10 rtl:-rotate-2 rotate-2" />
              <motion.div whileHover={reduce ? undefined : { rotate: 0.6, scale: 1.01 }} className="relative aspect-[4/3] overflow-hidden rounded-2xl border-8 border-card shadow-2xl">
                <img src={s.imageUrl || qualityImg} alt={title} className="h-full w-full object-cover" />
              </motion.div>
            </div>
          </Reveal>
        </div>
        <div className="mt-20 grid gap-5 md:grid-cols-3">
          {feats.map((f, i) => (
            <Reveal key={f.k} delay={i * 0.1}>
              <motion.div whileHover={reduce ? undefined : { y: -6 }} className="group h-full rounded-2xl border bg-card p-8 shadow-sm transition-shadow hover:shadow-xl">
                <motion.div whileHover={reduce ? undefined : { rotate: [0, -8, 8, 0] }} transition={{ duration: 0.6 }} className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <f.icon className="h-7 w-7" />
                </motion.div>
                <h3 className="mb-3 text-xl font-extrabold text-secondary">{f.t}</h3>
                <RichText value={f.d} className="text-muted-foreground" />
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Products({ s, ctx, n }: { s: StudioHomeSection; ctx: Ctx; n: number }) {
  const { t, language, isRtl } = useLanguage();
  const items = ctx.home?.products?.slice(0, 3) ?? [];
  return (
    <section className="border-t-[10px] border-primary bg-secondary py-20 text-white md:py-28">
      <div className="container mx-auto px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Heading n={n} light eyebrow={t('منتجاتنا', 'Our Products')} title={pick(language, s.titleAr, s.titleEn) || cms(ctx.home?.content, 'products_section', 'title', isRtl) || t('تشكيلة واسعة من الخرسانة الجاهزة', 'A Wide Range of Ready-Mix Concrete')} body={pick(language, s.bodyAr, s.bodyEn)} />
          <Reveal><Link href={s.href || '/products'} className="mb-12 inline-flex h-12 items-center rounded-md border border-white/25 px-6 font-bold hover:bg-white hover:text-secondary transition-colors">{t('عرض كل المنتجات', 'View All Products')}</Link></Reveal>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.1}>
              <Link href={`/products/${p.slug}`} className="group block h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-primary/60 hover:-translate-y-1">
                <div className="relative h-60 overflow-hidden bg-black/40">
                  <img src={p.imageUrl || qualityImg} alt={pick(language, p.nameAr, p.nameEn)} loading="lazy" className="h-full w-full object-cover opacity-85 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />
                  {p.compressiveStrength && <span className="absolute bottom-3 start-3 rounded bg-accent px-3 py-1 text-sm font-black text-secondary" dir="ltr">{p.compressiveStrength}</span>}
                </div>
                <div className="p-7">
                  <h3 className="mb-3 text-xl font-extrabold">{pick(language, p.nameAr, p.nameEn)}</h3>
                  <p className="mb-6 line-clamp-3 leading-loose text-white/65">{pick(language, p.descriptionAr, p.descriptionEn)}</p>
                  <span className="inline-flex items-center gap-1 font-bold text-primary">{t('اكتشف المزيد', 'Learn More')}<ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100" /></span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Videos({ s, ctx, n }: { s: StudioHomeSection; ctx: Ctx; n: number }) {
  const { t, language, isRtl } = useLanguage();
  const vids = ctx.videos.filter((v) => v.enabled);
  if (!vids.length) return null;
  return (
    <section className="bg-card py-20 md:py-28">
      <div className="container mx-auto px-6">
        <Heading n={n} eyebrow={t('هويتنا وقدراتنا', 'Our Identity and Capabilities')} title={pick(language, s.titleAr, s.titleEn) || cms(ctx.home?.content, 'media', 'title', isRtl) || t('القوة والموثوقية في كل تفصيل', 'Strength and Reliability in Every Detail')} body={pick(language, s.bodyAr, s.bodyEn) || cms(ctx.home?.content, 'media', 'description', isRtl)} />
        <div className="grid gap-8 lg:grid-cols-2">
          {vids.map((v, i) => (
            <Reveal key={v.id} delay={i * 0.1}>
              <div className="overflow-hidden rounded-2xl border bg-secondary shadow-xl">
                <video controls playsInline preload="metadata" poster={v.poster || undefined} className="aspect-video w-full bg-black object-cover" src={v.src} />
                <div className="bg-card p-7">
                  <h3 className="mb-2 text-xl font-extrabold text-secondary">{pick(language, v.titleAr, v.titleEn)}</h3>
                  <p className="leading-loose text-muted-foreground">{pick(language, v.descriptionAr, v.descriptionEn)}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Branches({ s, ctx, n }: { s: StudioHomeSection; ctx: Ctx; n: number }) {
  const { t, language } = useLanguage();
  const items = ctx.home?.branches ?? [];
  if (!items.length) return null;
  return (
    <section className="bg-muted/40 py-20 md:py-28">
      <div className="container mx-auto px-6">
        <Heading n={n} eyebrow={t('الفروع', 'Branches')} title={pick(language, s.titleAr, s.titleEn) || t('قريبون من مشروعك', 'Close to your project')} body={pick(language, s.bodyAr, s.bodyEn)} />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((b, i) => (
            <Reveal key={b.id} delay={i * 0.07}>
              <Link href={s.href || '/branches'} className="group block h-full rounded-2xl border bg-card p-7 transition hover:-translate-y-1 hover:border-primary hover:shadow-lg">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white"><MapPin className="h-5 w-5" /></div>
                <h3 className="text-lg font-extrabold text-secondary">{pick(language, b.nameAr, b.nameEn)}</h3>
                <p className="mt-1 text-muted-foreground">{pick(language, b.addressAr, b.addressEn)}</p>
                <div className="mt-4 space-y-1.5 text-sm font-semibold text-secondary/80">
                  {b.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><span dir="ltr">{b.phone}</span></div>}
                  {b.workingHours && <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />{b.workingHours}</div>}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Certificates({ s, ctx, n }: { s: StudioHomeSection; ctx: Ctx; n: number }) {
  const { t, language } = useLanguage();
  const items = ctx.home?.certificates ?? [];
  if (!items.length) return null;
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="container mx-auto px-6">
        <Heading n={n} eyebrow={t('الاعتمادات', 'Certificates')} title={pick(language, s.titleAr, s.titleEn) || t('جودة موثقة', 'Documented quality')} body={pick(language, s.bodyAr, s.bodyEn)} />
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {items.slice(0, 4).map((c, i) => (
            <Reveal key={c.id} delay={i * 0.08}>
              <Link href={s.href || '/certificates'} className="group block overflow-hidden rounded-xl border bg-card transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-44 items-center justify-center bg-muted/60 p-3">
                  {c.imageUrl ? <img src={c.imageUrl} alt={pick(language, c.titleAr, c.titleEn)} loading="lazy" className="max-h-full object-contain" /> : <Award className="h-12 w-12 text-primary/50" />}
                </div>
                <div className="p-4 text-sm font-bold text-secondary">{pick(language, c.titleAr, c.titleEn)}</div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Blog({ s, ctx, n }: { s: StudioHomeSection; ctx: Ctx; n: number }) {
  const { t, language } = useLanguage();
  const items = ctx.home?.blogPosts ?? [];
  if (!items.length) return null;
  return (
    <section className="bg-card py-20 md:py-28">
      <div className="container mx-auto px-6">
        <Heading n={n} eyebrow={t('المركز الإعلامي', 'Media Center')} title={pick(language, s.titleAr, s.titleEn) || t('أخبار ومعرفة', 'News and knowledge')} body={pick(language, s.bodyAr, s.bodyEn)} />
        <div className="grid gap-6 md:grid-cols-3">
          {items.slice(0, 3).map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <Link href={`/blog/${p.slug}`} className="group block h-full overflow-hidden rounded-2xl border bg-background transition hover:-translate-y-1 hover:shadow-lg">
                <div className="h-48 overflow-hidden bg-muted">{p.coverImage && <img src={p.coverImage} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />}</div>
                <div className="p-6"><h3 className="font-extrabold text-secondary">{pick(language, p.titleAr, p.titleEn)}</h3><p className="mt-2 line-clamp-2 text-muted-foreground">{pick(language, p.excerptAr, p.excerptEn)}</p></div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta({ s, ctx }: { s: StudioHomeSection; ctx: Ctx }) {
  const { t, language, isRtl } = useLanguage();
  const title = pick(language, s.titleAr, s.titleEn) || cms(ctx.home?.content, 'cta', 'title', isRtl) || t('هل لديك مشروع قادم؟', 'Do you have an upcoming project?');
  const body = pick(language, s.bodyAr, s.bodyEn) || cms(ctx.home?.content, 'cta', 'description', isRtl) || t('فريقنا الهندسي والتجاري مستعد لتقديم الاستشارة والتسعيرة المناسبة لمشروعك.', 'Our engineering and commercial team is ready to provide consultation and pricing for your project.');
  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-white md:py-24">
            <div className="absolute inset-0 grid-blueprint" />
            <div className="absolute -top-24 -end-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <div className="relative mx-auto max-w-3xl">
              <h2 className="text-4xl font-black md:text-6xl">{title}</h2>
              <RichText value={body} className="mt-6 text-xl text-white/90" />
              <SmartLink href={s.href || '/quote'} className="mt-10 inline-flex h-16 items-center gap-2 rounded-md bg-white px-12 text-xl font-bold text-secondary shadow-xl transition hover:scale-105">{t('اطلب تسعيرة الآن', 'Request a Quote Now')}</SmartLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Custom({ s }: { s: StudioHomeSection }) {
  const { language, t } = useLanguage();
  const title = pick(language, s.titleAr, s.titleEn);
  const body = pick(language, s.bodyAr, s.bodyEn);
  return (
    <section className="bg-muted/30 py-20">
      <div className="container mx-auto px-6">
        <div className={`grid items-center gap-10 ${s.imageUrl ? 'lg:grid-cols-2' : ''}`}>
          <Reveal>
            {title && <h2 className="mb-5 text-3xl font-black text-secondary md:text-5xl">{title}</h2>}
            <RichText value={body} className="text-lg text-muted-foreground" />
            {s.href && <SmartLink href={s.href} className="mt-6 inline-flex items-center gap-2 font-bold text-primary hover:underline"><FileText className="h-4 w-4" />{t('اعرف المزيد', 'Learn more')}</SmartLink>}
          </Reveal>
          {s.imageUrl && <Reveal delay={0.1}><img src={s.imageUrl} alt={title} loading="lazy" className="w-full rounded-2xl border shadow-xl" /></Reveal>}
        </div>
      </div>
    </section>
  );
}

export default function HomeSections({ sections, home, videos }: { sections: StudioHomeSection[]; home: HomePayload | undefined; videos: StudioVideo[] }) {
  const ctx: Ctx = { home, videos };
  let n = 0;
  return (
    <>
      {sections.filter((s) => s.visible).map((s) => {
        n += 1;
        switch (s.key) {
          case 'intro': return <Intro key={s.id} s={s} ctx={ctx} />;
          case 'products': return <Products key={s.id} s={s} ctx={ctx} n={n} />;
          case 'videos': return <Videos key={s.id} s={s} ctx={ctx} n={n} />;
          case 'branches': return <Branches key={s.id} s={s} ctx={ctx} n={n} />;
          case 'certificates': return <Certificates key={s.id} s={s} ctx={ctx} n={n} />;
          case 'blog': return <Blog key={s.id} s={s} ctx={ctx} n={n} />;
          case 'cta': return <Cta key={s.id} s={s} ctx={ctx} />;
          case 'custom': return <Custom key={s.id} s={s} />;
          default: return null;
        }
      })}
    </>
  );
}
