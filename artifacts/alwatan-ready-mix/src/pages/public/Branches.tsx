import { useLanguage } from '@/lib/i18n';
import { useListBranches } from '@workspace/api-client-react';
import { MapPin, Phone, Clock } from 'lucide-react';

export default function Branches() {
  const { t, language } = useLanguage();
  const { data: branches, isLoading } = useListBranches();

  if (isLoading) return <div className="min-h-screen p-20 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-card py-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-secondary mb-4">
            {t('فروعنا ومحطات الخلط', 'Our Branches & Batching Plants')}
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
            {t('تغطي محطاتنا الاستراتيجية كافة أنحاء منطقة الرياض لضمان سرعة التوريد وتلبية احتياجات المشاريع بكفاءة عالية.', 'Our strategically located plants cover all of Riyadh region to ensure rapid supply and meet project needs with high efficiency.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {branches?.map(branch => (
            <div key={branch.id} className="bg-white p-8 rounded-2xl shadow-sm border border-border hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-secondary mb-4">
                {language === 'ar' ? branch.nameAr : branch.nameEn}
              </h3>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li className="flex gap-3">
                  <MapPin className="w-5 h-5 shrink-0 text-gray-400" />
                  <span>{language === 'ar' ? branch.addressAr : branch.addressEn}</span>
                </li>
                <li className="flex gap-3">
                  <Phone className="w-5 h-5 shrink-0 text-gray-400" />
                  <span dir="ltr">{branch.phone}</span>
                </li>
                <li className="flex gap-3">
                  <Clock className="w-5 h-5 shrink-0 text-gray-400" />
                  <span>{branch.workingHours}</span>
                </li>
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
