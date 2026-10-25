import { useLanguage } from '@/lib/i18n';
import { useAdminAccess } from '@/hooks/use-admin-access';
import { useListQuotes, useUpdateQuoteStatus, useDeleteQuote } from '@workspace/api-client-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { getListQuotesQueryKey } from '@workspace/api-client-react';
import { Download, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function AdminQuotes() {
  const { t, isRtl } = useLanguage();
  const canEdit = useAdminAccess().canEdit('quotes');
  const { data: paginatedData, isLoading } = useListQuotes();
  const updateStatus = useUpdateQuoteStatus();
  const deleteQuote = useDeleteQuote();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusChange = (id: number, status: 'new' | 'contacted' | 'closed') => {
    if (!canEdit) return;
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListQuotesQueryKey() });
          toast({ title: t('تم تحديث الحالة', 'Status updated') });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!canEdit) return;
    if (!confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete?'))) return;
    deleteQuote.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListQuotesQueryKey() });
          toast({ title: t('تم الحذف بنجاح', 'Deleted successfully') });
        }
      }
    );
  };

  const handleExport = () => {
    window.open('/api/admin/quotes.csv', '_blank');
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  const quotes = paginatedData?.items || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-secondary">{t('إدارة طلبات التسعير', 'Manage Quotes')}</h2>
          <p className="text-gray-500 text-sm">{t('عرض وتحديث حالات طلبات العملاء', 'View and update client quotes')}</p>
        </div>
        <Button onClick={handleExport} className="gap-2 bg-secondary hover:bg-secondary/90">
          <Download className="w-4 h-4" />
          {t('تصدير', 'Export CSV')}
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>{t('التاريخ', 'Date')}</TableHead>
                <TableHead>{t('العميل', 'Client')}</TableHead>
                <TableHead>{t('المشروع', 'Project')}</TableHead>
                <TableHead>{t('المنتج', 'Product')}</TableHead>
                <TableHead>{t('الحالة', 'Status')}</TableHead>
                <TableHead className="text-end">{t('إجراءات', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map(quote => (
                <TableRow key={quote.id} className="hover:bg-gray-50/50">
                  <TableCell className="whitespace-nowrap text-sm text-gray-500 font-mono">
                    {format(new Date(quote.createdAt), 'yyyy-MM-dd HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-secondary">{quote.fullName}</div>
                    <div className="text-xs text-gray-500 flex flex-col gap-1 mt-1">
                      <a href={`tel:${quote.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Phone className="w-3 h-3" /> <span className="font-mono">{quote.phone}</span>
                      </a>
                      <a href={`mailto:${quote.email}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Mail className="w-3 h-3" /> {quote.email}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-1">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-sm">{quote.projectLocation}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{quote.productName}</div>
                    <div className="text-xs font-mono bg-gray-100 inline-block px-1.5 py-0.5 rounded mt-1">
                      {quote.quantityEstimate}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={quote.status} 
                      onValueChange={(v: any) => handleStatusChange(quote.id, v)}
                      disabled={!canEdit || updateStatus.isPending}
                    >
                      <SelectTrigger className={`w-32 h-8 text-xs font-bold border-0 ${
                        quote.status === 'new' ? 'bg-blue-100 text-blue-700' : 
                        quote.status === 'contacted' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">{t('جديد', 'New')}</SelectItem>
                        <SelectItem value="contacted">{t('تم التواصل', 'Contacted')}</SelectItem>
                        <SelectItem value="closed">{t('مغلق', 'Closed')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      onClick={() => handleDelete(quote.id)} disabled={!canEdit}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {quotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                    {t('لا توجد طلبات تسعير', 'No quotes found')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
