import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  ChevronLeft, ChevronRight, Download, ExternalLink, Maximize2, Minimize2, ZoomIn, ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { trackSiteActivity } from '@/lib/site-activity';
import PdfFlipPage from './PdfFlipPage';

interface Props { doc: PDFDocumentProxy; numPages: number; aspect: number; url: string }
interface FlipApi { flip: (n: number) => void; flipNext: () => void; flipPrev: () => void; getOrientation: () => string }
const ZOOMS = [1, 1.25, 1.5, 2];

export default function PdfMagazine({ doc, numPages, aspect, url }: Props) {
  const { t, isRtl } = useLanguage();
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<{ pageFlip: () => FlipApi } | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [zoomIdx, setZoomIdx] = useState(0);
  const [full, setFull] = useState(false);
  const [idx, setIdx] = useState(() => isRtl ? (numPages % 2 ? numPages : numPages - 1) : 0);
  const [fullscreenError, setFullscreenError] = useState(false);
  const [jump, setJump] = useState('');
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  // RTL: reversed sheets (padded even) so page 1 is the right-hand cover.
  const items = useMemo(() => {
    const list = Array.from({ length: numPages }, (_, i) => i + 1) as (number | null)[];
    if (!isRtl) return list;
    const m = numPages % 2 ? numPages + 1 : numPages;
    return Array.from({ length: m }, (_, i) => (m - i <= numPages ? m - i : null));
  }, [numPages, isRtl]);
  const m = items.length;
  const toIdx = useCallback((p: number) => (isRtl ? m - p : p - 1), [isRtl, m]);
  useEffect(() => { setIdx(isRtl ? m - 1 : 0); }, [isRtl, m]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  const portrait = size.w < 720;
  const zoom = ZOOMS[zoomIdx];
  const availW = Math.max(size.w - 24, 200);
  const availH = Math.max(size.h - 24, 240);
  const pageW = Math.floor(Math.min(portrait ? availW : availW / 2, availH * aspect) * zoom);
  const pageH = Math.floor(pageW / aspect);

  // Visible pages for the label
  const visible = useMemo(() => {
    const ids = idx === 0 || portrait || idx + 1 >= m ? [idx] : [idx, idx + 1];
    return ids.map((i) => items[i]).filter((p): p is number => !!p).sort((a, b) => a - b);
  }, [idx, items, m, portrait]);
  const label = visible.length > 1 ? `${visible[0]}-${visible[1]}` : `${visible[0] ?? numPages}`;

  const next = () => (isRtl ? bookRef.current?.pageFlip().flipPrev() : bookRef.current?.pageFlip().flipNext());
  const prev = () => (isRtl ? bookRef.current?.pageFlip().flipNext() : bookRef.current?.pageFlip().flipPrev());
  const go = (p: number) => bookRef.current?.pageFlip().flip(toIdx(Math.min(Math.max(p, 1), numPages)));

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    const right = e.key === 'ArrowRight', left = e.key === 'ArrowLeft';
    if (!right && !left && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    if (e.key === 'Home') go(1);
    else if (e.key === 'End') go(numPages);
    else if ((right && !isRtl) || (left && isRtl)) next();
    else prev();
  };

  const toggleFull = async () => {
    setFullscreenError(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (rootRef.current?.requestFullscreen) await rootRef.current.requestFullscreen();
      else setFullscreenError(true);
    } catch {
      setFullscreenError(true);
    }
  };

  const Fwd = isRtl ? ChevronLeft : ChevronRight;
  const Back = isRtl ? ChevronRight : ChevronLeft;
  const bw = portrait ? pageW : pageW * 2 + 2;
  const nearSet = (i: number) => Math.abs(i - idx) <= 3;
  const FlipBook = HTMLFlipBook as unknown as React.ComponentType<Record<string, unknown>>;

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKey}
      data-testid="pdf-magazine"
      className={`flex flex-col bg-secondary outline-none ${full ? 'h-[100dvh]' : 'rounded-2xl'}`}
    >
      <div
        ref={stageRef}
        className={`relative overflow-auto ${full ? 'flex-1' : 'h-[72vh] min-h-[420px] md:h-[78vh]'}`}
        style={{ background: 'radial-gradient(ellipse at center, hsl(var(--secondary)/0.85), hsl(var(--secondary)))' }}
      >
        {pageW > 0 && (
          <div className="flex min-h-full min-w-full items-center justify-center p-3" dir="ltr">
            <div style={{ width: bw, height: pageH }} className="shrink-0">
              <FlipBook
                key={`${pageW}-${pageH}-${portrait}-${isRtl}`}
                ref={bookRef}
                width={pageW}
                height={pageH}
                size="fixed"
                minWidth={100}
                maxWidth={4000}
                minHeight={100}
                maxHeight={6000}
                startPage={Math.min(idx, m - 1)}
                showCover
                usePortrait={portrait}
                drawShadow={!reduced}
                maxShadowOpacity={0.5}
                flippingTime={reduced ? 1 : 900}
                useMouseEvents
                mobileScrollSupport
                showPageCorners={!reduced}
                clickEventForward
                swipeDistance={30}
                autoSize={false}
                startZIndex={0}
                className="shadow-2xl"
                style={{}}
                onFlip={(e: { data: number }) => setIdx(e.data)}
              >
                {items.map((p, i) => (
                  <PdfFlipPage key={i} doc={doc} pageNumber={p} active={nearSet(i)} width={pageW} height={pageH} />
                ))}
              </FlipBook>
            </div>
          </div>
        )}
      </div>

      <div
        className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 px-3 py-3 text-secondary-foreground"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <Button size="icon" variant="ghost" onClick={prev} aria-label={t('الصفحة السابقة', 'Previous page')} data-testid="button-prev-page">
          <Back className="h-5 w-5" />
        </Button>
        <form
          className="flex items-center gap-2 text-sm font-bold"
          onSubmit={(e) => { e.preventDefault(); const n = parseInt(jump, 10); if (n) go(n); setJump(''); }}
        >
          <span data-testid="text-page-indicator" className="tabular-nums" dir="ltr">
            {label} / {numPages}
          </span>
          <input
            value={jump}
            onChange={(e) => setJump(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            placeholder={t('اذهب', 'Go')}
            aria-label={t('الانتقال إلى صفحة', 'Jump to page')}
            data-testid="input-jump-page"
            className="h-9 w-16 rounded-md border border-white/20 bg-white/10 px-2 text-center text-sm placeholder:text-secondary-foreground/50"
          />
        </form>
        <Button size="icon" variant="ghost" onClick={next} aria-label={t('الصفحة التالية', 'Next page')} data-testid="button-next-page">
          <Fwd className="h-5 w-5" />
        </Button>
        <span className="mx-1 hidden h-6 w-px bg-white/20 sm:block" />
        <Button size="icon" variant="ghost" disabled={zoomIdx === 0} onClick={() => setZoomIdx((z) => z - 1)} aria-label={t('تصغير', 'Zoom out')} data-testid="button-zoom-out">
          <ZoomOut className="h-5 w-5" />
        </Button>
        <span className="w-12 text-center text-sm tabular-nums">{Math.round(zoom * 100)}%</span>
        <Button size="icon" variant="ghost" disabled={zoomIdx === ZOOMS.length - 1} onClick={() => setZoomIdx((z) => z + 1)} aria-label={t('تكبير', 'Zoom in')} data-testid="button-zoom-in">
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="ghost" onClick={toggleFull} aria-label={t('ملء الشاشة', 'Fullscreen')} data-testid="button-fullscreen">
          {full ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </Button>
        <a href={url} target="_blank" rel="noreferrer" aria-label={t('فتح الملف الأصلي', 'Open original PDF')} data-testid="link-open-original">
          <Button size="icon" variant="ghost" asChild={false} tabIndex={-1}><ExternalLink className="h-5 w-5" /></Button>
        </a>
        <a href={url} download onClick={() => trackSiteActivity('profile_download')} aria-label={t('تحميل الملف', 'Download PDF')} data-testid="link-download-viewer">
          <Button size="icon" variant="ghost" tabIndex={-1}><Download className="h-5 w-5" /></Button>
        </a>
      </div>
      {fullscreenError && <p role="status" className="px-4 py-2 text-center text-sm text-secondary-foreground">
        {t('المتصفح لا يسمح بملء الشاشة هنا. يمكنك استخدام أزرار التكبير أو فتح الملف الأصلي.', 'This browser does not allow fullscreen here. Use zoom or open the original PDF.')}
      </p>}
    </div>
  );
}
