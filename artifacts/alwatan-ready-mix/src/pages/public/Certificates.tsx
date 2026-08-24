import { useLanguage } from '@/lib/i18n';
import { useListCertificates } from '@workspace/api-client-react';

export default function Certificates() {
  const { t, language } = useLanguage();
  const { data: certs, isLoading } = useListCertificates();

  if (isLoading) return <div className="min-h-screen p-20 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-muted/30 py-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-secondary mb-4">
            {t('الاعتمادات والشهادات', 'Accreditations & Certificates')}
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
            {t('نحن فخورون بحصولنا على أعلى شهادات الجودة والاعتمادات من الجهات الحكومية والخاصة.', 'We are proud to hold the highest quality certificates and accreditations from governmental and private entities.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {certs?.map(cert => (
            <div key={cert.id} className="bg-card flex flex-col sm:flex-row gap-6 p-6 rounded-2xl shadow-sm border border-border">
              <div className="w-full sm:w-48 h-48 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                {cert.imageUrl ? (
                  <img src={cert.imageUrl} alt={language === 'ar' ? cert.titleAr : cert.titleEn} className="w-full h-full object-contain p-4 mix-blend-multiply" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-secondary mb-2">
                  {language === 'ar' ? cert.titleAr : cert.titleEn}
                </h3>
                <p className="text-sm text-primary font-bold mb-4">{cert.issuedBy}</p>
                <p className="text-muted-foreground font-medium">
                  {language === 'ar' ? cert.descriptionAr : cert.descriptionEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
