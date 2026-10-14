import { forwardRef, useContext, useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useLanguage } from '@/lib/i18n';
import { ProfilePageWindow } from './ProfilePageWindow';

interface Props {
  doc: PDFDocumentProxy;
  pageNumber: number | null; // null = blank filler sheet
  index: number;
  width: number;
  height: number;
}

/** A bitmap sheet survives the flip engine's DOM clones (a canvas bitmap does not). */
const PdfFlipPage = forwardRef<HTMLDivElement, Props>(function PdfFlipPage(
  { doc, pageNumber, index, width, height },
  ref,
) {
  const { t } = useLanguage();
  const window = useContext(ProfilePageWindow);
  const active = Math.abs(index - window.current) <= 6
    || (window.warming !== null && Math.abs(index - window.warming) <= 3);
  const onReady = window.onReady;
  const [image, setImage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const onError = window.onError;

  useEffect(() => {
    const canvas = document.createElement('canvas');
    if (!active || !pageNumber) {
      setImage(null);
      onReady(index, !pageNumber);
      return;
    }
    let cancelled = false;
    let imageUrl: string | null = null;
    setFailed(false);
    let task: { cancel: () => void; promise: Promise<unknown> } | null = null;
    (async () => {
      try {
        const page = await doc.getPage(pageNumber);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        const fit = Math.min(width / base.width, height / base.height);
        const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: fit * dpr });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(base.width * fit)}px`;
        canvas.style.height = `${Math.floor(base.height * fit)}px`;
        task = page.render({ canvas, viewport });
        await task.promise;
        if (cancelled) return;
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
          (value) => value ? resolve(value) : reject(new Error('Unable to prepare PDF page')),
          'image/png',
        ));
        if (cancelled) return;
        imageUrl = URL.createObjectURL(blob);
        const decoded = new Image();
        decoded.src = imageUrl;
        await decoded.decode();
        if (cancelled) return;
        setImage(imageUrl);
        onReady(index, true);
        canvas.width = 0;
        canvas.height = 0;
      } catch (error) {
        if (!cancelled) {
          const detail = error instanceof Error ? error.message.replace(/https?:\/\/\S+/g, '[URL]') : 'Unknown render error';
          console.warn('PDF page render failed', pageNumber, detail);
          setFailed(true);
          onError(index);
        }
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
      onReady(index, false);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      canvas.width = 0;
      canvas.height = 0;
    };
  }, [doc, pageNumber, index, active, width, height, window.retry, onReady, onError]);

  return (
    <div ref={ref} className="bg-[hsl(40_30%_97%)]" data-density="soft">
      <div className="flex h-full w-full items-center justify-center overflow-hidden">
        {pageNumber ? (
          <>
            {image && <img src={image} alt={t(`صفحة ${pageNumber} من الملف التعريفي`, `Company profile page ${pageNumber}`)}
              draggable={false} className="block h-full w-full object-contain" data-profile-page={pageNumber} />}
            {active && !image && !failed && <span className="absolute text-xs text-muted-foreground">
              {t('جارٍ تجهيز الصفحة…', 'Preparing page…')}
            </span>}
            {failed && active && (
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); window.retryPages(); }}
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
