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

export default function AdminContent() {
  const { t } = useLanguage();
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
        onSuccess: (updated) => {
          queryClient.setQueryData(getListPageContentQueryKey(), (old: any) => 
            old?.map((c: any) => c.id === updated.id ? updated : c)
          );
          setEditingItem(null);
          toast({ title: t('تم الحفظ بنجاح', 'Saved successfully') });
        }
      }
    );
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Page</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Arabic Value</TableHead>
            <TableHead>English Value</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {content?.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-bold">{item.pageSlug}</TableCell>
              <TableCell>{item.sectionKey}</TableCell>
              <TableCell className="font-mono text-xs">{item.fieldKey}</TableCell>
              <TableCell className="max-w-xs truncate">{item.valueAr}</TableCell>
              <TableCell className="max-w-xs truncate" dir="ltr">{item.valueEn}</TableCell>
              <TableCell>
                <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => !open && setEditingItem(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                      {t('تعديل', 'Edit')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Edit Content ({item.pageSlug} / {item.fieldKey})</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="font-bold text-sm">Arabic Content</label>
                        {item.contentType === 'richtext' || item.contentType === 'text' && item.valueAr.length > 50 ? (
                          <Textarea value={valAr} onChange={e => setValAr(e.target.value)} className="min-h-[150px]" dir="rtl" />
                        ) : (
                          <Input value={valAr} onChange={e => setValAr(e.target.value)} dir="rtl" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="font-bold text-sm">English Content</label>
                        {item.contentType === 'richtext' || item.contentType === 'text' && item.valueEn.length > 50 ? (
                          <Textarea value={valEn} onChange={e => setValEn(e.target.value)} className="min-h-[150px]" dir="ltr" />
                        ) : (
                          <Input value={valEn} onChange={e => setValEn(e.target.value)} dir="ltr" />
                        )}
                      </div>
                      <Button onClick={handleSave} className="w-full" disabled={updateContent.isPending}>
                        {updateContent.isPending ? 'Saving...' : 'Save Changes'}
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
  );
}
