import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRequestMediaUpload, useFinalizeMedia, getListMediaQueryKey } from '@workspace/api-client-react';

const MB = 1024 * 1024;
const IMAGES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export function validateFile(file: File, lang: 'ar' | 'en'): string | null {
  const ct = file.type;
  const ar = lang === 'ar';
  if (file.size === 0) return ar ? 'الملف فارغ' : 'File is empty';
  let max = 0;
  if (IMAGES.includes(ct)) max = 10 * MB;
  else if (ct === 'video/mp4' || ct === 'video/webm') max = 100 * MB;
  else if (ct === 'application/pdf') max = 25 * MB;
  else return ar ? 'نوع غير مدعوم. المسموح: JPEG, PNG, WebP, GIF, MP4, WebM, PDF.' : 'Unsupported type. Allowed: JPEG, PNG, WebP, GIF, MP4, WebM, PDF.';
  if (file.size > max) return ar ? `الحجم يتجاوز ${max / MB} ميجابايت` : `File exceeds ${max / MB} MB`;
  return null;
}

export function useMediaUpload() {
  const requestUpload = useRequestMediaUpload();
  const finalize = useFinalizeMedia();
  const qc = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [isUploading, setUploading] = useState(false);

  const upload = useCallback(async (file: File, altText?: string) => {
    setUploading(true);
    setProgress(0);
    try {
      const { uploadURL, objectPath } = await requestUpload.mutateAsync({ data: { name: file.name, size: file.size, contentType: file.type } });
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadURL);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(file);
      });
      const asset = await finalize.mutateAsync({ data: { objectPath, originalName: file.name, contentType: file.type, size: file.size, altText: altText ?? file.name } });
      await qc.invalidateQueries({ queryKey: getListMediaQueryKey() });
      return { asset, url: `/api/storage${objectPath}` };
    } finally {
      setUploading(false);
    }
  }, [requestUpload.mutateAsync, finalize.mutateAsync, qc]);

  return { upload, progress, isUploading };
}
