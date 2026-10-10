import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/lib/i18n';
import { PageHead, StudioGate } from '@/components/admin/studio-ui';
import PageBuilder from '@/components/admin/PageBuilder';
import HomeSectionManager from '@/components/admin/HomeSectionManager';
import { Link } from 'wouter';

export default function AdminPages({ initialTab = 'home' }: { initialTab?: 'home' | 'pages' } = {}) {
  const { t } = useLanguage();
  return (
    <StudioGate>
      {(cfg) => (
        <div className="space-y-5">
          <PageHead title={t('منشئ الصفحات والصفحة الرئيسية', 'Page builder & homepage')} desc={t('عدّل المسودة ثم انشرها. الزوار لا يرون شيئا قبل النشر.', 'Edit the draft, then publish. Visitors see nothing until you publish.')} />
          <div className="rounded-xl border bg-card p-4">
            <p className="mb-3 text-sm text-muted-foreground">{t('من نحن والصفحات الجديدة تُحرر أدناه. صفحات المنتجات والفروع والشهادات والمقالات مرتبطة بأقسام إدارتها:', 'Edit About and custom pages below. Data pages are connected to their management sections:')}</p>
            <div className="flex flex-wrap gap-3">{[
              ['/admin/products', t('المنتجات', 'Products')], ['/admin/branches', t('الفروع', 'Branches')],
              ['/admin/certificates', t('الشهادات', 'Certificates')], ['/admin/articles', t('المقالات', 'Articles')],
              ['/admin/branding', t('الهوية والتواصل والقائمة', 'Brand, contact & navigation')],
            ].map(([href, label]) => <Link key={href} href={href} className="rounded-md border px-3 py-2 text-sm font-bold text-primary hover:bg-primary/5">{label}</Link>)}</div>
          </div>
          <Tabs defaultValue={initialTab}>
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
