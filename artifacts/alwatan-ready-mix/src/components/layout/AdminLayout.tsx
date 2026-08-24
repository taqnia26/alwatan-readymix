import { useLanguage } from '@/lib/i18n';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, FileText, MessageSquare, Settings, LogOut, Package, MapPin } from 'lucide-react';
import logo from '@assets/ChatGPT_Image_9_يوليو_2026،_04_29_03_م_1787598723614.png';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t, isRtl } = useLanguage();
  const [location] = useLocation();

  const menuItems = [
    { href: '/admin', icon: LayoutDashboard, label: t('لوحة التحكم', 'Dashboard') },
    { href: '/admin/quotes', icon: MessageSquare, label: t('طلبات التسعير', 'Quotes') },
    { href: '/admin/content', icon: FileText, label: t('إدارة المحتوى', 'Content') },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className={`w-64 bg-secondary text-white flex flex-col shadow-xl ${isRtl ? 'border-l' : 'border-r'} border-secondary/20`}>
        <div className="p-6 bg-secondary flex items-center justify-center border-b border-white/10">
          <img src={logo} alt="Logo" className="h-12 object-contain bg-white rounded p-1" />
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                  active ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
            <span>{t('العودة للموقع', 'Back to Site')}</span>
          </Link>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center z-10">
          <h1 className="text-2xl font-bold text-secondary">
            {menuItems.find(m => m.href === location)?.label || t('إدارة', 'Admin')}
          </h1>
          <div className="flex items-center gap-4">
            {/* simple header info */}
            <span className="font-semibold text-sm text-gray-500">Admin User</span>
            <div className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold">
              A
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
