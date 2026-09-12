import { useLanguage } from '@/lib/i18n';
import { useGetAdminSummary } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Package, MapPin, FileText, Settings, Users, Image as ImageIcon, Activity, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'wouter';

export default function AdminDashboard() {
  const { t, isRtl } = useLanguage();
  const { data: summary, isLoading } = useGetAdminSummary();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = [
    { title: t('طلبات تسعير جديدة', 'New Quotes'), value: summary?.newQuotes || 0, icon: MessageSquare, color: 'bg-blue-50 text-blue-600', link: '/admin/quotes' },
    { title: t('إجمالي الطلبات', 'Total Quotes'), value: summary?.totalQuotes || 0, icon: Activity, color: 'bg-green-50 text-green-600', link: '/admin/quotes' },
    { title: t('المنتجات', 'Products'), value: summary?.products || 0, icon: Package, color: 'bg-orange-50 text-orange-600', link: '/admin/products' },
    { title: t('الفروع', 'Branches'), value: summary?.branches || 0, icon: MapPin, color: 'bg-purple-50 text-purple-600', link: '/admin/branches' },
    { title: t('المقالات المنشورة', 'Published Posts'), value: summary?.publishedPosts || 0, icon: FileText, color: 'bg-indigo-50 text-indigo-600', link: '/admin/articles' },
  ];

  return (
    <div className="space-y-8">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link key={i} href={stat.link}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer border-gray-200 shadow-sm group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold text-gray-500 group-hover:text-secondary transition-colors">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-secondary">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-sm border-gray-200">
          <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-secondary">
              {t('أحدث طلبات التسعير', 'Recent Quotes')}
            </CardTitle>
            <Link href="/admin/quotes" className="text-sm text-primary font-bold flex items-center gap-1 hover:underline">
              {t('عرض الكل', 'View All')}
              <ArrowUpRight className={`w-4 h-4 ${isRtl ? '-scale-x-100' : ''}`} />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {summary?.recentQuotes?.map(quote => (
                <div key={quote.id} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="font-bold text-secondary">{quote.fullName}</h4>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">{quote.quantityEstimate}</span>
                      <span>{quote.productName}</span>
                    </p>
                  </div>
                  <div className="text-sm flex flex-col items-end gap-1">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                      quote.status === 'new' ? 'bg-blue-100 text-blue-700' : 
                      quote.status === 'contacted' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-green-100 text-green-700'
                    }`}>
                      {quote.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(quote.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              ))}
              {summary?.recentQuotes?.length === 0 && (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-gray-300" />
                  <p>{t('لا يوجد طلبات حديثة', 'No recent quotes')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="border-b border-gray-100 bg-secondary rounded-t-lg">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              {t('إدارة الموقع', 'Site Management')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {[
              { href: '/admin/media', icon: ImageIcon, ar: 'مكتبة الوسائط', en: 'Media Library' },
              { href: '/admin/users', icon: Users, ar: 'مستخدمو الإدارة', en: 'Admin Users' },
              { href: '/admin/settings', icon: Settings, ar: 'إعدادات الموقع', en: 'Site Settings' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3 text-secondary transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="flex items-center gap-3 font-bold">
                    <Icon className="h-5 w-5 text-primary" />
                    {t(item.ar, item.en)}
                  </span>
                  <ArrowUpRight className={`h-4 w-4 text-gray-400 ${isRtl ? '-scale-x-100' : ''}`} />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
