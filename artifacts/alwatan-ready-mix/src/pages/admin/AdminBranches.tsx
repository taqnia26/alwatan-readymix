import { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useAdminAccess } from '@/hooks/use-admin-access';
import { useListAdminBranches, useCreateBranch, useUpdateBranch, useDeleteBranch } from '@workspace/api-client-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import { getListAdminBranchesQueryKey } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const GOOGLE_HOSTS = /^(www\.)?google\.[a-z.]{2,6}$/i;
export function isGoogleMapsUrl(v: string): boolean {
  try {
    const u = new URL(v);
    if (u.protocol !== 'https:') return false;
    const h = u.hostname.toLowerCase();
    if (h === 'maps.app.goo.gl') return true;
    if (h === 'goo.gl') return u.pathname.startsWith('/maps');
    if (h === 'maps.google.com' || /^maps\.google\.[a-z.]{2,6}$/.test(h)) return true;
    return GOOGLE_HOSTS.test(h) && (u.pathname === '/maps' || u.pathname.startsWith('/maps/'));
  } catch { return false; }
}

const branchSchema = z.object({
  nameAr: z.string().min(1, 'Required'),
  nameEn: z.string().min(1, 'Required'),
  city: z.string().min(1, 'Required'),
  addressAr: z.string().min(1, 'Required'),
  addressEn: z.string().min(1, 'Required'),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  phone: z.string().min(1, 'Required'),
  workingHours: z.string().min(1, 'Required'),
  orderIndex: z.coerce.number().default(0),
  googleMapsUrl: z.string().trim().max(2000, 'Max 2000 characters').refine((v) => v === '' || isGoogleMapsUrl(v), 'Must be a valid HTTPS Google Maps link').default(''),
});

type BranchFormValues = z.infer<typeof branchSchema>;

export default function AdminBranches() {
  const { t, isRtl } = useLanguage();
  const canEdit = useAdminAccess().canEdit('branches');
  const { data: branches, isLoading } = useListAdminBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      nameAr: '', nameEn: '', city: '', addressAr: '', addressEn: '',
      lat: 24.7136, lng: 46.6753, phone: '', workingHours: '', orderIndex: 0, googleMapsUrl: ''
    }
  });

  const openCreate = () => {
    setEditingId(null);
    form.reset({ nameAr: '', nameEn: '', city: '', addressAr: '', addressEn: '', lat: 24.7136, lng: 46.6753, phone: '', workingHours: '', orderIndex: 0, googleMapsUrl: '' });
    setIsDialogOpen(true);
  };

  const openEdit = (branch: any) => {
    setEditingId(branch.id);
    form.reset({
      nameAr: branch.nameAr, nameEn: branch.nameEn, city: branch.city,
      addressAr: branch.addressAr, addressEn: branch.addressEn,
      lat: branch.lat, lng: branch.lng, phone: branch.phone,
      workingHours: branch.workingHours, orderIndex: branch.orderIndex, googleMapsUrl: branch.googleMapsUrl ?? ''
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: BranchFormValues) => {
    if (!canEdit) return;
    if (editingId) {
      updateBranch.mutate({ id: editingId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminBranchesQueryKey() });
          setIsDialogOpen(false);
          toast({ title: t('تم التحديث بنجاح', 'Updated successfully') });
        }
      });
    } else {
      createBranch.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminBranchesQueryKey() });
          setIsDialogOpen(false);
          toast({ title: t('تمت الإضافة بنجاح', 'Created successfully') });
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!canEdit) return;
    if (!confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete?'))) return;
    deleteBranch.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminBranchesQueryKey() });
        toast({ title: t('تم الحذف', 'Deleted') });
      }
    });
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-secondary">{t('إدارة الفروع', 'Branches Management')}</h2>
        </div>
        <Button onClick={openCreate} disabled={!canEdit} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          {t('إضافة فرع', 'Add Branch')}
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>{t('الاسم', 'Name')}</TableHead>
              <TableHead>{t('المدينة', 'City')}</TableHead>
              <TableHead>{t('الهاتف', 'Phone')}</TableHead>
              <TableHead className="text-end">{t('إجراءات', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches?.map(branch => (
              <TableRow key={branch.id} className="hover:bg-gray-50/50">
                <TableCell className="font-mono text-gray-400">{branch.orderIndex}</TableCell>
                <TableCell className="font-bold text-secondary">{isRtl ? branch.nameAr : branch.nameEn}</TableCell>
                <TableCell>{branch.city}</TableCell>
                <TableCell className="font-mono">{branch.phone}</TableCell>
                <TableCell className="text-end">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(branch)} disabled={!canEdit}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(branch.id)} disabled={!canEdit}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {branches?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                  {t('لا توجد فروع', 'No branches found')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{editingId ? t('تعديل الفرع', 'Edit Branch') : t('فرع جديد', 'New Branch')}</DialogTitle>
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
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>{t('المدينة', 'City')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>{t('الهاتف', 'Phone')}</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="addressAr" render={({ field }) => (
                  <FormItem><FormLabel>{t('العنوان بالعربية', 'Address (AR)')}</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="addressEn" render={({ field }) => (
                  <FormItem><FormLabel>{t('العنوان بالإنجليزية', 'Address (EN)')}</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="lat" render={({ field }) => (
                  <FormItem><FormLabel>{t('خط العرض', 'Latitude')}</FormLabel><FormControl><Input type="number" step="0.000001" {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="lng" render={({ field }) => (
                  <FormItem><FormLabel>{t('خط الطول', 'Longitude')}</FormLabel><FormControl><Input type="number" step="0.000001" {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="orderIndex" render={({ field }) => (
                  <FormItem><FormLabel>{t('الترتيب', 'Order')}</FormLabel><FormControl><Input type="number" {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="googleMapsUrl" render={({ field }) => (
                <FormItem><FormLabel>{t('رابط خرائط جوجل (اختياري)', 'Google Maps link (optional)')}</FormLabel><FormControl><Input {...field} dir="ltr" maxLength={2000} placeholder="https://maps.app.goo.gl/..." data-testid="input-branch-google-maps-url" /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="workingHours" render={({ field }) => (
                <FormItem><FormLabel>{t('ساعات العمل', 'Working Hours')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <Button type="submit" className="w-full" data-testid="button-save-branch" disabled={!canEdit || createBranch.isPending || updateBranch.isPending}>
                {t('حفظ', 'Save')}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
