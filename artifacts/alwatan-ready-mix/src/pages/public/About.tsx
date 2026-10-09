import BrandEnergyLines from '@/components/public/BrandEnergyLines';
import { useLanguage } from '@/lib/i18n';
import { useGetPageContent } from '@workspace/api-client-react';
import DOMPurify from 'dompurify';
import { Building2, Target, Eye, ShieldCheck } from 'lucide-react';

export default function About() {
  const { t, isRtl } = useLanguage();
  const { data: pageContent, isLoading } = useGetPageContent('about');

  const getContent = (sectionKey: string, fieldKey: string) => {
    if (!pageContent) return '';
    const item = pageContent.find(c => c.sectionKey === sectionKey && c.fieldKey === fieldKey);
    return item ? (isRtl ? item.valueAr : item.valueEn) : '';
  };

  const getCleanHtml = (html: string) => {
    return { __html: DOMPurify.sanitize(html) };
  };

  const storyContent = getContent('story', 'content') || t('تأسست شركة الوطن للخرسانة الجاهزة...', 'AlWatan Ready-Mix was established...');
  const visionContent = getContent('vision', 'content') || t('أن نكون الشركة الرائدة...', 'To be the leading company...');
  const missionContent = getContent('mission', 'content') || t('تقديم منتجات خرسانية عالية الجودة...', 'Providing high quality concrete products...');

  return (
    <div className="bg-gray-50 min-h-screen pt-20 pb-24">
      {/* Hero Header */}
      <div className="bg-secondary text-white py-24 mb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/construction-1.png')] bg-cover bg-center mix-blend-overlay"></div>
        <BrandEnergyLines />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
            {t('عن شركة الوطن', 'About AlWatan')}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t('رواد صناعة الخرسانة الجاهزة في المملكة العربية السعودية', 'Pioneers of Ready-Mix Concrete in Saudi Arabia')}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 space-y-24">
        
        {/* Story Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="aspect-square bg-gray-200 rounded-3xl overflow-hidden shadow-2xl relative">
              <img 
                src="/construction-1.png"
                alt={t('مصنع الوطن للخرسانة الجاهزة', 'AlWatan Ready-Mix Factory')}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-primary rounded-full blur-3xl opacity-20 z-0"></div>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-secondary">
                {getContent('story', 'title') || t('قصتنا', 'Our Story')}
              </h2>
            </div>
            <div 
              className="prose prose-lg prose-gray max-w-none prose-headings:text-secondary prose-a:text-primary"
              dangerouslySetInnerHTML={getCleanHtml(storyContent)} 
            />
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 hover:border-primary/30 transition-colors group">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
              <Eye className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-secondary mb-4">
              {getContent('vision', 'title') || t('رؤيتنا', 'Our Vision')}
            </h2>
            <div 
              className="text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={getCleanHtml(visionContent)} 
            />
          </div>

          <div className="bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 hover:border-primary/30 transition-colors group">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 mb-6 group-hover:scale-110 transition-transform">
              <Target className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-secondary mb-4">
              {getContent('mission', 'title') || t('مهمتنا', 'Our Mission')}
            </h2>
            <div 
              className="text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={getCleanHtml(missionContent)} 
            />
          </div>
        </section>

        {/* Quality Section */}
        <section className="bg-secondary text-white rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <ShieldCheck className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-3xl font-bold">{t('الالتزام بالجودة', 'Commitment to Quality')}</h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              {t(
                'نحن نطبق أعلى معايير الجودة العالمية في جميع مراحل الإنتاج، من اختيار المواد الخام وحتى تسليم الخرسانة في موقع المشروع.',
                'We apply the highest international quality standards in all stages of production, from selecting raw materials to delivering concrete at the project site.'
              )}
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
