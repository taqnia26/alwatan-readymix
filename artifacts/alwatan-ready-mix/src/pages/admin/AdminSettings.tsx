import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useGetAdminSettings, useUpdateAdminSettings } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import { getGetAdminSettingsQueryKey } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

export default function AdminSettings() {
  const { t, isRtl } = useLanguage();
  const { data: settings, isLoading } = useGetAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      setFormData(settings as Record<string, string>);
    }
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(
      { data: formData },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAdminSettingsQueryKey() });
          toast({ title: t('تم حفظ الإعدادات', 'Settings saved') });
        }
      }
    );
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-secondary">{t('إعدادات الموقع', 'Site Settings')}</h2>
        <p className="text-gray-500 text-sm">
          {t('تحديث معلومات التواصل والروابط العامة', 'Update contact info and public links')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary">{t('رقم الواتساب', 'WhatsApp Number')}</label>
            <Input 
              dir="ltr" 
              value={formData.whatsapp || ''} 
              onChange={e => handleChange('whatsapp', e.target.value)} 
              placeholder="+9665..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary">{t('هاتف المبيعات', 'Sales Phone')}</label>
            <Input 
              dir="ltr" 
              value={formData.phone || ''} 
              onChange={e => handleChange('phone', e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary">{t('البريد الإلكتروني', 'Email')}</label>
            <Input 
              dir="ltr" 
              type="email"
              value={formData.email || ''} 
              onChange={e => handleChange('email', e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary">{t('بريد طلبات التسعير', 'Quote Email')}</label>
            <Input 
              dir="ltr" 
              type="email"
              value={formData.quoteEmail || ''} 
              onChange={e => handleChange('quoteEmail', e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary">{t('رابط انستقرام', 'Instagram URL')}</label>
            <Input 
              dir="ltr" 
              value={formData.instagramUrl || ''} 
              onChange={e => handleChange('instagramUrl', e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary">{t('رابط لينكد إن', 'LinkedIn URL')}</label>
            <Input 
              dir="ltr" 
              value={formData.linkedinUrl || ''} 
              onChange={e => handleChange('linkedinUrl', e.target.value)} 
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <Button type="submit" className="gap-2 bg-primary hover:bg-primary/90 min-w-32" disabled={updateSettings.isPending}>
            <Save className="w-4 h-4" />
            {updateSettings.isPending ? t('جاري الحفظ...', 'Saving...') : t('حفظ الإعدادات', 'Save Settings')}
          </Button>
        </div>
      </form>
    </div>
  );
}
