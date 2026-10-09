import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/lib/i18n';
import { PageHead, StudioGate } from '@/components/admin/studio-ui';
import PageBuilder from '@/components/admin/PageBuilder';
import HomeSectionManager from '@/components/admin/HomeSectionManager';

export default function AdminPages() {
  const { t } = useLanguage();
  return (
    <StudioGate>
      {(cfg) => (
        <div className="space-y-5">
          <PageHead title={t('منشئ الصفحات والصفحة الرئيسية', 'Page builder & homepage')} desc={t('عدّل المسودة ثم انشرها. الزوار لا يرون شيئا قبل النشر.', 'Edit the draft, then publish. Visitors see nothing until you publish.')} />
          <Tabs defaultValue="home">
            <TabsList>
              <TabsTrigger value="home" data-testid="tab-home">{t('أقسام الرئيسية', 'Home sections')}</TabsTrigger>
              <TabsTrigger value="pages" data-testid="tab-pages">{t('الصفحات', 'Pages')} ({cfg.pages.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="home" className="mt-4"><HomeSectionManager cfg={cfg} /></TabsContent>
            <TabsContent value="pages" className="mt-4"><PageBuilder cfg={cfg} /></TabsContent>
          </Tabs>
        </div>
      )}
    </StudioGate>
  );
}
