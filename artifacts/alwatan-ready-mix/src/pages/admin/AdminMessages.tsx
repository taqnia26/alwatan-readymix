import { useLanguage } from '@/lib/i18n';
import { useListContactMessages, useUpdateContactMessageStatus, useDeleteContactMessage } from '@workspace/api-client-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { getListContactMessagesQueryKey } from '@workspace/api-client-react';
import { Trash2, Mail, Phone, MessageSquareText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AdminMessages() {
  const { t, isRtl } = useLanguage();
  const { data: paginatedData, isLoading } = useListContactMessages();
  const updateStatus = useUpdateContactMessageStatus();
  const deleteMessage = useDeleteContactMessage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusChange = (id: number, status: string) => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListContactMessagesQueryKey() });
          toast({ title: t('تم تحديث الحالة', 'Status updated') });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete?'))) return;
    deleteMessage.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListContactMessagesQueryKey() });
          toast({ title: t('تم الحذف', 'Deleted') });
        }
      }
    );
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  const messages = paginatedData?.items || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-bold text-secondary">{t('رسائل التواصل', 'Contact Messages')}</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>{t('التاريخ', 'Date')}</TableHead>
                <TableHead>{t('المرسل', 'Sender')}</TableHead>
                <TableHead>{t('الموضوع', 'Subject')}</TableHead>
                <TableHead>{t('الحالة', 'Status')}</TableHead>
                <TableHead className="text-end">{t('إجراءات', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map(msg => (
                <TableRow key={msg.id} className={`hover:bg-gray-50/50 ${msg.status === 'new' ? 'bg-blue-50/30' : ''}`}>
                  <TableCell className="whitespace-nowrap text-sm text-gray-500 font-mono">
                    {format(new Date(msg.createdAt), 'yyyy-MM-dd HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-secondary">{msg.fullName}</div>
                    <div className="text-xs text-gray-500 flex flex-col gap-1 mt-1">
                      <a href={`mailto:${msg.email}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Mail className="w-3 h-3" /> {msg.email}
                      </a>
                      {msg.phone && (
                        <a href={`tel:${msg.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                          <Phone className="w-3 h-3" /> <span className="font-mono">{msg.phone}</span>
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate font-medium">
                    {msg.subject || t('بدون موضوع', 'No subject')}
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={msg.status} 
                      onValueChange={(v: string) => handleStatusChange(msg.id, v)}
                      disabled={updateStatus.isPending}
                    >
                      <SelectTrigger className={`w-28 h-8 text-xs font-bold border-0 ${
                        msg.status === 'new' ? 'bg-blue-100 text-blue-700' : 
                        msg.status === 'read' ? 'bg-green-100 text-green-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">{t('جديد', 'New')}</SelectItem>
                        <SelectItem value="read">{t('مقروء', 'Read')}</SelectItem>
                        <SelectItem value="archived">{t('مؤرشف', 'Archived')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-end">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10">
                          <MessageSquareText className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent dir={isRtl ? 'rtl' : 'ltr'}>
                        <DialogHeader>
                          <DialogTitle>{msg.subject || t('رسالة جديدة', 'New Message')}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <div className="bg-gray-50 p-3 rounded-lg flex flex-col gap-1 text-sm border">
                            <span className="font-bold text-secondary">{msg.fullName}</span>
                            <span className="text-gray-500 font-mono">{msg.email} | {msg.phone}</span>
                          </div>
                          <div className="text-gray-700 bg-white border rounded-lg p-4 min-h-[100px] whitespace-pre-wrap">
                            {msg.message}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 ml-1"
                      onClick={() => handleDelete(msg.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {messages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                    {t('لا توجد رسائل', 'No messages found')}
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
