import { useState } from 'react';
import MediaInput from '@/components/admin/MediaInput';
import { useLanguage } from '@/lib/i18n';
import { useAdminAccess } from '@/hooks/use-admin-access';
import {
  useListAdminCertificates,
  useCreateCertificate,
  useUpdateCertificate,
  useDeleteCertificate,
} from '@workspace/api-client-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQueryClient } from '@tanstack/react-query';
import { getListAdminCertificatesQueryKey } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { useMediaUpload, uploadContentType, mediaUploadError } from '@/hooks/use-media-upload';
import { Plus, Edit2, Trash2, Award, FileText, UploadCloud, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { format } from 'date-fns';

const certificateSchema = z.object({
  titleAr: z.string().min(1, 'Required'),
  titleEn: z.string().min(1, 'Required'),
  certificateNumber: z.string().nullable(),
  descriptionAr: z.string().min(1, 'Required'),
  descriptionEn: z.string().min(1, 'Required'),
  imageUrl: z.string().refine(
    value => !value || (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) || (/^https?:\/\//i.test(value) && z.string().url().safeParse(value).success),
    'Must be a valid URL',
  ),
  fileUrl: z.string().refine(
    value => !value || (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) || (/^https?:\/\//i.test(value) && z.string().url().safeParse(value).success),
    'Must be a valid URL',
  ),
  issuedBy: z.string().min(1, 'Required'),
  issuedDate: z.string().min(1, 'Required'),
});

type CertificateFormValues = z.infer<typeof certificateSchema>;

export default function AdminCertificates() {
  const { t, isRtl } = useLanguage();
  const canEdit = useAdminAccess().canEdit('certificates');
  const { data: certificates, isLoading } = useListAdminCertificates();
  const createCertificate = useCreateCertificate();
  const updateCertificate = useUpdateCertificate();
  const deleteCertificate = useDeleteCertificate();
  const { upload } = useMediaUpload();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploadingField, setUploadingField] = useState<'imageUrl' | 'fileUrl' | null>(null);

  const form = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      titleAr: '', titleEn: '', certificateNumber: '', descriptionAr: '', descriptionEn: '',
      imageUrl: '', fileUrl: '', issuedBy: '', issuedDate: format(new Date(), 'yyyy-MM-dd')
    }
  });

  const openCreate = () => {
    setEditingId(null);
    form.reset({ titleAr: '', titleEn: '', certificateNumber: '', descriptionAr: '', descriptionEn: '', imageUrl: '', fileUrl: '', issuedBy: '', issuedDate: format(new Date(), 'yyyy-MM-dd') });
    setIsDialogOpen(true);
  };

  const openEdit = (cert: any) => {
    setEditingId(cert.id);
    form.reset({
      titleAr: cert.titleAr, titleEn: cert.titleEn, certificateNumber: cert.certificateNumber || '',
      descriptionAr: cert.descriptionAr, descriptionEn: cert.descriptionEn,
      imageUrl: cert.imageUrl ?? '', fileUrl: cert.fileUrl ?? '',
      issuedBy: cert.issuedBy, issuedDate: format(new Date(cert.issuedDate), 'yyyy-MM-dd')
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: CertificateFormValues) => {
    if (!canEdit) return;
    if (editingId) {
      updateCertificate.mutate({ id: editingId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminCertificatesQueryKey() });
          setIsDialogOpen(false);
          toast({ title: t('تم التحديث بنجاح', 'Updated successfully') });
        }
      });
    } else {
      createCertificate.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminCertificatesQueryKey() });
          setIsDialogOpen(false);
          toast({ title: t('تمت الإضافة بنجاح', 'Created successfully') });
        }
      });
    }
  };

  const uploadCertificateFile = async (
    file: File,
    field: 'imageUrl' | 'fileUrl',
  ) => {
    const isImage = field === 'imageUrl';
    const contentType = uploadContentType(file);
    const validType = isImage ? contentType.startsWith('image/') : contentType === 'application/pdf';
    const maxSize = isImage ? 10 * 1024 * 1024 : 25 * 1024 * 1024;

    if (!validType) {
      toast({
        title: isImage
          ? t('يرجى اختيار ملف صورة', 'Please select an image file')
          : t('يرجى اختيار ملف PDF', 'Please select a PDF file'),
        variant: 'destructive',
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        title: t(
          `حجم الملف يجب ألا يتجاوز ${isImage ? 10 : 25} ميجابايت`,
          `File size must not exceed ${isImage ? 10 : 25} MB`,
        ),
        variant: 'destructive',
      });
      return;
    }

    setUploadingField(field);
    try {
      const { url: fileUrl } = await upload(file);
      form.setValue(field, fileUrl, { shouldDirty: true, shouldValidate: true });
      toast({ title: t('تم إرفاق الملف بنجاح', 'File attached successfully') });
    } catch (error) {
      toast({ title: t('فشل رفع الملف', 'File upload failed'), description: mediaUploadError(error, isRtl ? 'ar' : 'en'), variant: 'destructive' });
    } finally {
      setUploadingField(null);
    }
  };

  const handleDelete = (id: number) => {
    if (!canEdit) return;
    if (!confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete?'))) return;
    deleteCertificate.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminCertificatesQueryKey() });
        toast({ title: t('تم الحذف', 'Deleted') });
      }
    });
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-secondary">{t('إدارة الشهادات', 'Certificates Management')}</h2>
        </div>
        <Button onClick={openCreate} disabled={!canEdit} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          {t('إضافة شهادة', 'Add Certificate')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {certificates?.map(cert => (
          <div key={cert.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="h-40 bg-gray-100 flex items-center justify-center relative group p-4">
              {cert.imageUrl ? (
                <img src={cert.imageUrl} alt={cert.titleEn} className="max-w-full max-h-full object-contain drop-shadow-md" />
              ) : (
                <Award className="w-12 h-12 text-gray-300" />
              )}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-secondary text-sm mb-1">{isRtl ? cert.titleAr : cert.titleEn}</h3>
              <p className="text-xs text-gray-500 mb-2">{cert.issuedBy} - {format(new Date(cert.issuedDate), 'yyyy-MM-dd')}</p>
              
              <div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-100">
                {cert.fileUrl ? <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1 font-bold">
                  <FileText className="w-3.5 h-3.5" /> PDF
                </a> : <span className="text-xs text-muted-foreground">{t('لم يتم إرفاق PDF', 'No PDF attached')}</span>}
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(cert)} disabled={!canEdit}>
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(cert.id)} disabled={!canEdit}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {certificates?.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          {t('لا توجد شهادات', 'No certificates found')}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{editingId ? t('تعديل الشهادة', 'Edit Certificate') : t('شهادة جديدة', 'New Certificate')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="titleAr" render={({ field }) => (
                  <FormItem><FormLabel>{t('العنوان بالعربية', 'Title (AR)')}</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="titleEn" render={({ field }) => (
                  <FormItem><FormLabel>{t('العنوان بالإنجليزية', 'Title (EN)')}</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="certificateNumber" render={({ field }) => (
                  <FormItem><FormLabel>{t('رقم الشهادة', 'Certificate No.')}</FormLabel><FormControl><Input {...field} value={field.value || ''} dir="ltr" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="issuedBy" render={({ field }) => (
                  <FormItem><FormLabel>{t('جهة الإصدار', 'Issued By')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="issuedDate" render={({ field }) => (
                  <FormItem><FormLabel>{t('تاريخ الإصدار', 'Issue Date')}</FormLabel><FormControl><Input type="date" {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('صورة المعاينة', 'Preview Image')}</FormLabel>
                    <div className="flex gap-2">
                      <FormControl><Input {...field} dir="ltr" placeholder="https://..." /></FormControl>
                      <Button type="button" variant="outline" className="shrink-0 relative" disabled={uploadingField !== null}>
                        {uploadingField === 'imageUrl' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        <span className="sr-only">{t('إرفاق صورة', 'Attach image')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          disabled={uploadingField !== null}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void uploadCertificateFile(file, 'imageUrl');
                            event.target.value = '';
                          }}
                        />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('أرفق صورة أو أدخل رابطًا مباشرًا (حتى 10 م.ب)', 'Attach an image or enter a direct URL (up to 10 MB)')}</p>
                    <MediaInput value={field.value ?? ''} onChange={field.onChange} kind="image" />
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fileUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ملف الشهادة PDF', 'Certificate PDF')}</FormLabel>
                    <div className="flex gap-2">
                      <FormControl><Input {...field} dir="ltr" placeholder="https://..." /></FormControl>
                      <Button type="button" variant="outline" className="shrink-0 relative" disabled={uploadingField !== null}>
                        {uploadingField === 'fileUrl' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        <span className="sr-only">{t('إرفاق ملف PDF', 'Attach PDF')}</span>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          disabled={uploadingField !== null}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void uploadCertificateFile(file, 'fileUrl');
                            event.target.value = '';
                          }}
                        />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('أرفق ملف PDF أو أدخل رابطًا مباشرًا (حتى 25 م.ب)', 'Attach a PDF or enter a direct URL (up to 25 MB)')}</p>
                    <MediaInput value={field.value ?? ''} onChange={field.onChange} kind="pdf" />
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="descriptionAr" render={({ field }) => (
                  <FormItem><FormLabel>{t('الوصف بالعربية', 'Description (AR)')}</FormLabel><FormControl><Textarea {...field} dir="rtl" className="h-24" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="descriptionEn" render={({ field }) => (
                  <FormItem><FormLabel>{t('الوصف بالإنجليزية', 'Description (EN)')}</FormLabel><FormControl><Textarea {...field} dir="ltr" className="h-24" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <Button type="submit" className="w-full" disabled={!canEdit || createCertificate.isPending || updateCertificate.isPending || uploadingField !== null}>
                {uploadingField ? t('جاري رفع الملف...', 'Uploading file...') : t('حفظ', 'Save')}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
