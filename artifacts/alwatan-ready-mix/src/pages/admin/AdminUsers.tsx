import { useState } from 'react';
import { ACCESS_RESOURCES, ACCESS_ROLES, ALL_PERMISSIONS, defaultPermissions } from '@workspace/api-zod';
import { Checkbox } from '@/components/ui/checkbox';
import { useAdminAccess } from '@/hooks/use-admin-access';
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
  role: z.string().default('viewer'),
  isActive: z.boolean().default(true),
  permissions: z.array(z.string()).default([]),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function AdminUsers() {
  const { t, isRtl } = useLanguage();
  const { data: users, isLoading } = useListAdminUsers();
  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();
  const updateStatus = useSetAdminUserStatus();
  const changePassword = useChangeAdminUserPassword();
  
  const { user: me, isAdmin } = useAdminAccess();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPwdDialogOpen, setIsPwdDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { username: '', name: '', email: '', password: '', role: 'viewer', isActive: true, permissions: defaultPermissions('viewer') }
  });

  const openCreate = () => {
    setEditingId(null);
    form.reset({ username: '', name: '', email: '', password: '', role: 'viewer', isActive: true, permissions: defaultPermissions('viewer') });
    setIsDialogOpen(true);
  };

  const errMsg = (e: unknown) => {
    const err = e as { data?: { error?: string; message?: string } | null; message?: string };
    return err?.data?.error || err?.data?.message || err?.message || t('حدث خطأ غير متوقع', 'Unexpected error');
  };
  const fail = (e: unknown) => toast({ title: t('فشلت العملية', 'Operation failed'), description: errMsg(e), variant: 'destructive' });
  const isSelf = (id: number | null) => !!id && me?.id === id;

  const openEdit = (user: any) => {
    setEditingId(user.id);
    form.reset({
      username: user.username ?? '', name: user.name, email: user.email,
      role: user.role, isActive: user.isActive, permissions: user.permissions ?? [], password: ''
    });
    setIsDialogOpen(true);
  };

  const openPassword = (id: number) => {
    setEditingId(id);
    setNewPassword('');
    setIsPwdDialogOpen(true);
  };

  const onSubmit = (data: UserFormValues) => {
    if (!isAdmin) return;
    if (editingId) {
      const { password: _pw, username: _un, ...rest } = data;
      const updateData = { ...rest, permissions: data.role === 'admin' ? ALL_PERMISSIONS : data.permissions };
      updateUser.mutate({ id: editingId, data: updateData }, {
        onError: fail,
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
      createUser.mutate({ data: { ...data, password: data.password, permissions: data.role === 'admin' ? ALL_PERMISSIONS : data.permissions } }, {
        onError: fail,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
          setIsDialogOpen(false);
          toast({ title: t('تمت الإضافة', 'Created') });
        }
      });
    }
  };

  const handlePasswordSubmit = () => {
    if (!isAdmin || !editingId || !newPassword) return;
    changePassword.mutate({ id: editingId, data: { password: newPassword } }, {
      onError: fail,
      onSuccess: () => {
        setIsPwdDialogOpen(false);
        toast({ title: t('تم تغيير كلمة المرور', 'Password changed') });
      }
    });
  };

  const toggleStatus = (id: number, currentStatus: boolean) => {
    if (isSelf(id)) return;
    updateStatus.mutate({ id, data: { isActive: !currentStatus } }, {
      onError: fail,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
      }
    });
  };

  if (!isAdmin && !isLoading) { /* read-only view */ }
  if (isLoading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-secondary">{t('مدراء النظام', 'Admin Users')}</h2>
        </div>
        <Button onClick={openCreate} disabled={!isAdmin} data-testid="button-new-user" className="gap-2 bg-primary hover:bg-primary/90">
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
                    <Shield className="w-3 h-3" /> {(() => { const r = ACCESS_ROLES.find((x) => x.key === user.role); return r ? t(r.ar, r.en) : user.role; })()}
                  </span>
                </TableCell>
                <TableCell>
                  <Switch 
                    checked={user.isActive} 
                    onCheckedChange={() => toggleStatus(user.id, user.isActive)} 
                    disabled={!isAdmin || isSelf(user.id) || updateStatus.isPending}
                    data-testid={`switch-user-status-${user.id}`}
                  />
                </TableCell>
                <TableCell className="text-end">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(user)} disabled={!isAdmin} data-testid={`button-edit-user-${user.id}`} title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-orange-500 hover:text-orange-600 hover:bg-orange-50" onClick={() => openPassword(user.id)} disabled={!isAdmin} data-testid={`button-password-user-${user.id}`} title="Change Password">
                    <KeyRound className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
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
                  <Select value={field.value} disabled={isSelf(editingId)} onValueChange={(v) => {
                    field.onChange(v);
                    form.setValue('permissions', v === 'admin' ? ALL_PERMISSIONS : defaultPermissions(v), { shouldDirty: true });
                  }}>
                    <FormControl><SelectTrigger data-testid="select-user-role"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ACCESS_ROLES.map((r) => <SelectItem key={r.key} value={r.key} data-testid={`option-role-${r.key}`}>{t(r.ar, r.en)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {isSelf(editingId) && <p className="text-xs text-muted-foreground">{t('لا يمكنك تغيير دورك أو تعطيل حسابك.', 'You cannot change your own role or disable your own account.')}</p>}
                <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0">
                  <FormControl><Switch checked={field.value} disabled={isSelf(editingId)} onCheckedChange={field.onChange} data-testid="switch-user-active" /></FormControl>
                  <FormLabel className="!mt-0">{t('الحساب مفعّل', 'Account active')}</FormLabel>
                </FormItem>
              )} />
              <FormField control={form.control} name="permissions" render={({ field }) => {
                const isAdminRole = form.watch('role') === 'admin';
                const perms: string[] = isAdminRole ? ALL_PERMISSIONS : field.value;
                const toggle = (key: string, on: boolean) => {
                  if (isAdminRole) return;
                  const [res, kind] = key.split(':');
                  let next = new Set(perms);
                  if (on) { next.add(key); if (kind === 'edit') next.add(`${res}:view`); }
                  else { next.delete(key); if (kind === 'view') next.delete(`${res}:edit`); }
                  field.onChange(Array.from(next));
                };
                return (
                  <FormItem>
                    <FormLabel>{t('الصلاحيات', 'Permissions')}</FormLabel>
                    <p className="text-xs text-muted-foreground">{isAdminRole
                      ? t('مدير النظام يملك كل الصلاحيات دون قيود.', 'Administrators have unrestricted access to everything.')
                      : t('اختيار دور يملأ الصلاحيات الافتراضية ويمكنك تخصيصها. "تعديل" تشمل الإضافة والتحديث والحذف.', 'Choosing a role fills its defaults; customize freely. "Edit" includes create, update and delete.')}</p>
                    <div className="rounded-lg border divide-y" data-testid="grid-permissions">
                      <div className="grid grid-cols-[1fr_72px_72px] gap-2 bg-muted/50 px-3 py-2 text-xs font-bold">
                        <span>{t('القسم', 'Section')}</span><span className="text-center">{t('عرض', 'View')}</span><span className="text-center">{t('تعديل', 'Edit')}</span>
                      </div>
                      {ACCESS_RESOURCES.map((r) => (
                        <div key={r.key} className="grid grid-cols-[1fr_72px_72px] items-center gap-2 px-3 py-2 text-sm">
                          <span>{t(r.ar, r.en)}</span>
                          <span className="flex justify-center"><Checkbox checked={perms.includes(`${r.key}:view`)} disabled={isAdminRole} onCheckedChange={(v) => toggle(`${r.key}:view`, v === true)} data-testid={`checkbox-perm-${r.key}-view`} /></span>
                          <span className="flex justify-center">{r.key === 'users'
                            ? <span className="text-xs text-muted-foreground">-</span>
                            : <Checkbox checked={perms.includes(`${r.key}:edit`)} disabled={isAdminRole} onCheckedChange={(v) => toggle(`${r.key}:edit`, v === true)} data-testid={`checkbox-perm-${r.key}-edit`} />}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 px-3 py-2 text-sm">
                        <Checkbox checked={perms.includes('studio:publish')} disabled={isAdminRole} onCheckedChange={(v) => toggle('studio:publish', v === true)} data-testid="checkbox-perm-studio-publish" />
                        <span>{t('نشر تغييرات الموقع للزوار', 'Publish site changes to visitors')}</span>
                      </div>
                    </div>
                  </FormItem>
                );
              }} />

              <Button type="submit" className="w-full mt-4" disabled={!isAdmin || createUser.isPending || updateUser.isPending} data-testid="button-save-user">{t('حفظ', 'Save')}</Button>
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
            <Button onClick={handlePasswordSubmit} className="w-full" disabled={!isAdmin || !newPassword || changePassword.isPending}>
              {t('حفظ', 'Save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
