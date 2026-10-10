import { useMemo, useRef, useState } from 'react';
import { Search, UploadCloud, FileText, Film, Image as ImageIcon, Check, Loader2, AlertTriangle } from 'lucide-react';
import { useListMedia } from '@workspace/api-client-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/lib/i18n';
import { mediaKind } from '@/lib/studio';
import { useMediaUpload, validateFile, mediaUploadError } from '@/hooks/use-media-upload';
import VideoPlayer from '@/components/VideoPlayer';
import { useToast } from '@/hooks/use-toast';

export type PickKind = 'image' | 'video' | 'pdf' | 'any';

export function MediaThumb({ url, kind, className = '' }: { url: string; kind: string; className?: string }) {
  if (kind === 'image') return <img src={url} alt="" loading="lazy" className={`object-cover ${className}`} />;
  if (kind === 'video') return <VideoPlayer src={url} muted controls={false} compact className={`object-cover ${className}`} />;
  return <div className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}><FileText className="h-8 w-8" /></div>;
}

export default function MediaPicker({ open, onOpenChange, onSelect, kind = 'any' }: {
  open: boolean; onOpenChange: (o: boolean) => void; onSelect: (url: string) => void; kind?: PickKind;
}) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useListMedia();
  const { upload, isUploading, progress } = useMediaUpload();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<PickKind>(kind);
  const ref = useRef<HTMLInputElement>(null);

  const items = useMemo(() => (data ?? []).filter((m) => {
    const k = mediaKind(m.objectPath, m.contentType);
    if (filter !== 'any' && k !== filter) return false;
    return !q || m.originalName.toLowerCase().includes(q.toLowerCase());
  }), [data, q, filter]);

  const onFile = async (f?: File) => {
    if (!f) return;
    const err = validateFile(f, language);
    if (err) { toast({ title: err, variant: 'destructive' }); return; }
    try {
      const r = await upload(f);
      onSelect(r.url);
      onOpenChange(false);
    } catch (e) {
      toast({ title: t('فشل الرفع', 'Upload failed'), description: mediaUploadError(e, language), variant: 'destructive' });
    } finally { if (ref.current) ref.current.value = ''; }
  };

  const tabs: [PickKind, string, typeof ImageIcon][] = [['any', t('الكل', 'All'), Check], ['image', t('صور', 'Images'), ImageIcon], ['video', t('فيديو', 'Video'), Film], ['pdf', 'PDF', FileText]];
  const allowed = kind === 'any' ? tabs : tabs.filter(([k]) => k === kind);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90dvh] flex flex-col gap-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{t('مكتبة الوسائط', 'Media library')}</DialogTitle>
          <DialogDescription>{t('اختر ملفا موجودا أو ارفع ملفا جديدا. صور حتى 10MB، فيديو حتى 100MB، PDF حتى 25MB.', 'Pick an existing file or upload a new one. Images up to 10MB, video 100MB, PDF 25MB.')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('بحث بالاسم', 'Search by name')} className="ps-9" data-testid="input-media-search" />
          </div>
          {allowed.length > 1 && (
            <div className="flex rounded-lg border p-0.5 bg-muted/50">
              {allowed.map(([k, label]) => (
                <button key={k} type="button" onClick={() => setFilter(k)} className={`px-3 py-1.5 text-sm rounded-md font-semibold transition ${filter === k ? 'bg-card shadow text-primary' : 'text-muted-foreground'}`}>{label}</button>
              ))}
            </div>
          )}
          <input ref={ref} type="file" hidden accept={kind === 'image' ? 'image/jpeg,image/png,image/webp,image/gif' : kind === 'video' ? 'video/mp4,video/webm' : kind === 'pdf' ? 'application/pdf' : 'image/*,video/mp4,video/webm,application/pdf'} onChange={(e) => onFile(e.target.files?.[0])} />
          <Button type="button" onClick={() => ref.current?.click()} disabled={isUploading} className="gap-2" data-testid="button-media-upload">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {isUploading ? `${progress}%` : t('رفع جديد', 'Upload new')}
          </Button>
        </div>
        <div className="admin-scrollbar overflow-y-auto min-h-[240px] flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-12 text-destructive"><AlertTriangle />{t('تعذر تحميل الوسائط', 'Could not load media')}<Button variant="outline" onClick={() => refetch()}>{t('إعادة المحاولة', 'Retry')}</Button></div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">{t('لا توجد ملفات مطابقة', 'No matching files')}</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((m) => {
                const url = `/api/storage${m.objectPath}`;
                const k = mediaKind(m.objectPath, m.contentType);
                return (
                  <button key={m.id} type="button" onClick={() => { onSelect(url); onOpenChange(false); }} className="group text-start rounded-lg border bg-card overflow-hidden hover:border-primary hover:ring-2 hover:ring-primary/30 transition" data-testid={`button-pick-media-${m.id}`}>
                    <MediaThumb url={url} kind={k} className="h-28 w-full" />
                    <div className="p-2 text-xs font-semibold truncate">{m.originalName}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
