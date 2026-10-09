import { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { trackSiteActivity } from '@/lib/site-activity';
import { useCreateContactMessage, useGetPublicSettings } from '@workspace/api-client-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const { t, isRtl } = useLanguage();
  const { data: settings } = useGetPublicSettings();
  const createMessage = useCreateContactMessage();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    
    createMessage.mutate(
      { data: formData },
      {
        onSuccess: () => {
          trackSiteActivity('contact_submit');
          setSuccess(true);
          setFormData({ fullName: '', email: '', phone: '', subject: '', message: '' });
          setTimeout(() => setSuccess(false), 5000);
        },
        onError: () => {
          setError(true);
        }
      }
    );
  };

  return (
    <div className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-secondary mb-4">
            {t('تواصل معنا', 'Contact Us')}
          </h1>
          <p className="text-gray-600">
            {t(
              'نحن هنا للرد على استفساراتكم وتلبية احتياجات مشاريعكم من الخرسانة الجاهزة',
              'We are here to answer your inquiries and meet your ready-mix concrete needs'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-start">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-secondary mb-2">{t('المركز الرئيسي', 'Head Office')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('طريق الخرج، المدينة الصناعية الجديدة', 'Al-Kharj Road, New Industrial City')}<br />
                  {t('الرياض، المملكة العربية السعودية', 'Riyadh, Saudi Arabia')}
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-start">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-secondary mb-2">{t('أرقام التواصل', 'Contact Numbers')}</h3>
                <p className="text-gray-600 text-sm font-mono" dir="ltr">
                  {settings?.phone || '059 599 9659'}
                </p>
                <p className="text-gray-600 text-sm font-mono mt-1" dir="ltr">
                  {settings?.whatsapp || '059 599 9659'} (WhatsApp)
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-start">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-secondary mb-2">{t('البريد الإلكتروني', 'Email')}</h3>
                <a href={`mailto:${settings?.email || 'info@alwatan-readymix.com'}`} className="text-gray-600 text-sm font-mono hover:text-primary transition-colors">
                  {settings?.email || 'info@alwatan-readymix.com'}
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-xl shadow-xl shadow-gray-200/50 border border-gray-100">
            {success ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 animate-in fade-in zoom-in duration-500">
                <CheckCircle2 className="w-20 h-20 text-green-500" />
                <h3 className="text-2xl font-bold text-secondary">
                  {t('تم إرسال رسالتك بنجاح', 'Message sent successfully')}
                </h3>
                <p className="text-gray-500">
                  {t('سنتواصل معك في أقرب وقت ممكن', 'We will get back to you as soon as possible')}
                </p>
                <Button onClick={() => setSuccess(false)} variant="outline" className="mt-4">
                  {t('إرسال رسالة أخرى', 'Send another message')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="text-2xl font-bold text-secondary mb-6">
                  {t('أرسل لنا رسالة', 'Send us a message')}
                </h3>
                
                {error && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                    {t('حدث خطأ أثناء الإرسال، يرجى المحاولة مرة أخرى', 'An error occurred while sending, please try again')}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">{t('الاسم الكامل', 'Full Name')} <span className="text-red-500">*</span></label>
                    <Input 
                      required 
                      value={formData.fullName} 
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })} 
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">{t('البريد الإلكتروني', 'Email')} <span className="text-red-500">*</span></label>
                    <Input 
                      required 
                      type="email" 
                      dir="ltr"
                      value={formData.email} 
                      onChange={e => setFormData({ ...formData, email: e.target.value })} 
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">{t('رقم الجوال', 'Phone Number')}</label>
                    <Input 
                      dir="ltr"
                      value={formData.phone} 
                      onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">{t('الموضوع', 'Subject')}</label>
                    <Input 
                      value={formData.subject} 
                      onChange={e => setFormData({ ...formData, subject: e.target.value })} 
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">{t('الرسالة', 'Message')} <span className="text-red-500">*</span></label>
                  <Textarea 
                    required 
                    rows={6}
                    value={formData.message} 
                    onChange={e => setFormData({ ...formData, message: e.target.value })} 
                    className="bg-gray-50 resize-none"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20"
                  disabled={createMessage.isPending}
                >
                  {createMessage.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
                      {t('إرسال الرسالة', 'Send Message')}
                    </div>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
