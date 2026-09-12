import { useState, useRef } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useListMedia, useRequestMediaUpload, useFinalizeMedia, useDeleteMedia } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { getListMediaQueryKey } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Copy, UploadCloud, File, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminMedia() {
  const { t, isRtl } = useLanguage();
  const { data: mediaList, isLoading } = useListMedia();
  const requestUpload = useRequestMediaUpload();
  const finalizeMedia = useFinalizeMedia();
  const deleteMedia = useDeleteMedia();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // Step 1: Request upload URL
      const { uploadURL, objectPath } = await requestUpload.mutateAsync({
        data: {
          name: file.name,
          size: file.size,
          contentType: file.type
        }
      });

      // Step 2: Upload direct to GCS
      const res = await fetch(uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      if (!res.ok) throw new Error('Upload failed');

      // Step 3: Finalize metadata
      await finalizeMedia.mutateAsync({
        data: {
          objectPath,
          originalName: file.name,
          contentType: file.type,
          size: file.size,
          altText: file.name
        }
      });

      queryClient.invalidateQueries({ queryKey: getListMediaQueryKey() });
      toast({ title: t('تم رفع الملف بنجاح', 'File uploaded successfully') });
    } catch (err) {
      console.error(err);
      toast({ title: t('فشل رفع الملف', 'Upload failed'), variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm(t('هل أنت متأكد من الحذف؟ لن يمكن التراجع.', 'Are you sure? This cannot be undone.'))) return;
    deleteMedia.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMediaQueryKey() });
        toast({ title: t('تم الحذف', 'Deleted') });
      }
    });
  };

  const copyToClipboard = (path: string) => {
    // Construct full URL relative to window location
    const url = `${window.location.origin}/api/storage${path}`;
    navigator.clipboard.writeText(url);
    toast({ title: t('تم نسخ الرابط', 'URL Copied') });
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-secondary mb-1">{t('مكتبة الوسائط', 'Media Library')}</h2>
          <p className="text-gray-500 text-sm">
            {t('رفع وإدارة الصور والملفات لاستخدامها في المحتوى والمنتجات', 'Upload and manage images and files for use in content')}
          </p>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,application/pdf" 
          />
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
            className="gap-2 bg-primary hover:bg-primary/90 h-12 px-6"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
            {t('رفع ملف جديد', 'Upload File')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {mediaList?.map(media => {
          const isImage = media.contentType.startsWith('image/');
          const fileUrl = `/api/storage${media.objectPath}`;

          return (
            <div key={media.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group flex flex-col">
              <div className="h-32 bg-gray-100 flex items-center justify-center relative p-2">
                {isImage ? (
                  <img src={fileUrl} alt={media.altText} className="max-w-full max-h-full object-contain" />
                ) : (
                  <File className="w-12 h-12 text-gray-400" />
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                  <Button variant="secondary" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => copyToClipboard(media.objectPath)} title="Copy URL">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => handleDelete(media.id)} title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3 bg-white flex-1 flex flex-col">
                <p className="text-xs font-bold text-secondary truncate mb-1" title={media.originalName}>{media.originalName}</p>
                <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-50 text-[10px] text-gray-400 font-mono">
                  <span>{(media.size / 1024).toFixed(1)} KB</span>
                  <span>{format(new Date(media.createdAt), 'yyyy-MM-dd')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {mediaList?.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 flex flex-col items-center justify-center text-gray-500 gap-4">
          <ImageIcon className="w-12 h-12 text-gray-300" />
          <p>{t('لم يتم رفع أي وسائط بعد', 'No media uploaded yet')}</p>
        </div>
      )}
    </div>
  );
}
