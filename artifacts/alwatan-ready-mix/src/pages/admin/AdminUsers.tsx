import { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useListAdminUsers, useCreateAdminUser, useUpdateAdminUser, useSetAdminUserStatus, useChangeAdminUserPassword } from '@workspace/api-client-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import { getListAdminUsersQueryKey } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, KeyRound, Shield } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const userSchema = z.object({
  username: z.string().min(3),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().optional(),
  role: z.string().default('admin'),
  isActive: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function AdminUsers() {
  const { t, isRtl } = useLanguage();
  const { data: users, isLoading } = useListAdminUsers();
  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();
  const updateStatus = useSetAdminUserStatus();
  const changePassword = useChangeAdminUserPassword();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPwdDialogOpen, setIsPwdDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { username: '', name: '', email: '', password: '', role: 'admin', isActive: true }
  });

  const openCreate = () => {
    setEditingId(null);
    form.reset({ username: '', name: '', email: '', password: '', role: 'admin', isActive: true });
    setIsDialogOpen(true);
  };

  const openEdit = (user: any) => {
    setEditingId(user.id);
    form.reset({
      username: user.username, name: user.name, email: user.email, 
      role: user.role, isActive: user.isActive
    });
    setIsDialogOpen(true);
  };

  const openPassword = (id: number) => {
    setEditingId(id);
    setNewPassword('');
    setIsPwdDialogOpen(true);
  };

  const onSubmit = (data: UserFormValues) => {
    if (editingId) {
      const { password, ...updateData } = data;
      updateUser.mutate({ id: editingId, data: updateData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
          setIsDialogOpen(false);
          toast({ title: t('تم التحديث', 'Updated') });
        }
      });
    } else {
      if (!data.password) {
        form.setError('password', { message: 'Password required for new users' });
        return;
      }
      createUser.mutate({ data: data as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
          setIsDialogOpen(false);
          toast({ title: t('تمت الإضافة', 'Created') });
        }
      });
    }
  };

  const handlePasswordSubmit = () => {
    if (!editingId || !newPassword) return;
    changePassword.mutate({ id: editingId, data: { password: newPassword } }, {
      onSuccess: () => {
        setIsPwdDialogOpen(false);
        toast({ title: t('تم تغيير كلمة المرور', 'Password changed') });
      }
    });
  };

  const toggleStatus = (id: number, currentStatus: boolean) => {
    updateStatus.mutate({ id, data: { isActive: !currentStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
      }
    });
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-secondary">{t('مدراء النظام', 'Admin Users')}</h2>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          {t('مستخدم جديد', 'New User')}
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>{t('الاسم', 'Name')}</TableHead>
              <TableHead>{t('اسم المستخدم', 'Username')}</TableHead>
              <TableHead>{t('البريد', 'Email')}</TableHead>
              <TableHead>{t('الدور', 'Role')}</TableHead>
              <TableHead>{t('الحالة', 'Status')}</TableHead>
              <TableHead className="text-end">{t('إجراءات', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map(user => (
              <TableRow key={user.id} className="hover:bg-gray-50/50">
                <TableCell className="font-bold text-secondary">{user.name}</TableCell>
                <TableCell className="font-mono">{user.username}</TableCell>
                <TableCell className="text-gray-500">{user.email}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-max">
                    <Shield className="w-3 h-3" /> {user.role.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell>
                  <Switch 
                    checked={user.isActive} 
                    onCheckedChange={() => toggleStatus(user.id, user.isActive)} 
                    disabled={updateStatus.isPending}
                  />
                </TableCell>
                <TableCell className="text-end">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(user)} title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-orange-500 hover:text-orange-600 hover:bg-orange-50" onClick={() => openPassword(user.id)} title="Change Password">
                    <KeyRound className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{editingId ? t('تعديل مستخدم', 'Edit User') : t('مستخدم جديد', 'New User')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>{t('الاسم', 'Name')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem><FormLabel>{t('اسم المستخدم', 'Username')}</FormLabel><FormControl><Input {...field} dir="ltr" disabled={!!editingId} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>{t('البريد الإلكتروني', 'Email')}</FormLabel><FormControl><Input {...field} dir="ltr" type="email" /></FormControl><FormMessage /></FormItem>
              )} />
              {!editingId && (
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>{t('كلمة المرور', 'Password')}</FormLabel><FormControl><Input {...field} dir="ltr" type="password" /></FormControl><FormMessage /></FormItem>
                )} />
              )}
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem><FormLabel>{t('الدور', 'Role')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                <FormMessage /></FormItem>
              )} />
              
              <Button type="submit" className="w-full mt-4">{t('حفظ', 'Save')}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPwdDialogOpen} onOpenChange={setIsPwdDialogOpen}>
        <DialogContent className="max-w-sm" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('تغيير كلمة المرور', 'Change Password')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">{t('كلمة المرور الجديدة', 'New Password')}</label>
              <Input type="password" dir="ltr" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <Button onClick={handlePasswordSubmit} className="w-full" disabled={!newPassword || changePassword.isPending}>
              {t('حفظ', 'Save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
