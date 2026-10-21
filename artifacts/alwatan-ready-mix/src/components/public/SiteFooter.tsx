import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'wouter';
import { ArrowUp, Mail, MapPin, Phone, Globe } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import type { StudioBranding, StudioNavItem } from '@workspace/api-client-react';
import { useLanguage } from '@/lib/i18n';
import { pick } from '@/lib/studio';
import logoAsset from '@assets/ChatGPT_Image_9_يوليو_2026،_04_29_03_م_1787598723614.png';
import BrandEnergyLines from './BrandEnergyLines';

export default function SiteFooter({ branding, nav, phone, email }: { branding?: StudioBranding; nav: StudioNavItem[]; phone: string; email: string }) {
  const { t, language } = useLanguage();
  const reduce = useReducedMotion();
  const name = branding ? pick(language, branding.nameAr, branding.nameEn) : '';
  const footerText = branding ? pick(language, branding.footerAr, branding.footerEn) : '';
  const socials = [
    { href: branding?.facebook, Icon: FaFacebookF, label: 'Facebook' },
    { href: branding?.instagram, Icon: FaInstagram, label: 'Instagram' },
    { href: branding?.linkedin, Icon: FaLinkedinIn, label: 'LinkedIn' },
  ].filter((s) => s.href);
  const col = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } } };

  return (
    <footer className="relative overflow-hidden bg-secondary text-secondary-foreground">
      <div className="h-1 w-full flow-line" />
      <div className="pointer-events-none absolute inset-0 grid-blueprint opacity-40" />
      <BrandEnergyLines variant="footer" />
      <div className="pointer-events-none absolute -bottom-10 start-0 select-none whitespace-nowrap text-[18vw] font-black leading-none text-white/[0.03]" aria-hidden>ALWATAN</div>
      <motion.div className="container relative mx-auto grid gap-12 px-6 py-16 md:grid-cols-12" initial={reduce ? false : 'hidden'} whileInView="show" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.12 }}>
        <motion.div variants={col} className="md:col-span-5">
          <img src={branding?.logoUrl || logoAsset} alt={name} className="mb-6 h-16 w-auto rounded bg-white p-2 object-contain" />
          <p className="max-w-md font-medium leading-loose text-white/75">{footerText}</p>
          {socials.length > 0 && (
            <div className="mt-6 flex gap-3">
              {socials.map(({ href, Icon, label }) => (
                <motion.a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} whileHover={reduce ? undefined : { y: -4, scale: 1.08 }} whileTap={{ scale: 0.95 }}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-primary hover:bg-primary"><Icon className="h-4 w-4" /></motion.a>
              ))}
            </div>
          )}
        </motion.div>
        <motion.div variants={col} className="md:col-span-3">
          <h4 className="mb-6 text-lg font-extrabold text-accent">{t('روابط سريعة', 'Quick Links')}</h4>
          <ul className="space-y-3 font-medium text-white/75">
            {nav.map((n) => (
              <li key={n.id}>
                <Link href={n.href} className="group inline-flex items-center gap-2 transition-all hover:text-white hover:ps-2">
                  <span className="h-px w-0 bg-primary transition-all group-hover:w-4" />{pick(language, n.labelAr, n.labelEn)}
                </Link>
              </li>
            ))}
            <li><Link href="/company-profile" className="group inline-flex items-center gap-2 transition-all hover:text-white hover:ps-2"><span className="h-px w-0 bg-primary transition-all group-hover:w-4" />{t('الملف التعريفي', 'Company Profile')}</Link></li>
          </ul>
        </motion.div>
        <motion.div variants={col} className="md:col-span-4">
          <h4 className="mb-6 text-lg font-extrabold text-accent">{t('تواصل معنا', 'Contact Us')}</h4>
          <ul className="space-y-4 font-medium text-white/75">
            <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" />{t('الرياض، المملكة العربية السعودية', 'Riyadh, Saudi Arabia')}</li>
            <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /><a href={`mailto:${email}`} className="hover:text-white">{email}</a></li>
            {[phone, branding?.phone2, branding?.phone3, branding?.phone4].filter((value): value is string => Boolean(value?.trim())).map((value, i) => (
              <li key={i} className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /><a href={`tel:${value.replace(/[^+\d]/g, '')}`} dir="ltr" className="hover:text-white" data-testid={`link-footer-phone-${i + 1}`}>{value}</a></li>
            ))}
            <li className="flex items-center gap-3"><Globe className="h-4 w-4 text-primary" /><a href="https://www.alwatan2030.com" target="_blank" rel="noreferrer" dir="ltr" className="hover:text-white">www.alwatan2030.com</a></li>
          </ul>
        </motion.div>
      </motion.div>
      <div className="relative border-t border-white/10">
        <div className="container mx-auto flex items-center justify-between gap-4 px-6 py-5 text-sm text-white/55">
          <p>© {new Date().getFullYear()} {name || t('شركة مصنع الوطن للخرسانة الجاهزة', 'AlWatan Ready-Mix Concrete Co.')}. {t('جميع الحقوق محفوظة.', 'All rights reserved.')}</p>
          <motion.button type="button" onClick={() => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })} whileHover={reduce ? undefined : { y: -3 }} aria-label={t('العودة للأعلى', 'Back to top')} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 hover:bg-primary hover:border-primary"><ArrowUp className="h-4 w-4" /></motion.button>
        </div>
      </div>
    </footer>
  );
}
