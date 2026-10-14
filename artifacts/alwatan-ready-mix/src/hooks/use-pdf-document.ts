import { useCallback, useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export type PdfErrorKind = 'network' | 'invalid' | 'password' | 'missing' | 'unknown';
export type PdfDocState =
  | { status: 'idle' }
  | { status: 'loading'; progress: number | null }
  | { status: 'ready'; doc: PDFDocumentProxy; numPages: number; aspect: number }
  | { status: 'error'; kind: PdfErrorKind };

function classify(err: unknown): PdfErrorKind {
  const e = err as { name?: string; status?: number } | null;
  if (e?.name === 'PasswordException') return 'password';
  if (e?.name === 'InvalidPDFException' || e?.name === 'FormatError') return 'invalid';
  if (e?.name === 'ResponseException' || e?.name === 'MissingPDFException') {
    return e.status === 404 || e.name === 'MissingPDFException' ? 'missing' : 'network';
  }
  if (e?.name === 'UnexpectedResponseException') return 'network';
  return err instanceof TypeError ? 'network' : 'unknown';
}

/** Lazily loads a PDF with range requests. Nothing is fetched until `enabled`. */
export function usePdfDocument(url: string, enabled: boolean) {
  const [state, setState] = useState<PdfDocState>({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !url) {
      setState({ status: 'idle' });
      return;
    }
    let cancelled = false;
    let destroy: (() => void) | null = null;
    setState({ status: 'loading', progress: null });
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = worker;
        const task = pdfjs.getDocument({ url, wasmUrl: `${import.meta.env.BASE_URL}pdfjs/wasm/`, disableAutoFetch: true, disableStream: true });
        destroy = () => void task.destroy();
        task.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
          if (!cancelled) setState((current) => current.status === 'loading'
            ? { status: 'loading', progress: total ? Math.min(loaded / total, 1) : null }
            : current);
        };
        const doc = await task.promise;
        if (cancelled) {
          void task.destroy();
          return;
        }
        const first = await doc.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        first.cleanup();
        if (cancelled) return;
        setState({ status: 'ready', doc, numPages: doc.numPages, aspect: vp.width / vp.height });
      } catch (err) {
        if (!cancelled) setState({ status: 'error', kind: classify(err) });
      }
    })();
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [url, enabled, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
