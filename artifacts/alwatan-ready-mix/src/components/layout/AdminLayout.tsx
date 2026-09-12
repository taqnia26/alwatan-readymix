import { useLanguage } from '@/lib/i18n';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, FileText, MessageSquare, Settings, LogOut, Package, MapPin,
  Image as ImageIcon, Users, Award, BookOpen, Send
} from 'lucide-react';
import { useGetAuthMe, useLogout } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t, isRtl } = useLanguage();
  const [location, setLocation] = useLocation();
  const { data: me } = useGetAuthMe();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const menuItems = [
    { href: '/admin', icon: LayoutDashboard, label: t('لوحة التحكم', 'Dashboard') },
    { href: '/admin/quotes', icon: MessageSquare, label: t('طلبات التسعير', 'Quotes') },
    { href: '/admin/messages', icon: Send, label: t('رسائل التواصل', 'Messages') },
    { href: '/admin/content', icon: FileText, label: t('إدارة المحتوى', 'Content') },
    { href: '/admin/products', icon: Package, label: t('المنتجات', 'Products') },
    { href: '/admin/branches', icon: MapPin, label: t('الفروع', 'Branches') },
    { href: '/admin/articles', icon: BookOpen, label: t('المقالات', 'Articles') },
    { href: '/admin/certificates', icon: Award, label: t('الشهادات', 'Certificates') },
    { href: '/admin/media', icon: ImageIcon, label: t('الوسائط', 'Media') },
    { href: '/admin/users', icon: Users, label: t('المستخدمين', 'Users') },
    { href: '/admin/settings', icon: Settings, label: t('الإعدادات', 'Settings') },
  ];

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation('/admin/login');
      },
      onError: () => {
        toast({ title: t('خطأ في تسجيل الخروج', 'Logout error'), variant: 'destructive' });
      }
    });
  };

  const activeMenu = menuItems.find(m => m.href === location) || menuItems.find(m => location.startsWith(m.href) && m.href !== '/admin');

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className={`w-20 md:w-64 bg-secondary text-white flex flex-col shadow-xl flex-shrink-0 z-20 ${isRtl ? 'border-l' : 'border-r'} border-secondary/20`}>
        <div className="p-3 md:p-6 bg-secondary flex items-center justify-center border-b border-white/10 h-20">
          <div className="text-sm md:text-xl font-black text-primary bg-white px-2 md:px-4 py-1 rounded">ALWATAN</div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1 custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeMenu?.href === item.href;
            return (
               <Link 
                key={item.href} 
                href={item.href}
                 className={`flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-3 rounded-lg transition-colors font-medium ${
                  active ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                 <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-white/10 flex flex-col gap-2">
          <Link href="/" className="flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-3 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <LayoutDashboard className="w-5 h-5" />
            <span className="hidden md:inline">{t('العودة للموقع', 'Back to Site')}</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center md:justify-start w-full gap-3 px-3 md:px-4 py-3 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 text-start"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden md:inline">{t('تسجيل الخروج', 'Logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white shadow-sm h-20 px-4 md:px-8 flex justify-between items-center z-10 flex-shrink-0 border-b">
          <h1 className="text-lg md:text-2xl font-bold text-secondary">
            {activeMenu?.label || t('لوحة التحكم', 'Dashboard')}
          </h1>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-semibold text-sm text-secondary">{me?.user?.name || 'Admin User'}</span>
              <span className="text-xs text-gray-500">{me?.user?.role || 'Administrator'}</span>
            </div>
            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold uppercase">
              {me?.user?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
