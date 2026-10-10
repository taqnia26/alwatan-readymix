import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRequestMediaUpload, useFinalizeMedia, getListMediaQueryKey } from '@workspace/api-client-react';
import { useLanguage } from '@/lib/i18n';

const MB = 1024 * 1024;
const IMAGES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const FILE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  gif: 'image/gif', pdf: 'application/pdf', mp4: 'video/mp4', webm: 'video/webm',
};
export function uploadContentType(file: File) {
  if (file.type === 'image/jpg' || file.type === 'image/pjpeg') return 'image/jpeg';
  if (!file.type || file.type === 'application/octet-stream') {
    return FILE_TYPES[file.name.split('.').pop()?.toLowerCase() ?? ''] ?? '';
  }
  return file.type;
}
export function mediaUploadError(error: unknown, lang: 'ar' | 'en'): string {
  const err = error as { status?: number; data?: { error?: string }; message?: string } | null;
  if (lang === 'ar') {
    if (err?.data?.error && /[\u0600-\u06ff]/.test(err.data.error)) return err.data.error;
    if (err?.status === 401) return 'انتهت جلسة الدخول. سجّل الدخول مجددًا ثم أعد الرفع.';
    if (err?.status === 403) return 'رُفض طلب الرفع. أعد تسجيل الدخول وتحقق من إعدادات نطاق الموقع.';
    if (err?.status === 413) return 'الملف يتجاوز الحد المسموح أو حد الرفع في إعدادات الخادم.';
    if (err?.status === 415) return 'محتوى الملف لا يطابق صيغته. أعد تصديره بإحدى الصيغ المدعومة.';
    if (err?.status === 409 || err?.status === 410) return 'انتهت صلاحية رابط الرفع أو تم استخدامه. اختر الملف وأعد المحاولة.';
    if (err?.status && err.status >= 500) return 'تعذر حفظ الملف على الخادم. تحقق من إعدادات التخزين وصلاحيات المجلد.';
    if (err?.message === 'Upload timed out') return 'انتهت مهلة الرفع. تحقق من الاتصال ثم حاول مجددًا.';
    if (err?.message === 'Network error during upload') return 'تعذر الاتصال بالخادم أثناء الرفع. تحقق من الاتصال وإعدادات رفع الملفات.';
  }
  return err?.data?.error || err?.message || (lang === 'ar' ? 'تعذر رفع الملف. حاول مجددًا.' : 'Upload failed. Please retry.');
}
export function validateFile(file: File, lang: 'ar' | 'en'): string | null {
  const ct = uploadContentType(file);
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
  const { language } = useLanguage();
  const requestUpload = useRequestMediaUpload();
  const finalize = useFinalizeMedia();
  const qc = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [isUploading, setUploading] = useState(false);

  const upload = useCallback(async (file: File, altText?: string) => {
    setUploading(true);
    setProgress(0);
    try {
      const invalid = validateFile(file, language);
      if (invalid) throw new Error(invalid);
      const contentType = uploadContentType(file);
      const { uploadURL, objectPath } = await requestUpload.mutateAsync({ data: { name: file.name, size: file.size, contentType } });
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadURL);
        xhr.setRequestHeader('Content-Type', contentType);
        xhr.timeout = 120_000;
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) { resolve(); return; }
          let message = `Upload failed (${xhr.status})`;
          try {
            const body = JSON.parse(xhr.responseText) as { error?: string };
            if (typeof body.error === 'string') message = body.error;
          } catch { /* A proxy may return a non-JSON error; retain the HTTP status. */ }
          reject(Object.assign(new Error(message), { status: xhr.status }));
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.ontimeout = () => reject(new Error('Upload timed out'));
        xhr.onabort = () => reject(new Error(language === 'ar' ? 'تم إلغاء الرفع.' : 'Upload cancelled.'));
        xhr.send(file);
      });
      const asset = await finalize.mutateAsync({ data: { objectPath, originalName: file.name, contentType, size: file.size, altText: altText ?? file.name } });
      await qc.invalidateQueries({ queryKey: getListMediaQueryKey() });
      return { asset, url: `/api/storage${objectPath}` };
    } finally {
      setUploading(false);
    }
  }, [requestUpload.mutateAsync, finalize.mutateAsync, qc, language]);

  return { upload, progress, isUploading };
}
