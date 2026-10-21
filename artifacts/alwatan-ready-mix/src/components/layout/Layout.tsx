import { useEffect, useState, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { Menu, X, Globe, Building, FileText, MessageCircle } from 'lucide-react';
import { useGetPublicSettings } from '@workspace/api-client-react';
import { useLanguage } from '@/lib/i18n';
import { usePublicStudio } from '@/hooks/use-public-studio';
import { pick } from '@/lib/studio';
import logoAsset from '@assets/ChatGPT_Image_9_يوليو_2026،_04_29_03_م_1787598723614.png';
import SiteFooter from '@/components/public/SiteFooter';
import SmartLink from '@/components/public/SmartLink';
import SiteActivityTracker from '@/components/SiteActivityTracker';
import { trackSiteActivity } from '@/lib/site-activity';
import WebChatWidget from '@/components/public/WebChatWidget';
import BrandEnergyLines from '@/components/public/BrandEnergyLines';

export default function Layout({ children }: { children: ReactNode }) {
  const { t, language, setLanguage } = useLanguage();
  const [location] = useLocation();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bannerHidden, setBannerHidden] = useState(() => sessionStorage.getItem('banner-hidden') === '1');
  const { data: settings } = useGetPublicSettings();
  const { data: studio } = usePublicStudio();
  const b = studio?.branding;

  useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }); }, [location]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const phone = b?.phone || settings?.phone || '059 599 9659';
  const email = b?.email || settings?.email || 'info@alwatan2030.com';
  const wa = (b?.whatsapp || settings?.whatsapp || '966595999659').replace(/\D/g, '');
  const waUrl = `https://wa.me/${wa}?text=${encodeURIComponent(t('مرحبًا، أرغب في الاستفسار عن خدمات شركة الوطن للخرسانة الجاهزة.', 'Hello, I would like to inquire about AlWatan Ready-Mix services.'))}`;
  const nav = (studio?.navigation ?? []).filter((n) => n.visible);
  const banner = studio?.banners.find((x) => x.enabled && pick(language, x.textAr, x.textEn));
  const isActive = (href: string) => (href === '/' ? location === '/' : location === href || location.startsWith(href + '/'));
  const toggleLang = () => setLanguage(language === 'ar' ? 'en' : 'ar');

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteActivityTracker />
      {banner && !bannerHidden && (
        <div className="relative bg-primary text-white" data-testid="banner-marketing">
          <div className="container mx-auto flex items-center justify-center gap-3 px-10 py-2 text-center text-sm font-bold">
            {banner.href ? <SmartLink href={banner.href} className="hover:underline">{pick(language, banner.textAr, banner.textEn)}</SmartLink> : <span>{pick(language, banner.textAr, banner.textEn)}</span>}
          </div>
          <button type="button" aria-label={t('إغلاق', 'Dismiss')} onClick={() => { sessionStorage.setItem('banner-hidden', '1'); setBannerHidden(true); }} className="absolute end-3 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-white/20"><X className="h-4 w-4" /></button>
        </div>
      )}
      <div className="flex items-center justify-between bg-secondary px-6 py-2 text-sm font-medium text-secondary-foreground">
        <span className="truncate">{b ? pick(language, b.nameAr, b.nameEn) : t('شركة مصنع الوطن للخرسانة الجاهزة', 'AlWatan Ready-Mix Concrete Co.')}</span>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="transition-colors hover:text-primary">{t('دخول الموظفين', 'Staff Login')}</Link>
          <button onClick={toggleLang} className="flex items-center gap-2 transition-colors hover:text-primary" data-testid="button-language"><Globe className="h-4 w-4" />{language === 'ar' ? 'English' : 'العربية'}</button>
        </div>
      </div>

      <header className={`sticky top-0 z-50 bg-card/95 backdrop-blur transition-shadow ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className={`container mx-auto flex items-center justify-between px-6 transition-all ${scrolled ? 'py-2' : 'py-4'}`}>
          <Link href="/" className="flex items-center gap-3"><img src={b?.logoUrl || logoAsset} alt={b ? pick(language, b.nameAr, b.nameEn) : 'AlWatan'} className={`w-auto object-contain transition-all ${scrolled ? 'h-10' : 'h-12'}`} /></Link>
          <nav className="hidden items-center gap-5 lg:flex xl:gap-7">
            {nav.map((l) => (
              <Link key={l.id} href={l.href} className={`relative py-1 text-sm font-semibold transition-colors hover:text-primary xl:text-base ${isActive(l.href) ? 'text-primary' : 'text-foreground'}`}>
                {pick(language, l.labelAr, l.labelEn)}
                {isActive(l.href) && <motion.span layoutId="nav-underline" className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary" transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }} />}
              </Link>
            ))}
            <Link href="/company-profile" className="inline-flex h-10 items-center gap-2 rounded-md border border-primary/40 px-4 text-sm font-bold text-primary hover:bg-primary/10">{t('الملف التعريفي', 'Company Profile')}<FileText className="h-4 w-4" /></Link>
            <SmartLink href="/quote" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white hover:bg-primary/90">{t('اطلب تسعيرة', 'Request a Quote')}<Building className="h-4 w-4" /></SmartLink>
          </nav>
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open} data-testid="button-mobile-menu">{open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t bg-card lg:hidden">
              <div className="flex flex-col gap-1 p-4">
                {nav.map((l) => <Link key={l.id} href={l.href} className={`rounded-md p-3 font-semibold ${isActive(l.href) ? 'bg-primary/10 text-primary' : ''}`}>{pick(language, l.labelAr, l.labelEn)}</Link>)}
                <Link href="/company-profile" className="rounded-md border border-primary/40 p-3 text-center font-bold text-primary">{t('الملف التعريفي', 'Company Profile')}</Link>
                <SmartLink href="/quote" className="rounded-md bg-primary p-3 text-center font-bold text-white">{t('اطلب تسعيرة', 'Request a Quote')}</SmartLink>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative flex-1">
        {children}
        {location !== '/' && location !== '/about' && location !== '/company-profile' && !location.startsWith('/p/') && (
          <BrandEnergyLines key={location} variant="page" />
        )}
      </main>
      <SiteFooter branding={b} nav={nav} phone={phone} email={email} />

      <WebChatWidget />
      <a href={waUrl} target="_blank" rel="noreferrer" onClick={() => trackSiteActivity('whatsapp_click')} aria-label={t('تواصل معنا عبر واتساب', 'Contact us on WhatsApp')} data-testid="link-whatsapp"
        className="pulse-ring group fixed bottom-5 end-5 z-[60] flex items-center gap-3 rounded-full bg-[#25D366] p-3 text-white shadow-[0_12px_35px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-1 hover:bg-[#20bd5a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/35 md:px-5">
        <MessageCircle className="h-7 w-7 fill-current" />
        <span className="hidden font-bold md:inline">{t('تواصل عبر واتساب', 'Chat on WhatsApp')}</span>
      </a>
    </div>
  );
}
