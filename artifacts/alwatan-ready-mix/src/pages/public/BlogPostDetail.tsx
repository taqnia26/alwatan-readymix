import { useLanguage } from '@/lib/i18n';
import { getGetBlogPostQueryKey, useGetBlogPost } from '@workspace/api-client-react';
import { useParams, Link } from 'wouter';
import { format } from 'date-fns';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import qualityImg from '@assets/Generated_Image_July_29,_2026_-_4_33AM_1787598707000.png';

export default function BlogPostDetail() {
  const { slug } = useParams();
  const { t, language, isRtl } = useLanguage();
  const postSlug = slug || '';
  const { data: post, isLoading } = useGetBlogPost(postSlug, {
    query: { enabled: !!slug, queryKey: getGetBlogPostQueryKey(postSlug) },
  });

  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

  if (isLoading) return <div className="min-h-screen p-20 text-center">Loading...</div>;
  if (!post) return <div className="min-h-screen p-20 text-center">Not Found</div>;

  return (
    <div className="min-h-screen bg-card py-20">
      <div className="container mx-auto px-6 max-w-4xl">
        <Link href="/blog" className="inline-flex items-center text-primary font-bold mb-10 hover:underline">
          <ArrowIcon className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          {t('العودة للمركز الإعلامي', 'Back to Media Center')}
        </Link>
        
        <div className="mb-12">
          <div className="text-primary font-bold mb-4">
            {format(new Date(post.publishedAt || new Date()), 'dd MMMM yyyy')}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-secondary mb-8 leading-tight">
            {language === 'ar' ? post.titleAr : post.titleEn}
          </h1>
          <img src={post.coverImage || qualityImg} alt="cover" className="w-full h-[500px] object-cover rounded-3xl mb-12 shadow-lg" />
        </div>

        <div className="prose prose-xl dark:prose-invert font-medium max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: language === 'ar' ? post.contentAr : post.contentEn }} />
      </div>
    </div>
  );
}
