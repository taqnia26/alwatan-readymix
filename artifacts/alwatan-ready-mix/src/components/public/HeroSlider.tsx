import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, ArrowUpRight } from 'lucide-react';
import type { StudioSlide } from '@workspace/api-client-react';
import { useLanguage } from '@/lib/i18n';
import { pick } from '@/lib/studio';
import SmartLink from './SmartLink';

const INTERVAL = 6500;
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
      className="relative h-[78dvh] min-h-[480px] md:h-[88dvh] w-full overflow-hidden bg-secondary text-white select-none"
      aria-roledescription="carousel"
      aria-label={t('شرائح العرض', 'Highlights')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(e) => { if (e.key === 'ArrowRight') (isRtl ? prev : next)(); if (e.key === 'ArrowLeft') (isRtl ? next : prev)(); }}
    >
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
          <motion.div
            className="absolute inset-0"
            initial={reduce ? false : { scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: reduce ? 0 : 9, ease: 'easeOut' }}
          >
            <picture>
              {s.mobileImageUrl && <source media="(max-width: 768px)" srcSet={s.mobileImageUrl} />}
              <img src={s.imageUrl} alt={title} draggable={false} className="h-full w-full object-cover" fetchPriority={index === 0 ? 'high' : 'auto'} />
            </picture>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-secondary via-secondary/40 to-secondary/10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r rtl:bg-gradient-to-l from-secondary/80 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 grid-blueprint opacity-60" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 pb-28 md:pb-32">
        <div className="container mx-auto px-6">
          <AnimatePresence mode="wait">
            <motion.div key={s.id} className="max-w-3xl" initial="hidden" animate="show" exit="out"
              variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.12, delayChildren: 0.25 } }, out: { opacity: 0, transition: { duration: 0.2 } } }}>
              <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className="mb-5 flex items-center gap-3">
                <span className="h-[3px] w-12 bg-primary" />
                <span className="text-sm font-bold tracking-widest text-accent">{fmt(index + 1)} / {fmt(count)}</span>
              </motion.div>
              {title && (
                <motion.h2 variants={{ hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.8, ease }} className="text-4xl font-black leading-[1.25] md:text-6xl lg:text-7xl">
                  {title}
                </motion.h2>
              )}
              {subtitle && (
                <motion.p variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.7, ease }} className="mt-5 max-w-xl text-base font-medium leading-loose text-white/85 md:text-xl">
                  {subtitle}
                </motion.p>
              )}
              {button && s.href && (
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="pointer-events-auto mt-8">
                  <SmartLink href={s.href} testId="link-slide-cta" className="group inline-flex h-14 items-center gap-3 bg-primary px-8 text-lg font-bold text-white shadow-xl shadow-black/30 transition hover:bg-primary/90 rounded-md">
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
      <div className="absolute inset-x-0 bottom-0 z-10 pb-6 md:pb-9">
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
