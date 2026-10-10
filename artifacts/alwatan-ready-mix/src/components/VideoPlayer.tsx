import { useEffect, useState } from 'react';
import { VideoOff } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function VideoPlayer({ src, className, controls = true, muted = false, compact = false }: {
  src: string; className?: string; controls?: boolean; muted?: boolean; compact?: boolean;
}) {
  const { t } = useLanguage();
  const [error, setError] = useState<number | null>(null);
  useEffect(() => { setError(null); }, [src]);
  if (error !== null) return <div role={compact ? undefined : 'alert'} className={cn(className, 'flex flex-col items-center justify-center gap-2 rounded-md border bg-muted p-4 text-center text-muted-foreground')}>
    <VideoOff className="h-6 w-6 shrink-0" />
    <p className="text-sm font-semibold">{t('تعذر تشغيل الفيديو', 'Video could not be played')}</p>
    {!compact && <>
      <p className="text-sm">{error === 2
        ? t('تعذر تحميل الفيديو. تحقق من الرابط والاتصال ثم أعد المحاولة.', 'The video could not be loaded. Check the URL and connection, then retry.')
        : t('قد يكون ترميز الفيديو غير مدعوم في هذا المتصفح. جرّب WebM أو متصفحًا يدعم ترميز ملف MP4، أو نزّل الملف.', 'This browser may not support the video codec. Try WebM or a browser supporting the MP4 codec, or download the file.')}</p>
      <div className="flex flex-wrap justify-center gap-4 text-sm font-bold text-primary">
        <button type="button" onClick={() => setError(null)} className="underline">{t('إعادة المحاولة', 'Retry')}</button>
        <a href={src} download target="_blank" rel="noreferrer" className="underline">{t('تنزيل الفيديو', 'Download video')}</a>
      </div>
    </>}
  </div>;
  return <video src={src} controls={controls} muted={muted} playsInline preload="metadata" className={className}
    onError={event => setError(event.currentTarget.error?.code ?? 3)} />;
}
