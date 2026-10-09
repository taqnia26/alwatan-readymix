import { useState } from 'react';
import MediaInput from '@/components/admin/MediaInput';
import { useLanguage } from '@/lib/i18n';
import { useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@workspace/api-client-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQueryClient } from '@tanstack/react-query';
import { getListProductsQueryKey } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const productSchema = z.object({
  nameAr: z.string().min(1, 'Required'),
  nameEn: z.string().min(1, 'Required'),
  slug: z.string().min(1, 'Required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  descriptionAr: z.string().min(1, 'Required'),
  descriptionEn: z.string().min(1, 'Required'),
  specsAr: z.string(),
  specsEn: z.string(),
  imageUrl: z.string().refine((v) => v.startsWith('/') || /^https?:\/\//.test(v), 'Must be a valid URL'),
  compressiveStrength: z.string().min(1, 'Required'),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function AdminProducts() {
  const { t, isRtl } = useLanguage();
  const { data: products, isLoading } = useListProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nameAr: '', nameEn: '', slug: '', descriptionAr: '', descriptionEn: '',
      specsAr: '', specsEn: '', imageUrl: '', compressiveStrength: ''
    }
  });

  const openCreate = () => {
    setEditingSlug(null);
    form.reset({ nameAr: '', nameEn: '', slug: '', descriptionAr: '', descriptionEn: '', specsAr: '', specsEn: '', imageUrl: '', compressiveStrength: '' });
    setIsDialogOpen(true);
  };

  const openEdit = (product: any) => {
    setEditingSlug(product.slug);
    form.reset({
      nameAr: product.nameAr, nameEn: product.nameEn, slug: product.slug,
      descriptionAr: product.descriptionAr, descriptionEn: product.descriptionEn,
      specsAr: product.specsAr, specsEn: product.specsEn,
      imageUrl: product.imageUrl, compressiveStrength: product.compressiveStrength
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: ProductFormValues) => {
    if (editingSlug) {
      updateProduct.mutate({ slug: editingSlug, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          setIsDialogOpen(false);
          toast({ title: t('تم التحديث بنجاح', 'Updated successfully') });
        }
      });
    } else {
      createProduct.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
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
    deleteProduct.mutate({ slug }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: t('تم الحذف', 'Deleted') });
      }
    });
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-secondary">{t('إدارة المنتجات', 'Products Management')}</h2>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          {t('إضافة منتج', 'Add Product')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map(product => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col group">
            <div className="h-48 bg-gray-100 relative overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.nameEn} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ImageIcon className="w-12 h-12 opacity-50" />
                </div>
              )}
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold font-mono">
                {product.compressiveStrength}
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-lg text-secondary mb-1">{isRtl ? product.nameAr : product.nameEn}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4">{isRtl ? product.descriptionAr : product.descriptionEn}</p>
              <div className="mt-auto flex justify-end gap-2 pt-4 border-t border-gray-100">
                <Button variant="outline" size="sm" className="h-8" onClick={() => openEdit(product)}>
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> {t('تعديل', 'Edit')}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(product.slug)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {products?.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          {t('لا توجد منتجات', 'No products found')}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{editingSlug ? t('تعديل المنتج', 'Edit Product') : t('منتج جديد', 'New Product')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="nameAr" render={({ field }) => (
                  <FormItem><FormLabel>{t('الاسم بالعربية', 'Name (AR)')}</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="nameEn" render={({ field }) => (
                  <FormItem><FormLabel>{t('الاسم بالإنجليزية', 'Name (EN)')}</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem><FormLabel>Slug (URL)</FormLabel><FormControl><Input {...field} dir="ltr" disabled={!!editingSlug} placeholder="e.g. c30-concrete" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="compressiveStrength" render={({ field }) => (
                  <FormItem><FormLabel>{t('قوة الضغط', 'Compressive Strength')}</FormLabel><FormControl><Input {...field} dir="ltr" placeholder="e.g. 30 MPa" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem><FormLabel>{t('رابط الصورة', 'Image URL')}</FormLabel><FormControl><MediaInput value={field.value} onChange={field.onChange} kind="image" /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="descriptionAr" render={({ field }) => (
                  <FormItem><FormLabel>{t('الوصف بالعربية', 'Description (AR)')}</FormLabel><FormControl><Textarea {...field} dir="rtl" className="h-24" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="descriptionEn" render={({ field }) => (
                  <FormItem><FormLabel>{t('الوصف بالإنجليزية', 'Description (EN)')}</FormLabel><FormControl><Textarea {...field} dir="ltr" className="h-24" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="specsAr" render={({ field }) => (
                  <FormItem><FormLabel>{t('المواصفات بالعربية', 'Specs (AR)')}</FormLabel><FormControl><Textarea {...field} dir="rtl" className="h-24" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="specsEn" render={({ field }) => (
                  <FormItem><FormLabel>{t('المواصفات بالإنجليزية', 'Specs (EN)')}</FormLabel><FormControl><Textarea {...field} dir="ltr" className="h-24" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <Button type="submit" className="w-full" disabled={createProduct.isPending || updateProduct.isPending}>
                {t('حفظ', 'Save')}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
