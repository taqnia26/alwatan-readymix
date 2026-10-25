import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/lib/i18n';
import { getGetAuthMeQueryKey, useLogin } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { ACCESS_RESOURCES, hasPermission } from '@workspace/api-zod';
import { RESOURCE_PATHS } from '@/hooks/use-admin-access';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const { t, isRtl } = useLanguage();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const login = useLogin();
  const { toast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { data: { username, password } },
      {
        onSuccess: async (session) => {
          // A cached anonymous response (or an older in-flight /auth/me)
          // must not send the newly authenticated user back to this page.
          const queryKey = getGetAuthMeQueryKey();
          await queryClient.cancelQueries();
          queryClient.clear();
          queryClient.setQueryData(queryKey, { user: session.user });
          const u = session.user as { role: string; permissions?: string[] | null };
          const first = ACCESS_RESOURCES.find((r) => hasPermission(u, `${r.key}:view`));
          setLocation(first ? RESOURCE_PATHS[first.key] : '/admin');
        },
        onError: (error) => {
          toast({ 
            title: t('فشل تسجيل الدخول', 'Login failed'),
            description: error.status === 401
              ? t('تأكد من صحة اسم المستخدم وكلمة المرور', 'Check your username and password')
              : t('تعذر إكمال تسجيل الدخول. يرجى إعادة المحاولة بعد قليل.', 'Unable to complete sign-in. Please try again shortly.'),
            variant: 'destructive' 
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4 relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-block text-3xl font-black text-primary bg-gray-100 px-6 py-2 rounded-lg mb-4">
            ALWATAN
          </div>
          <h1 className="text-2xl font-bold text-secondary mb-2">
            {t('تسجيل الدخول للإدارة', 'Admin Login')}
          </h1>
          <p className="text-gray-500 text-sm">
            {t('نظام إدارة المحتوى والعمليات', 'Content and Operations Management System')}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="admin-username" className="text-sm font-bold text-secondary">
              {t('اسم المستخدم', 'Username')}
            </label>
            <Input 
              id="admin-username"
              name="username"
              autoComplete="username"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="h-12 bg-gray-50 border-gray-200"
              dir="ltr"
              placeholder="admin"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="admin-password" className="text-sm font-bold text-secondary">
              {t('كلمة المرور', 'Password')}
            </label>
            <Input 
              id="admin-password"
              name="password"
              autoComplete="current-password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-12 bg-gray-50 border-gray-200"
              dir="ltr"
              placeholder="••••••••"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-bold"
            disabled={login.isPending}
          >
            {login.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              t('دخول', 'Login')
            )}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} AlWatan Ready-Mix
        </div>
      </div>
    </div>
  );
}
