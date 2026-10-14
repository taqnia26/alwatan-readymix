import { lazy, Suspense } from 'react';
import { AlertTriangle, Download, ExternalLink, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { usePdfDocument, type PdfErrorKind } from '@/hooks/use-pdf-document';

const PdfMagazine = lazy(() => import('./PdfMagazine'));

function Loading({ progress }: { progress: number | null }) {
  const { t } = useLanguage();
  return (
    <div className="flex h-[50vh] min-h-[320px] flex-col items-center justify-center gap-4 p-6" data-testid="status-pdf-loading">
      <div className="flex h-40 w-64 animate-pulse gap-1">
        <div className="flex-1 rounded-s-md bg-muted" />
        <div className="flex-1 rounded-e-md bg-muted" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        {t('جارٍ تجهيز المجلة...', 'Preparing the magazine...')}
        {progress != null && ` ${Math.round(progress * 100)}%`}
      </p>
    </div>
  );
}

export function ProfileError({ kind, url, onRetry, config }: { kind: PdfErrorKind | 'config'; url?: string; onRetry: () => void; config?: boolean }) {
  const { t } = useLanguage();
  const msgs: Record<PdfErrorKind | 'config', [string, string]> = {
    config: ['تعذّر تحميل إعدادات الموقع، لذلك لم نعرض أي ملف.', 'We could not load the site settings, so no profile is shown.'],
    network: ['تعذّر تحميل الملف. قد يكون الاتصال ضعيفًا أو أن الخادم يمنع القراءة من هذه الصفحة (CORS).', 'The file could not be loaded. Your connection may be weak, or the host blocks reading it from this page (CORS).'],
    invalid: ['الملف تالف أو ليس بصيغة PDF مدعومة.', 'The file is damaged or not a supported PDF.'],
    password: ['الملف محمي بكلمة مرور ولا يمكن عرضه هنا.', 'The file is password-protected and cannot be shown here.'],
    missing: ['لم يتم العثور على الملف.', 'The file was not found.'],
    unknown: ['حدث خطأ غير متوقع أثناء فتح الملف.', 'Something went wrong while opening the file.'],
  };
  const [ar, en] = msgs[kind];
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 p-8 text-center" data-testid="status-pdf-error">
      <AlertTriangle className="h-10 w-10 text-primary" />
      <p className="max-w-md text-base font-medium text-foreground">{t(ar, en)}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={onRetry} className="gap-2" data-testid="button-retry-pdf"><RotateCw className="h-4 w-4" />{t('إعادة المحاولة', 'Retry')}</Button>
        {url && !config && (
          <>
            <a href={url} target="_blank" rel="noreferrer"><Button variant="outline" className="gap-2"><ExternalLink className="h-4 w-4" />{t('فتح الملف الأصلي', 'Open original')}</Button></a>
            <a href={url} download><Button variant="ghost" className="gap-2"><Download className="h-4 w-4" />{t('تحميل', 'Download')}</Button></a>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProfileViewer({ url }: { url: string }) {
  const { state, retry } = usePdfDocument(url, true);
  if (state.status === 'error') return <ProfileError kind={state.kind} url={url} onRetry={retry} />;
  if (state.status !== 'ready') return <Loading progress={state.status === 'loading' ? state.progress : null} />;
  return (
    <Suspense fallback={<Loading progress={null} />}>
      <PdfMagazine doc={state.doc} numPages={state.numPages} aspect={state.aspect} url={url} />
    </Suspense>
  );
}
