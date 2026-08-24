import { useLanguage } from '@/lib/i18n';
import { useListQuotes, useUpdateQuoteStatus } from '@workspace/api-client-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { getListQuotesQueryKey } from '@workspace/api-client-react';

export default function AdminQuotes() {
  const { t } = useLanguage();
  const { data: quotes, isLoading } = useListQuotes();
  const updateStatus = useUpdateQuoteStatus();
  const queryClient = useQueryClient();

  const handleStatusChange = (id: number, status: 'new' | 'contacted' | 'closed') => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: (updatedQuote) => {
          queryClient.setQueryData(getListQuotesQueryKey(), (old: any) => 
            old?.map((q: any) => q.id === id ? updatedQuote : q)
          );
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
            <TableHead>{t('التاريخ', 'Date')}</TableHead>
            <TableHead>{t('العميل', 'Client')}</TableHead>
            <TableHead>{t('المشروع', 'Project')}</TableHead>
            <TableHead>{t('المنتج', 'Product')}</TableHead>
            <TableHead>{t('الكمية', 'Quantity')}</TableHead>
            <TableHead>{t('الحالة', 'Status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes?.map(quote => (
            <TableRow key={quote.id}>
              <TableCell>{format(new Date(quote.createdAt), 'yyyy-MM-dd')}</TableCell>
              <TableCell>
                <div className="font-bold">{quote.fullName}</div>
                <div className="text-sm text-gray-500">{quote.phone}</div>
              </TableCell>
              <TableCell>{quote.projectLocation}</TableCell>
              <TableCell>{quote.productName}</TableCell>
              <TableCell>{quote.quantityEstimate}</TableCell>
              <TableCell>
                <Select 
                  value={quote.status} 
                  onValueChange={(v: any) => handleStatusChange(quote.id, v)}
                  disabled={updateStatus.isPending}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
