import { useLanguage } from '@/lib/i18n';
import { useGetPublicSettings } from '@workspace/api-client-react';
import { MapPin, Phone, Mail, Instagram, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function Contact() {
  const { t } = useLanguage();
  const { data: settings } = useGetPublicSettings();

  return (
    <div className="min-h-screen bg-card py-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-secondary mb-4">
            {t('تواصل معنا', 'Contact Us')}
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
            {t('نحن دائماً مستعدون للإجابة على استفساراتكم وتقديم الدعم اللازم.', 'We are always ready to answer your inquiries and provide necessary support.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-1 space-y-8">
            <div className="bg-muted p-8 rounded-3xl border border-border">
              <h3 className="text-2xl font-bold text-secondary mb-6">{t('معلومات التواصل', 'Contact Info')}</h3>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <MapPin className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <h4 className="font-bold text-secondary mb-1">{t('العنوان', 'Address')}</h4>
                    <p className="text-muted-foreground font-medium">الرياض، المملكة العربية السعودية</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Phone className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <h4 className="font-bold text-secondary mb-1">{t('الهاتف', 'Phone')}</h4>
                    <p className="text-muted-foreground font-medium" dir="ltr">{settings?.phone || '+966 50 000 0000'}</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Mail className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <h4 className="font-bold text-secondary mb-1">{t('البريد الإلكتروني', 'Email')}</h4>
                    <p className="text-muted-foreground font-medium">{settings?.email || 'info@alwatanreadymix.com'}</p>
                  </div>
                </li>
              </ul>
              
              <div className="mt-8 pt-8 border-t border-border flex gap-4">
                {settings?.instagramUrl && (
                  <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-secondary hover:text-primary hover:shadow-md transition-all">
                    <Instagram className="w-6 h-6" />
                  </a>
                )}
                {settings?.linkedinUrl && (
                  <a href={settings.linkedinUrl} target="_blank" rel="noreferrer" className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-secondary hover:text-primary hover:shadow-md transition-all">
                    <Linkedin className="w-6 h-6" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-10 rounded-3xl shadow-sm border border-border">
            <h3 className="text-2xl font-bold text-secondary mb-8">{t('أرسل رسالة', 'Send a Message')}</h3>
            <form className="space-y-6" onSubmit={e => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-bold text-sm text-secondary">{t('الاسم', 'Name')}</label>
                  <Input className="h-12 bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-sm text-secondary">{t('البريد الإلكتروني', 'Email')}</label>
                  <Input className="h-12 bg-muted/50" type="email" dir="ltr" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-bold text-sm text-secondary">{t('الموضوع', 'Subject')}</label>
                <Input className="h-12 bg-muted/50" />
              </div>
              <div className="space-y-2">
                <label className="font-bold text-sm text-secondary">{t('الرسالة', 'Message')}</label>
                <Textarea className="min-h-[150px] bg-muted/50" />
              </div>
              <Button size="lg" className="h-14 px-10 font-bold text-lg">
                {t('إرسال', 'Send')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
