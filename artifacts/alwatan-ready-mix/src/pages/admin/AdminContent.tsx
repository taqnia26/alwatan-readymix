import { useLanguage } from '@/lib/i18n';
import { useListPageContent, useUpdatePageContent } from '@workspace/api-client-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getListPageContentQueryKey } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { FileEdit } from 'lucide-react';

export default function AdminContent() {
  const { t, isRtl } = useLanguage();
  const { data: content, isLoading } = useListPageContent();
  const updateContent = useUpdatePageContent();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editingItem, setEditingItem] = useState<any>(null);
  const [valAr, setValAr] = useState('');
  const [valEn, setValEn] = useState('');

  const openEdit = (item: any) => {
    setEditingItem(item);
    setValAr(item.valueAr);
    setValEn(item.valueEn);
  };

  const handleSave = () => {
    if (!editingItem) return;
    updateContent.mutate(
      { id: editingItem.id, data: { valueAr: valAr, valueEn: valEn } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPageContentQueryKey() });
          setEditingItem(null);
          toast({ title: t('تم الحفظ بنجاح', 'Saved successfully') });
        },
        onError: () => {
          toast({ title: t('فشل الحفظ', 'Save failed'), variant: 'destructive' });
        }
      }
    );
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-bold text-secondary">{t('إدارة المحتوى', 'Content Management')}</h2>
        <p className="text-gray-500 text-sm">{t('تعديل النصوص والمحتوى الثابت في الموقع', 'Edit static text and content')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>{t('الصفحة', 'Page')}</TableHead>
                <TableHead>{t('القسم', 'Section')}</TableHead>
                <TableHead>{t('النص العربي', 'Arabic Value')}</TableHead>
                <TableHead>{t('النص الإنجليزي', 'English Value')}</TableHead>
                <TableHead className="w-24 text-end">{t('تعديل', 'Edit')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {content?.map(item => (
                <TableRow key={item.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-bold text-secondary">
                    {item.pageSlug === 'home' ? t('الرئيسية', 'Home') : 
                     item.pageSlug === 'about' ? t('عن الشركة', 'About') : 
                     item.pageSlug}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">{item.sectionKey}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm" dir="rtl">{item.valueAr}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm" dir="ltr">{item.valueEn}</TableCell>
                  <TableCell className="text-end">
                    <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => !open && setEditingItem(null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10">
                          <FileEdit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl" dir={isRtl ? 'rtl' : 'ltr'}>
                        <DialogHeader>
                          <DialogTitle className="text-secondary">{t('تعديل المحتوى', 'Edit Content')}</DialogTitle>
                          <p className="text-xs font-mono text-gray-400 mt-1">{item.pageSlug} / {item.sectionKey} / {item.fieldKey}</p>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          <div className="space-y-2">
                            <label className="font-bold text-sm text-secondary">{t('النص العربي', 'Arabic Content')}</label>
                            {item.contentType === 'richtext' || (item.contentType === 'text' && item.valueAr.length > 50) ? (
                              <Textarea value={valAr} onChange={e => setValAr(e.target.value)} className="min-h-[150px] bg-gray-50" dir="rtl" />
                            ) : (
                              <Input value={valAr} onChange={e => setValAr(e.target.value)} className="bg-gray-50" dir="rtl" />
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="font-bold text-sm text-secondary">{t('النص الإنجليزي', 'English Content')}</label>
                            {item.contentType === 'richtext' || (item.contentType === 'text' && item.valueEn.length > 50) ? (
                              <Textarea value={valEn} onChange={e => setValEn(e.target.value)} className="min-h-[150px] bg-gray-50" dir="ltr" />
                            ) : (
                              <Input value={valEn} onChange={e => setValEn(e.target.value)} className="bg-gray-50" dir="ltr" />
                            )}
                          </div>
                          <Button onClick={handleSave} className="w-full text-white" disabled={updateContent.isPending}>
                            {updateContent.isPending ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              t('حفظ التغييرات', 'Save Changes')
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
