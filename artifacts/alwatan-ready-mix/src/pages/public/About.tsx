import { useLanguage } from '@/lib/i18n';
import { getGetPageContentQueryKey, useGetPageContent } from '@workspace/api-client-react';

export default function About() {
  const { t, language } = useLanguage();
  const { data: content, isLoading } = useGetPageContent('about', {
    query: { enabled: true, queryKey: getGetPageContentQueryKey('about') },
  });

  const getVal = (key: string) => {
    const item = content?.find(c => c.fieldKey === key);
    if (!item) return '';
    return language === 'ar' ? item.valueAr : item.valueEn;
  };

  if (isLoading) return <div className="min-h-screen p-20 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-card py-20">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-secondary mb-10">
          {getVal('title') || t('عن الشركة', 'About Us')}
        </h1>
        <div className="prose prose-lg dark:prose-invert font-medium text-muted-foreground mb-16" dangerouslySetInnerHTML={{ __html: getVal('story') }} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-muted p-10 rounded-3xl border border-border">
            <h2 className="text-2xl font-bold text-secondary mb-4">{t('رؤيتنا', 'Our Vision')}</h2>
            <p className="text-muted-foreground font-medium">{getVal('vision')}</p>
          </div>
          <div className="bg-primary/5 p-10 rounded-3xl border border-primary/20">
            <h2 className="text-2xl font-bold text-primary mb-4">{t('مهمتنا', 'Our Mission')}</h2>
            <p className="text-muted-foreground font-medium">{getVal('mission')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
