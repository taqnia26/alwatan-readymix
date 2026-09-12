import { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useCreateQuote, useListProducts, useGetPublicSettings } from '@workspace/api-client-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Calculator, MapPin, Send, CheckCircle2, PhoneCall } from 'lucide-react';
import { Link } from 'wouter';

export default function Quote() {
  const { t, isRtl } = useLanguage();
  const { data: products } = useListProducts();
  const { data: settings } = useGetPublicSettings();
  const createQuote = useCreateQuote();

  const [formData, setFormData] = useState({
    productId: '',
    quantityEstimate: '',
    projectLocation: '',
    fullName: '',
    phone: '',
    email: '',
    notes: ''
  });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createQuote.mutate(
      { data: { ...formData, productId: Number(formData.productId) } },
      {
        onSuccess: () => setSuccess(true),
      }
    );
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-xl shadow-gray-200/50 animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-secondary mb-4">
            {t('تم استلام طلبك!', 'Request Received!')}
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {t(
              'شكراً لثقتكم بشركة الوطن. سيقوم فريق المبيعات بالتواصل معكم قريباً لتقديم عرض السعر المناسب.',
              'Thank you for trusting AlWatan. Our sales team will contact you shortly with a tailored quote.'
            )}
          </p>
          <Link href="/">
            <Button className="w-full h-12 text-lg">{t('العودة للرئيسية', 'Back to Home')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Info Sidebar */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-black text-secondary mb-4">
                {t('طلب تسعير', 'Request a Quote')}
              </h1>
              <p className="text-gray-600 text-lg">
                {t(
                  'نقدم أسعاراً تنافسية لجميع مشاريعكم. املأ النموذج وسنرد عليكم بأسرع وقت.',
                  'We offer competitive prices for all your projects. Fill the form and we will reply ASAP.'
                )}
              </p>
            </div>

            <div className="bg-secondary text-white p-8 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full blur-3xl opacity-50"></div>
              <div className="relative z-10 space-y-6">
                <h3 className="text-xl font-bold">{t('المبيعات المباشرة', 'Direct Sales')}</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <PhoneCall className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-1">{t('اتصل بنا الآن', 'Call us now')}</p>
                    <a href={`tel:${settings?.phone || '059 599 9659'}`} className="text-2xl font-mono font-bold hover:text-primary transition-colors" dir="ltr">
                      {settings?.phone || '059 599 9659'}
                    </a>
                  </div>
                </div>
                <hr className="border-white/10" />
                <p className="text-sm text-gray-400">
                  {t('ساعات العمل: السبت - الخميس (٨ صباحاً - ٥ مساءً)', 'Working Hours: Sat - Thu (8 AM - 5 PM)')}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Project Details */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-secondary border-b pb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  {t('تفاصيل المشروع', 'Project Details')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">{t('المنتج المطلوب', 'Required Product')} *</label>
                    <Select required value={formData.productId} onValueChange={(v) => setFormData({...formData, productId: v})}>
                      <SelectTrigger className="h-12 bg-gray-50 border-gray-200">
                        <SelectValue placeholder={t('اختر المنتج', 'Select Product')} />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map(p => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {isRtl ? p.nameAr : p.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">{t('الكمية التقديرية', 'Estimated Quantity')} *</label>
                    <div className="relative">
                      <Input 
                        required 
                        placeholder="e.g. 500" 
                        value={formData.quantityEstimate}
                        onChange={e => setFormData({...formData, quantityEstimate: e.target.value})}
                        className="h-12 bg-gray-50 border-gray-200 pr-12"
                        dir="ltr"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">
                        m³
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-gray-700">{t('موقع المشروع', 'Project Location')} *</label>
                    <div className="relative">
                      <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input 
                        required 
                        value={formData.projectLocation}
                        onChange={e => setFormData({...formData, projectLocation: e.target.value})}
                        className={`h-12 bg-gray-50 border-gray-200 ${isRtl ? 'pr-10' : 'pl-10'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-6 pt-4">
                <h3 className="text-xl font-bold text-secondary border-b pb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  {t('بيانات التواصل', 'Contact Details')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">{t('الاسم الكريم', 'Full Name')} *</label>
                    <Input 
                      required 
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                      className="h-12 bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">{t('رقم الجوال', 'Phone Number')} *</label>
                    <Input 
                      required 
                      dir="ltr"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="h-12 bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-gray-700">{t('البريد الإلكتروني', 'Email')} *</label>
                    <Input 
                      required 
                      type="email" 
                      dir="ltr"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="h-12 bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-gray-700">{t('ملاحظات إضافية', 'Additional Notes')}</label>
                    <Textarea 
                      rows={4}
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      className="bg-gray-50 border-gray-200 resize-none"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:-translate-y-1 transition-transform"
                disabled={createQuote.isPending}
              >
                {createQuote.isPending ? (
                   <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
                    {t('إرسال طلب التسعير', 'Submit Quote Request')}
                  </div>
                )}
              </Button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
