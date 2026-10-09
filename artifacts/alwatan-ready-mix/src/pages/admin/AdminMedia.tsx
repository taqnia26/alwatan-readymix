import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Copy, Eye, Loader2, Search, Trash2, UploadCloud, ImageIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useListMedia, useDeleteMedia, getListMediaQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { useMediaUpload, validateFile } from '@/hooks/use-media-upload';
import { mediaKind } from '@/lib/studio';
import { PageHead } from '@/components/admin/studio-ui';
import { MediaThumb } from '@/components/admin/MediaPicker';

type MediaItem = Awaited<ReturnType<typeof import('@workspace/api-client-react').listMedia>>[number];
const url = (m: MediaItem) => `/api/storage${m.objectPath}`;
const size = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1024).toFixed(1)} KB`);

export default function AdminMedia() {
  const { t, language, isRtl } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useListMedia();
  const del = useDeleteMedia();
  const { upload, isUploading, progress } = useMediaUpload();
  const ref = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [type, setType] = useState<'all' | 'image' | 'video' | 'pdf'>('all');
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [toDelete, setToDelete] = useState<MediaItem | null>(null);

  const items = useMemo(() => (data ?? []).filter((m) => (type === 'all' || mediaKind(m.objectPath, m.contentType) === type) && (!q || m.originalName.toLowerCase().includes(q.toLowerCase()))), [data, q, type]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const err = validateFile(f, language);
    if (err) { toast({ title: err, variant: 'destructive' }); return; }
    try { await upload(f); toast({ title: t('تم رفع الملف', 'File uploaded') }); } catch { toast({ title: t('فشل رفع الملف', 'Upload failed'), variant: 'destructive' }); }
  };
  const copy = (m: MediaItem) => { void navigator.clipboard.writeText(`${window.location.origin}${url(m)}`); toast({ title: t('تم نسخ الرابط', 'URL copied') }); };
  const remove = () => {
    if (!toDelete) return;
    del.mutate({ id: toDelete.id }, {
      onSuccess: () => { void qc.invalidateQueries({ queryKey: getListMediaQueryKey() }); toast({ title: t('تم الحذف', 'Deleted') }); setToDelete(null); },
      onError: () => { toast({ title: t('فشل الحذف', 'Delete failed'), variant: 'destructive' }); setToDelete(null); },
    });
  };
  const filters: ['all' | 'image' | 'video' | 'pdf', string][] = [['all', t('الكل', 'All')], ['image', t('صور', 'Images')], ['video', t('فيديو', 'Videos')], ['pdf', 'PDF']];

  return (
    <div className="space-y-5">
      <PageHead title={t('مكتبة الوسائط', 'Media library')} desc={t('صور حتى 10 م.ب، فيديو MP4/WebM حتى 100 م.ب، وPDF حتى 25 م.ب.', 'Images up to 10 MB, MP4/WebM video up to 100 MB, PDF up to 25 MB.')}
        actions={<><input ref={ref} type="file" hidden onChange={onFile} accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf" /><Button onClick={() => ref.current?.click()} disabled={isUploading} className="gap-2" data-testid="button-upload-media">{isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}{isUploading ? `${Math.round(progress)}%` : t('رفع ملف', 'Upload file')}</Button></>} />
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1"><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9 bg-card" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('بحث بالاسم...', 'Search by name...')} /></div>
        <div className="flex rounded-lg border bg-card p-0.5">{filters.map(([k, l]) => <button key={k} onClick={() => setType(k)} className={`rounded-md px-3 py-1.5 text-sm font-bold ${type === k ? 'bg-primary text-white' : 'text-muted-foreground'}`}>{l}</button>)}</div>
      </div>
      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3"><AlertTriangle className="mx-auto h-8 w-8 text-destructive" /><p className="font-bold">{t('تعذر تحميل الوسائط', 'Could not load media')}</p><Button onClick={() => void refetch()}>{t('إعادة المحاولة', 'Retry')}</Button></div>
      ) : isLoading ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-44" />)}</div>
      : items.length === 0 ? <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card p-16 text-muted-foreground"><ImageIcon className="h-10 w-10 text-primary/40" /><p>{data?.length ? t('لا نتائج مطابقة', 'No matching files') : t('لم يتم رفع أي وسائط بعد', 'No media uploaded yet')}</p></div>
      : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {items.map((m) => (
            <div key={m.id} className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm" data-testid={`card-media-${m.id}`}>
              <button className="relative h-32 bg-muted" onClick={() => setPreview(m)} aria-label={t('معاينة', 'Preview')}>
                <MediaThumb url={url(m)} kind={mediaKind(m.objectPath, m.contentType)} className="h-full w-full" />
              </button>
              <div className="flex flex-1 flex-col p-3">
                <p className="truncate text-xs font-bold text-secondary" title={m.originalName}>{m.originalName}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{size(m.size)}</p>
                <div className="mt-2 flex gap-1 border-t pt-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreview(m)} aria-label="Preview"><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copy(m)} aria-label="Copy URL" data-testid={`button-copy-${m.id}`}><Copy className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="ms-auto h-8 w-8 text-destructive" onClick={() => setToDelete(m)} aria-label="Delete" data-testid={`button-delete-${m.id}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle className="truncate">{preview?.originalName}</DialogTitle></DialogHeader>
          {preview && (() => { const k = mediaKind(preview.objectPath, preview.contentType); return k === 'video' ? <video src={url(preview)} controls className="max-h-[70dvh] w-full bg-black" /> : k === 'pdf' ? <iframe src={url(preview)} title={preview.originalName} className="h-[70dvh] w-full" /> : <img src={url(preview)} alt={preview.altText} className="mx-auto max-h-[70dvh] object-contain" />; })()}
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'}>
          <AlertDialogHeader><AlertDialogTitle>{t('حذف الملف؟', 'Delete this file?')}</AlertDialogTitle><AlertDialogDescription>{t('لا يمكن التراجع. قد تتأثر الصفحات التي تستخدمه.', 'This cannot be undone. Pages using it may break.')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t('إلغاء', 'Cancel')}</AlertDialogCancel><AlertDialogAction className="bg-destructive text-white" onClick={remove}>{t('حذف', 'Delete')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
