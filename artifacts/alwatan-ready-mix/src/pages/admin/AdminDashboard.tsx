import { useLanguage } from '@/lib/i18n';
import { useGetAdminSummary } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Package, MapPin, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const { t, language } = useLanguage();
  const { data: summary, isLoading } = useGetAdminSummary();

  if (isLoading) return <div className="p-8">Loading...</div>;

  const stats = [
    { title: t('طلبات تسعير جديدة', 'New Quotes'), value: summary?.newQuotes || 0, icon: MessageSquare, color: 'text-blue-500' },
    { title: t('المنتجات', 'Products'), value: summary?.products || 0, icon: Package, color: 'text-green-500' },
    { title: t('الفروع', 'Branches'), value: summary?.branches || 0, icon: MapPin, color: 'text-orange-500' },
    { title: t('المقالات المنشورة', 'Published Posts'), value: summary?.publishedPosts || 0, icon: FileText, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('أحدث طلبات التسعير', 'Recent Quotes')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary?.recentQuotes?.map(quote => (
              <div key={quote.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                <div>
                  <h4 className="font-bold">{quote.fullName}</h4>
                  <p className="text-sm text-gray-500">{quote.productName} - {quote.quantityEstimate}m³</p>
                </div>
                <div className="text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    quote.status === 'new' ? 'bg-red-100 text-red-700' : 
                    quote.status === 'contacted' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-green-100 text-green-700'
                  }`}>
                    {quote.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
            {summary?.recentQuotes?.length === 0 && (
              <p className="text-gray-500 text-center py-4">{t('لا يوجد طلبات حديثة', 'No recent quotes')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
