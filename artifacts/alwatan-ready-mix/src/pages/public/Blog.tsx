import { useLanguage } from '@/lib/i18n';
import { useListBlogPosts } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import qualityImg from '@assets/Generated_Image_July_29,_2026_-_4_33AM_1787598707000.png';

export default function Blog() {
  const { t, language } = useLanguage();
  const { data: posts, isLoading } = useListBlogPosts();

  if (isLoading) return <div className="min-h-screen p-20 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-card py-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-secondary mb-4">
            {t('المركز الإعلامي', 'Media Center')}
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
            {t('أحدث الأخبار، المقالات، والتطورات في مجال صناعة الخرسانة الجاهزة.', 'Latest news, articles, and developments in the ready-mix concrete industry.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts?.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-xl transition-shadow h-full flex flex-col">
                <div className="h-56 bg-muted">
                  <img src={post.coverImage || qualityImg} alt="cover" className="w-full h-full object-cover" />
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="text-sm text-gray-400 mb-3 font-bold">
                    {format(new Date(post.publishedAt || new Date()), 'dd MMM yyyy')}
                  </div>
                  <h3 className="text-2xl font-bold text-secondary mb-4">
                    {language === 'ar' ? post.titleAr : post.titleEn}
                  </h3>
                  <p className="text-muted-foreground font-medium line-clamp-3 mb-6 flex-1">
                    {language === 'ar' ? post.excerptAr : post.excerptEn}
                  </p>
                  <div className="text-primary font-bold">
                    {t('اقرأ المزيد', 'Read More')}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
