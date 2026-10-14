import { forwardRef, useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useLanguage } from '@/lib/i18n';

interface Props {
  doc: PDFDocumentProxy;
  pageNumber: number | null; // null = blank filler sheet
  active: boolean;
  width: number;
  height: number;
}

/** One sheet of the magazine. The canvas only exists while the page is near the viewer. */
const PdfFlipPage = forwardRef<HTMLDivElement, Props>(function PdfFlipPage(
  { doc, pageNumber, active, width, height },
  ref,
) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!active || !pageNumber) {
      canvas.width = 0;
      canvas.height = 0;
      return;
    }
    let cancelled = false;
    setFailed(false);
    let task: { cancel: () => void; promise: Promise<unknown> } | null = null;
    (async () => {
      try {
        const page = await doc.getPage(pageNumber);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        const fit = Math.min(width / base.width, height / base.height);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: fit * dpr });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(base.width * fit)}px`;
        canvas.style.height = `${Math.floor(base.height * fit)}px`;
        task = page.render({ canvas, viewport });
        await task.promise;
      } catch (error) {
        if (!cancelled) {
          const detail = error instanceof Error ? error.message.replace(/https?:\/\/\S+/g, '[URL]') : 'Unknown render error';
          console.warn('PDF page render failed', pageNumber, detail);
          setFailed(true);
        }
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, pageNumber, active, width, height, tries]);

  useEffect(
    () => () => {
      const c = canvasRef.current;
      if (c) {
        c.width = 0;
        c.height = 0;
      }
    },
    [],
  );

  return (
    <div ref={ref} className="bg-[hsl(40_30%_97%)]" data-density="soft">
      <div className="flex h-full w-full items-center justify-center overflow-hidden">
        {pageNumber ? (
          <>
            <canvas ref={canvasRef} className="block bg-white" />
            {failed && active && (
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); setTries((n) => n + 1); }}
                className="absolute rounded-md bg-secondary px-3 py-2 text-xs font-bold text-secondary-foreground"
                data-testid={`button-retry-page-${pageNumber}`}
              >
                {t('إعادة المحاولة', 'Retry')}
              </button>
            )}
            {!active && <span className="absolute text-xs text-muted-foreground">{pageNumber}</span>}
          </>
        ) : null}
      </div>
    </div>
  );
});

export default PdfFlipPage;
