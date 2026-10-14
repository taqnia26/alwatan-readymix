import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ProfileFlipBook, { type Engine as FlipApi } from './ProfileFlipBook';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  ChevronLeft, ChevronRight, Download, ExternalLink, Maximize2, Minimize2, ZoomIn, ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { trackSiteActivity } from '@/lib/site-activity';
import PdfFlipPage from './PdfFlipPage';
import { ProfilePageWindow } from './ProfilePageWindow';

interface Props { doc: PDFDocumentProxy; numPages: number; aspect: number; url: string }
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
  const [warming, setWarming] = useState<number | null>(null);
  const [readyTick, setReadyTick] = useState(0);
  const [turning, setTurning] = useState(false);
  const [preparationFailed, setPreparationFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const previousIndex = useRef(idx);
  const readyPages = useRef(new Map<number, string>());
  const phase = useRef('read');
  const measureStage = useRef<() => void>(() => {});
  const pending = useRef<{ target: number; action: 'next' | 'prev' | 'jump' } | null>(null);
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
    const measure = () => {
      if (phase.current !== 'read') return;
      const w = el.clientWidth, h = el.clientHeight;
      setSize((current) => Math.abs(current.w - w) > 8 || Math.abs(current.h - h) > 8
        ? { w, h } : current);
    };
    measureStage.current = measure;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
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
  const dimensionKey = `${pageW}:${pageH}`;
  const onReady = useCallback((index: number, ready: boolean) => {
    if (ready) readyPages.current.set(index, dimensionKey);
    else if (readyPages.current.get(index) === dimensionKey) readyPages.current.delete(index);
    setReadyTick((n) => n + 1);
  }, [dimensionKey]);
  const onError = useCallback(() => {
    setPreparationFailed(true);
    pending.current = null;
    phase.current = 'read';
    setTurning(false);
    setWarming(null);
  }, []);
  const retryPages = useCallback(() => {
    setPreparationFailed(false);
    setRetry((n) => n + 1);
  }, []);
  const pageWindow = useMemo(() => ({ current: idx, warming, onReady, onError, retry, retryPages }),
    [idx, warming, onReady, onError, retry, retryPages]);
  // Keep these elements stable. New children make react-pageflip rebuild every sheet.
  const sheets = useMemo(() => items.map((p, i) => (
    <PdfFlipPage key={i} doc={doc} pageNumber={p} index={i} width={pageW} height={pageH} />
  )), [items, doc, pageW, pageH]);
  const onFlip = useCallback((e: { data: number }) => {
    setWarming(previousIndex.current);
    previousIndex.current = e.data;
    setIdx(e.data);
  }, []);
  const onChangeState = useCallback((e: { data: string }) => {
    if (pending.current) return;
    phase.current = e.data;
    setTurning(e.data !== 'read');
    if (e.data === 'read') {
      setWarming(null);
      requestAnimationFrame(() => measureStage.current());
    }
  }, []);
  const requiredPages = useCallback((target: number) => {
    if (portrait || target === 0 || (m % 2 === 0 && target === m - 1)) return [target];
    const first = target % 2 === 0 ? target - 1 : target;
    return [first, first + 1].filter((index) => index < m);
  }, [portrait, m]);
  useEffect(() => {
    const request = pending.current;
    if (!request || [...requiredPages(idx), ...requiredPages(request.target)].some((index) =>
      items[index] !== null && readyPages.current.get(index) !== dimensionKey)) return;
    const api = bookRef.current?.pageFlip();
    if (!api) return;
    pending.current = null;
    phase.current = 'flipping';
    setTurning(true);
    if (request.action === 'jump') api.flip(request.target);
    else if (request.action === 'next') isRtl ? api.flipPrev() : api.flipNext();
    else isRtl ? api.flipNext() : api.flipPrev();
  }, [readyTick, requiredPages, items, dimensionKey, isRtl, idx]);

  // Visible pages for the label
  const visible = useMemo(() => {
    const ids = idx === 0 || portrait || idx + 1 >= m ? [idx] : [idx, idx + 1];
    return ids.map((i) => items[i]).filter((p): p is number => !!p).sort((a, b) => a - b);
  }, [idx, items, m, portrait]);
  const label = visible.length > 1 ? `${visible[0]}-${visible[1]}` : `${visible[0] ?? numPages}`;

  const requestTurn = (target: number, action: 'next' | 'prev' | 'jump') => {
    if (phase.current !== 'read' || pending.current || target < 0 || target >= m || items[target] === null || target === idx) return;
    if (preparationFailed) { retryPages(); return; }
    pending.current = { target, action };
    phase.current = 'loading';
    setWarming(target);
    setReadyTick((n) => n + 1);
  };
  const next = () => {
    if (visible.includes(numPages)) return;
    requestTurn(isRtl ? idx - (portrait ? 1 : 2) : idx + (portrait || idx === 0 ? 1 : 2), 'next');
  };
  const prev = () => {
    if (visible.includes(1)) return;
    requestTurn(isRtl ? idx + (portrait ? 1 : 2) : idx - (portrait || idx === 1 ? 1 : 2), 'prev');
  };
  const go = (p: number) => {
    const target = toIdx(Math.min(Math.max(p, 1), numPages));
    if (!visible.includes(items[target] ?? 0)) requestTurn(target, 'jump');
  };

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
  const preparing = pending.current !== null || Array.from({ length: 6 }, (_, n) => idx - 2 + n)
    .filter((index) => index >= 0 && index < m && items[index] !== null)
    .some((index) => readyPages.current.get(index) !== dimensionKey);
  const FlipBook = ProfileFlipBook;

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKey}
      data-testid="pdf-magazine"
      data-profile-size={`${pageW}x${pageH}`}
      className={`flex flex-col bg-secondary outline-none ${full ? 'h-[100dvh]' : 'rounded-2xl'}`}
    >
      <div
        ref={stageRef}
        className={`relative overflow-auto ${full ? 'flex-1' : 'h-[72vh] min-h-[420px] md:h-[78vh]'}`}
        style={{ background: 'radial-gradient(ellipse at center, hsl(var(--secondary)/0.85), hsl(var(--secondary)))' }}
      >
        {size.w > 0 && size.h > 0 && pageW > 0 && (
          <div className="flex min-h-full min-w-full items-center justify-center p-3" dir="ltr">
            <div style={{ width: bw, height: pageH }} className="shrink-0">
              <ProfilePageWindow.Provider value={pageWindow}><FlipBook
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
                onFlip={onFlip}
                onChangeState={onChangeState}
              >
                {sheets}
              </FlipBook></ProfilePageWindow.Provider>
            </div>
          </div>
        )}
        {preparing && !turning && !preparationFailed && <div className="absolute inset-0 z-20 flex items-center justify-center bg-secondary/30"
          role="status" data-testid="status-profile-pages-preparing">
          <span className="rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
            {t('جارٍ تجهيز صفحات الملف التعريفي…', 'Preparing company profile pages…')}
          </span>
        </div>}
      </div>
      {preparationFailed && <div role="alert" className="flex items-center justify-center gap-3 px-4 py-2 text-sm text-secondary-foreground">
        {t('تعذّر تجهيز إحدى الصفحات. حاول مرة أخرى.', 'A page could not be prepared. Please retry.')}
        <Button size="sm" onClick={retryPages}>{t('إعادة المحاولة', 'Retry')}</Button>
      </div>}

      <div
        className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 px-3 py-3 text-secondary-foreground"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <Button size="icon" variant="ghost" disabled={turning || pending.current !== null || visible.includes(1)} onClick={prev} aria-label={t('الصفحة السابقة', 'Previous page')} data-testid="button-prev-page">
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
        <Button size="icon" variant="ghost" disabled={turning || pending.current !== null || visible.includes(numPages)} onClick={next} aria-label={t('الصفحة التالية', 'Next page')} data-testid="button-next-page">
          <Fwd className="h-5 w-5" />
        </Button>
        <span className="mx-1 hidden h-6 w-px bg-white/20 sm:block" />
        <Button size="icon" variant="ghost" disabled={zoomIdx === 0 || turning || pending.current !== null} onClick={() => setZoomIdx((z) => z - 1)} aria-label={t('تصغير', 'Zoom out')} data-testid="button-zoom-out">
          <ZoomOut className="h-5 w-5" />
        </Button>
        <span className="w-12 text-center text-sm tabular-nums">{Math.round(zoom * 100)}%</span>
        <Button size="icon" variant="ghost" disabled={zoomIdx === ZOOMS.length - 1 || turning || pending.current !== null} onClick={() => setZoomIdx((z) => z + 1)} aria-label={t('تكبير', 'Zoom in')} data-testid="button-zoom-in">
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="ghost" disabled={turning || pending.current !== null} onClick={toggleFull} aria-label={t('ملء الشاشة', 'Fullscreen')} data-testid="button-fullscreen">
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
