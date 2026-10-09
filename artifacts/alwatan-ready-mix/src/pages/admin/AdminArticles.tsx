import { useState } from 'react';
import MediaInput from '@/components/admin/MediaInput';
import { useLanguage } from '@/lib/i18n';
import { useListAdminBlogPosts, useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost } from '@workspace/api-client-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import { getListAdminBlogPostsQueryKey } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { format } from 'date-fns';

const articleSchema = z.object({
  titleAr: z.string().min(1, 'Required'),
  titleEn: z.string().min(1, 'Required'),
  slug: z.string().min(1, 'Required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  excerptAr: z.string().min(1, 'Required'),
  excerptEn: z.string().min(1, 'Required'),
  contentAr: z.string().min(1, 'Required'),
  contentEn: z.string().min(1, 'Required'),
  coverImage: z.string().refine((v) => v.startsWith('/') || /^https?:\/\//.test(v), 'Must be a valid URL'),
  status: z.enum(['draft', 'published']),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

export default function AdminArticles() {
  const { t, isRtl } = useLanguage();
  const { data: articles, isLoading } = useListAdminBlogPosts();
  const createArticle = useCreateBlogPost();
  const updateArticle = useUpdateBlogPost();
  const deleteArticle = useDeleteBlogPost();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      titleAr: '', titleEn: '', slug: '', excerptAr: '', excerptEn: '',
      contentAr: '', contentEn: '', coverImage: '', status: 'draft'
    }
  });

  const openCreate = () => {
    setEditingSlug(null);
    form.reset({ titleAr: '', titleEn: '', slug: '', excerptAr: '', excerptEn: '', contentAr: '', contentEn: '', coverImage: '', status: 'draft' });
    setIsDialogOpen(true);
  };

  const openEdit = (article: any) => {
    setEditingSlug(article.slug);
    form.reset({
      titleAr: article.titleAr, titleEn: article.titleEn, slug: article.slug,
      excerptAr: article.excerptAr, excerptEn: article.excerptEn,
      contentAr: article.contentAr, contentEn: article.contentEn,
      coverImage: article.coverImage, status: article.status
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: ArticleFormValues) => {
    if (editingSlug) {
      updateArticle.mutate({ slug: editingSlug, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminBlogPostsQueryKey() });
          setIsDialogOpen(false);
          toast({ title: t('تم التحديث بنجاح', 'Updated successfully') });
        }
      });
    } else {
      createArticle.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminBlogPostsQueryKey() });
          setIsDialogOpen(false);
          toast({ title: t('تمت الإضافة بنجاح', 'Created successfully') });
        },
        onError: () => {
          toast({ title: t('تأكد من عدم تكرار المعرف', 'Slug might already exist'), variant: 'destructive' });
        }
      });
    }
  };

  const handleDelete = (slug: string) => {
    if (!confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete?'))) return;
    deleteArticle.mutate({ slug }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminBlogPostsQueryKey() });
        toast({ title: t('تم الحذف', 'Deleted') });
      }
    });
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-secondary">{t('إدارة المقالات', 'Articles Management')}</h2>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          {t('إضافة مقال', 'Add Article')}
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>{t('العنوان', 'Title')}</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>{t('الحالة', 'Status')}</TableHead>
              <TableHead>{t('تاريخ النشر', 'Published')}</TableHead>
              <TableHead className="text-end">{t('إجراءات', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles?.map(article => (
              <TableRow key={article.id} className="hover:bg-gray-50/50">
                <TableCell className="font-bold text-secondary">{isRtl ? article.titleAr : article.titleEn}</TableCell>
                <TableCell className="font-mono text-xs text-gray-500">{article.slug}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${article.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {article.status.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {article.publishedAt ? format(new Date(article.publishedAt), 'yyyy-MM-dd') : '-'}
                </TableCell>
                <TableCell className="text-end">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(article)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(article.slug)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {articles?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                  {t('لا توجد مقالات', 'No articles found')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{editingSlug ? t('تعديل المقال', 'Edit Article') : t('مقال جديد', 'New Article')}</DialogTitle>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem><FormLabel>Slug (URL)</FormLabel><FormControl><Input {...field} dir="ltr" disabled={!!editingSlug} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>{t('الحالة', 'Status')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">{t('مسودة', 'Draft')}</SelectItem>
                        <SelectItem value="published">{t('منشور', 'Published')}</SelectItem>
                      </SelectContent>
                    </Select>
                  <FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="coverImage" render={({ field }) => (
                <FormItem><FormLabel>{t('صورة الغلاف', 'Cover Image')}</FormLabel><FormControl><MediaInput value={field.value} onChange={field.onChange} kind="image" /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="excerptAr" render={({ field }) => (
                  <FormItem><FormLabel>{t('الملخص بالعربية', 'Excerpt (AR)')}</FormLabel><FormControl><Textarea {...field} dir="rtl" className="h-20" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="excerptEn" render={({ field }) => (
                  <FormItem><FormLabel>{t('الملخص بالإنجليزية', 'Excerpt (EN)')}</FormLabel><FormControl><Textarea {...field} dir="ltr" className="h-20" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="contentAr" render={({ field }) => (
                  <FormItem><FormLabel>{t('المحتوى بالعربية', 'Content (AR)')} (HTML)</FormLabel><FormControl><Textarea {...field} dir="rtl" className="h-64 font-mono text-sm" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contentEn" render={({ field }) => (
                  <FormItem><FormLabel>{t('المحتوى بالإنجليزية', 'Content (EN)')} (HTML)</FormLabel><FormControl><Textarea {...field} dir="ltr" className="h-64 font-mono text-sm" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <Button type="submit" className="w-full" disabled={createArticle.isPending || updateArticle.isPending}>
                {t('حفظ', 'Save')}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
