import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, FileText, MessageSquare, Settings, LogOut, Package, MapPin, Image as ImageIcon, Users, Award, BookOpen, Send,
  Menu, Globe, LayoutTemplate, GalleryHorizontal, Megaphone, Palette, ExternalLink, MessagesSquare,
} from 'lucide-react';
import { useGetAuthMe, useLogout } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useLanguage } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { useAdminAccess } from '@/hooks/use-admin-access';
import { ACCESS_ROLES } from '@workspace/api-zod';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { t, isRtl, language, setLanguage } = useLanguage();
  const [location, setLocation] = useLocation();
  const { data: me } = useGetAuthMe();
  const access = useAdminAccess();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const allGroups = [
    { title: t('نظرة عامة', 'Overview'), items: [{ href: '/admin', icon: LayoutDashboard, label: t('لوحة التحكم', 'Dashboard') }] },
    { title: t('استوديو الموقع', 'Site studio'), items: [
      { href: '/admin/pages', icon: LayoutTemplate, label: t('الصفحات والرئيسية', 'Pages & Home') },
      { href: '/admin/sliders', icon: GalleryHorizontal, label: t('الشرائح والفيديو', 'Sliders & Video') },
      { href: '/admin/marketing', icon: Megaphone, label: t('التسويق', 'Marketing') },
      { href: '/admin/branding', icon: Palette, label: t('الهوية والقائمة', 'Branding & Nav') },
      { href: '/admin/content', icon: FileText, label: t('نصوص المحتوى', 'Content text') },
      { href: '/admin/media', icon: ImageIcon, label: t('الوسائط', 'Media') },
    ] },
    { title: t('الكتالوج', 'Catalog'), items: [
      { href: '/admin/products', icon: Package, label: t('المنتجات', 'Products') },
      { href: '/admin/articles', icon: BookOpen, label: t('المقالات', 'Articles') },
      { href: '/admin/certificates', icon: Award, label: t('الشهادات', 'Certificates') },
      { href: '/admin/branches', icon: MapPin, label: t('الفروع', 'Branches') },
    ] },
    { title: t('الوارد', 'Inbox'), items: [
      { href: '/admin/quotes', icon: MessageSquare, label: t('طلبات التسعير', 'Quotes') },
      { href: '/admin/chats', icon: MessagesSquare, label: t('المحادثات المباشرة', 'Live chats') },
      { href: '/admin/messages', icon: Send, label: t('رسائل التواصل', 'Messages') },
    ] },
    { title: t('النظام', 'System'), items: [
      { href: '/admin/users', icon: Users, label: t('المستخدمون', 'Users') },
      { href: '/admin/settings', icon: Settings, label: t('الإعدادات', 'Settings') },
    ] },
  ];
  const groups = allGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => access.canAccessPath(i.href)) }))
    .filter((g) => g.items.length > 0);
  const roleInfo = ACCESS_ROLES.find((r) => r.key === me?.user?.role);
  const roleLabel = roleInfo ? t(roleInfo.ar, roleInfo.en) : me?.user?.role;
  const all = groups.flatMap((g) => g.items);
  const activeMenu = all.find((m) => m.href === location) || all.find((m) => m.href !== '/admin' && location.startsWith(m.href));

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => { queryClient.clear(); setLocation('/admin/login'); },
      onError: () => toast({ title: t('خطأ في تسجيل الخروج', 'Logout error'), variant: 'destructive' }),
    });
  };

  const Nav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col bg-secondary text-white">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-black">W</div>
        <div className="leading-tight"><div className="text-sm font-black tracking-wide">ALWATAN</div><div className="text-[11px] text-white/55">{t('لوحة الإدارة', 'Admin console')}</div></div>
      </div>
      <nav className="admin-scrollbar admin-scrollbar--dark flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-white/40">{g.title}</div>
            <div className="space-y-0.5">
              {g.items.map((item) => {
                const active = activeMenu?.href === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={onNavigate} data-testid={`nav-${item.href.replace('/admin/', '') || 'dashboard'}`}
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${active ? 'text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'}`}>
                    {active && <motion.span layoutId="admin-active" className="absolute inset-0 rounded-lg bg-primary" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                    <Icon className="relative h-[18px] w-[18px]" />
                    <span className="relative">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="shrink-0 space-y-0.5 border-t border-white/10 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/65 hover:bg-white/5 hover:text-white"><ExternalLink className="h-[18px] w-[18px]" />{t('العودة للموقع', 'Back to site')}</Link>
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm font-semibold text-white/65 hover:bg-red-500/15 hover:text-red-300" data-testid="button-logout"><LogOut className="h-[18px] w-[18px]" />{t('تسجيل الخروج', 'Logout')}</button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background text-foreground" dir={isRtl ? 'rtl' : 'ltr'}>
      <aside className="hidden w-64 shrink-0 lg:block"><Nav /></aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={isRtl ? 'right' : 'left'} className="w-72 border-0 p-0 [&>button]:text-white">
          <SheetTitle className="sr-only">{t('القائمة', 'Menu')}</SheetTitle>
          <SheetDescription className="sr-only">{t('التنقل في لوحة الإدارة', 'Admin navigation')}</SheetDescription>
          <Nav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-card px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-md p-2 hover:bg-muted lg:hidden" onClick={() => setOpen(true)} aria-label={t('فتح القائمة', 'Open menu')} data-testid="button-admin-menu"><Menu className="h-5 w-5" /></button>
            <h1 className="text-lg font-extrabold text-secondary md:text-xl">{activeMenu?.label || t('لوحة التحكم', 'Dashboard')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-bold hover:bg-muted" data-testid="button-admin-language"><Globe className="h-4 w-4" />{language === 'ar' ? 'EN' : 'عربي'}</button>
            <div className="hidden flex-col items-end leading-tight sm:flex"><span className="text-sm font-bold text-secondary">{me?.user?.name || 'Admin'}</span><span className="text-xs text-muted-foreground" data-testid="text-user-role">{roleLabel}</span></div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold uppercase text-white">{me?.user?.name?.charAt(0) || 'A'}</div>
          </div>
        </header>
        <div className="admin-scrollbar relative flex-1 overflow-y-auto bg-muted/40 p-4 md:p-8">
          <motion.div key={location} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mx-auto max-w-7xl">{children}</motion.div>
        </div>
      </main>
    </div>
  );
}
