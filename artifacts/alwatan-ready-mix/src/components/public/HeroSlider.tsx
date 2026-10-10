import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, ArrowUpRight } from 'lucide-react';
import type { StudioSlide } from '@workspace/api-client-react';
import { useLanguage } from '@/lib/i18n';
import { pick } from '@/lib/studio';
import SmartLink from './SmartLink';
import BrandEnergyLines from './BrandEnergyLines';

const INTERVAL = 6500;
const LEGACY_HERO: Record<string, string> = {
  '/media/slider-fleet-day.png': '/media/hero-ai-day-fleet.webp',
  '/media/slider-yard-mobile.png': '/media/hero-ai-day-fleet.webp',
  '/media/slider-project-night.png': '/media/hero-ai-night-project.webp',
  '/media/slider-plant-mobile.png': '/media/hero-ai-night-project.webp',
  '/media/slider-branch-night.png': '/media/hero-ai-riyadh-branch.webp',
  '/media/slider-fleet-night.png': '/media/hero-ai-night-plant.webp',
};
const heroSrc = (u: string) => LEGACY_HERO[u] ?? u;
const fmt = (n: number) => String(n).padStart(2, '0');

export default function HeroSlider({ slides }: { slides: StudioSlide[] }) {
  const { t, language, isRtl } = useLanguage();
  const reduce = !!useReducedMotion();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const barRef = useRef<HTMLSpanElement>(null);
  const count = slides.length;
  const auto = playing && !hovered && !reduce && count > 1;

  const go = useCallback((n: number, d?: number) => {
    setDir(d ?? (n >= index ? 1 : -1));
    setIndex(((n % count) + count) % count);
  }, [count, index]);
  const next = useCallback(() => go(index + 1, 1), [go, index]);
  const prev = useCallback(() => go(index - 1, -1), [go, index]);

  useEffect(() => { if (index >= count) setIndex(0); }, [count, index]);

  const nextRef = useRef(next);
  nextRef.current = next;
  useEffect(() => {
    if (barRef.current) barRef.current.style.transform = 'scaleX(0)';
    if (!auto) return;
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const tick = (now: number) => {
      if (!document.hidden) elapsed += now - last;
      last = now;
      const p = Math.min(elapsed / INTERVAL, 1);
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      if (p >= 1) { nextRef.current(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [auto, index]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const swipe = info.offset.x * (isRtl ? -1 : 1);
    if (swipe < -60) next();
    else if (swipe > 60) prev();
  };

  if (count === 0) return null;
  const s = slides[Math.min(index, count - 1)];
  const title = pick(language, s.titleAr, s.titleEn);
  const subtitle = pick(language, s.subtitleAr, s.subtitleEn);
  const button = pick(language, s.buttonAr, s.buttonEn);
  const sign = isRtl ? -1 : 1;
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <section
      className="relative w-full overflow-hidden bg-secondary text-white select-none"
      aria-roledescription="carousel"
      aria-label={t('شرائح العرض', 'Highlights')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(e) => { if (e.key === 'ArrowRight') (isRtl ? prev : next)(); if (e.key === 'ArrowLeft') (isRtl ? next : prev)(); }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary sm:aspect-video xl:max-h-[720px]">
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={s.id}
          className="absolute inset-0 touch-pan-y cursor-grab active:cursor-grabbing"
          custom={dir}
          initial={reduce ? false : { opacity: 0, x: 60 * dir * sign }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -60 * dir * sign }}
          transition={{ duration: reduce ? 0 : 0.9, ease }}
          drag={count > 1 && !reduce ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={onDragEnd}
        >
          <div className="absolute inset-0">
            <picture className="block h-full w-full">
              {s.mobileImageUrl && <source media="(max-width: 768px)" srcSet={heroSrc(s.mobileImageUrl)} />}
              <img src={heroSrc(s.imageUrl)} alt={title} draggable={false} className="block h-full w-full object-cover object-[40%_center] sm:object-center" fetchPriority={index === 0 ? 'high' : 'auto'} />
            </picture>
          </div>
        </motion.div>
      </AnimatePresence>
      </div>
      <BrandEnergyLines />

      <div className="relative z-10 border-t border-white/10 bg-secondary/80">
        <div className="container mx-auto px-6 py-7 md:py-8">
          <AnimatePresence mode="wait">
            <motion.div key={s.id} className="grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_auto]" initial={reduce ? false : 'hidden'} animate="show" exit="out"
              variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.12, delayChildren: 0.25 } }, out: { opacity: 0, transition: { duration: 0.2 } } }}>
              <div className="min-w-0">
              <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className="mb-3 flex items-center gap-3">
                <span className="h-[3px] w-12 bg-primary" />
                <span className="text-sm font-bold tracking-widest text-accent">{fmt(index + 1)} / {fmt(count)}</span>
              </motion.div>
              {title && (
                <motion.h2 variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} transition={{ duration: reduce ? 0 : 0.6, ease }} className="text-2xl font-black leading-snug md:text-3xl lg:text-4xl">
                  {title}
                </motion.h2>
              )}
              {subtitle && (
                <motion.p variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} transition={{ duration: reduce ? 0 : 0.5, ease }} className="mt-2 max-w-3xl text-sm font-medium leading-loose text-white/80 md:text-base">
                  {subtitle}
                </motion.p>
              )}
              </div>
              {button && s.href && (
                <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                  <SmartLink href={s.href} testId="link-slide-cta" className="group inline-flex min-h-12 items-center gap-3 rounded-md bg-primary px-6 py-3 text-base font-bold text-white shadow-xl shadow-black/20 transition hover:bg-primary/90">
                    {button}
                    <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                  </SmartLink>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 pb-5">
        <div className="container mx-auto flex items-center justify-between gap-4 px-6">
          <div className="flex flex-1 items-center gap-2 md:gap-3" role="tablist">
            {slides.map((sl, i) => (
              <button key={sl.id} type="button" role="tab" aria-selected={i === index} aria-label={`${t('الشريحة', 'Slide')} ${i + 1}`} onClick={() => go(i)}
                className="group relative h-8 flex-1 max-w-24 md:max-w-32" data-testid={`button-slide-dot-${i}`}>
                <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/25 group-hover:bg-white/40 transition-colors">
                  {i === index ? (
                    <span ref={barRef} className="absolute inset-0 origin-left rtl:origin-right bg-primary" style={{ transform: auto ? 'scaleX(0)' : 'scaleX(1)' }} />
                  ) : i < index ? <span className="absolute inset-0 bg-white/70" /> : null}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!reduce && count > 1 && (
              <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? t('إيقاف التشغيل التلقائي', 'Pause autoplay') : t('تشغيل تلقائي', 'Play autoplay')}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/25 backdrop-blur transition hover:bg-primary hover:border-primary" data-testid="button-slider-toggle">
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            )}
            {count > 1 && (
              <>
                <button type="button" onClick={prev} aria-label={t('السابق', 'Previous')} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/25 backdrop-blur transition hover:bg-primary hover:border-primary" data-testid="button-slider-prev"><PrevIcon className="h-5 w-5" /></button>
                <button type="button" onClick={next} aria-label={t('التالي', 'Next')} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/25 backdrop-blur transition hover:bg-primary hover:border-primary" data-testid="button-slider-next"><NextIcon className="h-5 w-5" /></button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 top-0 h-1 flow-line" />
    </section>
  );
}
