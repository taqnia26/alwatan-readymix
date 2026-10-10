import { ArrowUpRight } from 'lucide-react';
import type { StudioPageSection } from '@workspace/api-client-react';
import { useLanguage } from '@/lib/i18n';
import VideoPlayer from '@/components/VideoPlayer';
import { mediaKind, pick } from '@/lib/studio';
import Reveal from './Reveal';
import RichText from './RichText';
import SmartLink from './SmartLink';

export function MediaBlock({ url, alt, className = '', kind }: { url: string; alt: string; className?: string; kind?: 'image' | 'video' | 'pdf' }) {
  if (!url) return null;
  const k = kind ?? mediaKind(url);
  if (k === 'video') return <VideoPlayer src={url} className={`w-full bg-black ${className}`} />;
  if (k === 'pdf') return <iframe src={url} title={alt} className={`h-[70dvh] w-full bg-card ${className}`} />;
  return <img src={url} alt={alt} loading="lazy" className={`w-full object-cover ${className}`} />;
}

export default function StudioSections({ sections }: { sections: StudioPageSection[] }) {
  const { language } = useLanguage();
  return (
    <>
      {sections.filter((s) => s.visible).map((s, i) => {
        const heading = pick(language, s.headingAr, s.headingEn);
        const body = pick(language, s.bodyAr, s.bodyEn);
        const btn = pick(language, s.buttonAr, s.buttonEn);
        if (s.kind === 'cta') {
          return (
            <section key={s.id} className="container mx-auto px-6 py-10">
              <Reveal>
                <div className="relative overflow-hidden rounded-2xl bg-secondary px-8 py-14 text-center text-white md:py-20">
                  <div className="absolute inset-0 grid-blueprint" />
                  <div className="absolute inset-x-0 top-0 h-1 flow-line" />
                  <div className="relative mx-auto max-w-3xl">
                    {heading && <h2 className="text-3xl font-black md:text-5xl">{heading}</h2>}
                    {body && <RichText value={body} className="mt-5 text-lg text-white/80" />}
                    {btn && s.href && <SmartLink href={s.href} className="mt-8 inline-flex h-14 items-center gap-2 rounded-md bg-primary px-8 text-lg font-bold text-white hover:bg-primary/90">{btn}<ArrowUpRight className="h-5 w-5 rtl:-scale-x-100" /></SmartLink>}
                  </div>
                </div>
              </Reveal>
            </section>
          );
        }
        if (s.kind === 'image' || s.kind === 'video') {
          return (
            <section key={s.id} className="container mx-auto px-6 py-10 md:py-14">
              <Reveal>
                {heading && <h2 className="mb-6 text-2xl font-extrabold text-secondary md:text-4xl">{heading}</h2>}
                <div className="overflow-hidden rounded-2xl border bg-card shadow-lg"><MediaBlock url={s.mediaUrl} alt={heading} kind={s.kind} className="max-h-[70dvh]" /></div>
                {body && <RichText value={body} className="mt-5 max-w-3xl text-muted-foreground" />}
                {btn && s.href && <SmartLink href={s.href} className="mt-5 inline-flex font-bold text-primary hover:underline">{btn}</SmartLink>}
              </Reveal>
            </section>
          );
        }
        return (
          <section key={s.id} className={`py-12 md:py-16 ${i % 2 ? 'bg-muted/40' : ''}`}>
            <div className="container mx-auto max-w-4xl px-6">
              <Reveal>
                {heading && <h2 className="mb-6 border-s-4 border-primary ps-4 text-2xl font-extrabold text-secondary md:text-4xl">{heading}</h2>}
                <RichText value={body} className="text-lg text-foreground/85" />
                {btn && s.href && <SmartLink href={s.href} className="mt-6 inline-flex h-12 items-center rounded-md bg-primary px-6 font-bold text-white hover:bg-primary/90">{btn}</SmartLink>}
              </Reveal>
            </div>
          </section>
        );
      })}
    </>
  );
}
