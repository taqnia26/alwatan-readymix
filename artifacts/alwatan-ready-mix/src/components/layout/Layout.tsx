import { useLanguage } from '@/lib/i18n';
import { Link, useLocation } from 'wouter';
import { Menu, X, Globe, Building, FileText, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import logo from '@assets/ChatGPT_Image_9_يوليو_2026،_04_29_03_م_1787598723614.png';
import { Button } from '@/components/ui/button';
import { useGetPublicSettings } from '@workspace/api-client-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, language, setLanguage, isRtl } = useLanguage();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: settings } = useGetPublicSettings();

  const phone = settings?.phone || '059 599 9659';
  const email = settings?.email || 'info@alwatan2030.com';
  const whatsappNumber = (settings?.whatsapp || '966595999659').replace(/\D/g, '');
  const whatsappMessage = t(
    'مرحبًا، أرغب في الاستفسار عن خدمات شركة الوطن للخرسانة الجاهزة.',
    'Hello, I would like to inquire about AlWatan Ready-Mix services.',
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const toggleLang = () => setLanguage(language === 'ar' ? 'en' : 'ar');

  const navLinks = [
    { href: '/', label: t('الرئيسية', 'Home') },
    { href: '/about', label: t('من نحن', 'About Us') },
    { href: '/products', label: t('منتجاتنا', 'Products') },
    { href: '/certificates', label: t('الاعتمادات', 'Certificates') },
    { href: '/branches', label: t('الفروع', 'Branches') },
    { href: '/blog', label: t('المركز الإعلامي', 'Media Center') },
    { href: '/contact', label: t('تواصل معنا', 'Contact') },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Bar */}
      <div className="bg-secondary text-secondary-foreground py-2 px-6 flex justify-between items-center text-sm font-medium">
        <div className="flex gap-4">
          <span>{t('شركة مصنع الوطن للخرسانة الجاهزة', 'AlWatan Ready-Mix Concrete Co.')}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="hover:text-primary transition-colors">
            {t('دخول الموظفين', 'Staff Login')}
          </Link>
          <button onClick={toggleLang} className="flex items-center gap-2 hover:text-primary transition-colors">
            <Globe className="w-4 h-4" />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src={logo} alt="AlWatan Logo" className="h-12 w-auto object-contain" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`text-sm xl:text-base font-semibold transition-colors hover:text-primary ${
                  location === link.href ? 'text-primary border-b-2 border-primary pb-1' : 'text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/company-profile">
              <Button variant="outline" className="font-bold gap-2 border-primary/40 text-primary hover:bg-primary/10">
                {t('الملف التعريفي', 'Company Profile')}
                <FileText className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/quote">
              <Button className="font-bold gap-2">
                {t('اطلب تسعيرة', 'Request a Quote')}
                <Building className="w-4 h-4" />
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-card border-t border-border p-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block font-semibold p-2 rounded-md ${
                  location === link.href ? 'bg-primary/10 text-primary' : 'text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/company-profile" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full font-bold gap-2 border-primary/40 text-primary">
                {t('الملف التعريفي', 'Company Profile')}
                <FileText className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/quote" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full font-bold gap-2">
                {t('اطلب تسعيرة', 'Request a Quote')}
              </Button>
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-secondary text-secondary-foreground py-16 px-6">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <img src={logo} alt="AlWatan Logo" className="h-16 w-auto object-contain mb-6 bg-white p-2 rounded" />
            <p className="max-w-md text-secondary-foreground/80 leading-relaxed font-medium">
              {t(
                'الوطن للخرسانة الجاهزة هي إحدى الشركات الرائدة في مجال صناعة الخرسانة الجاهزة في المملكة العربية السعودية، نقدم حلولاً مبتكرة ومستدامة تلبي أعلى معايير الجودة للمشاريع الإنشائية.',
                'AlWatan Ready-Mix is a leading ready-mix concrete supplier in Saudi Arabia, providing innovative and sustainable solutions that meet the highest quality standards for construction projects.'
              )}
            </p>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-6 text-primary">{t('روابط سريعة', 'Quick Links')}</h4>
            <ul className="space-y-4 font-medium text-secondary-foreground/80">
              <li><Link href="/about" className="hover:text-primary transition-colors">{t('عن الشركة', 'About Company')}</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors">{t('المنتجات', 'Products')}</Link></li>
              <li><Link href="/certificates" className="hover:text-primary transition-colors">{t('الاعتمادات', 'Certificates')}</Link></li>
              <li><Link href="/company-profile" className="hover:text-primary transition-colors">{t('الملف التعريفي', 'Company Profile')}</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">{t('اتصل بنا', 'Contact Us')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-6 text-primary">{t('تواصل معنا', 'Contact Us')}</h4>
            <ul className="space-y-4 font-medium text-secondary-foreground/80">
              <li>{t('الرياض، المملكة العربية السعودية', 'Riyadh, Saudi Arabia')}</li>
              <li><a href={`mailto:${email}`} className="hover:text-primary transition-colors">{email}</a></li>
              <li><a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-primary transition-colors" dir="ltr">{phone}</a></li>
              <li><a href="https://www.alwatan2030.com" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors" dir="ltr">www.alwatan2030.com</a></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto mt-12 pt-8 border-t border-secondary-foreground/20 text-center text-sm text-secondary-foreground/60">
          <p>© {new Date().getFullYear()} {t('شركة مصنع الوطن للخرسانة الجاهزة. جميع الحقوق محفوظة.', 'AlWatan Ready-Mix Concrete Co. All rights reserved.')}</p>
        </div>
      </footer>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={t('تواصل معنا عبر واتساب', 'Contact us on WhatsApp')}
        className="group fixed bottom-5 right-5 z-[60] flex items-center gap-3 rounded-full bg-[#25D366] p-3 text-white shadow-[0_12px_35px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-1 hover:bg-[#20bd5a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/35 md:px-5"
      >
        <MessageCircle className="h-7 w-7 fill-current" />
        <span className="hidden font-bold md:inline">{t('تواصل عبر واتساب', 'Chat on WhatsApp')}</span>
      </a>
    </div>
  );
}
