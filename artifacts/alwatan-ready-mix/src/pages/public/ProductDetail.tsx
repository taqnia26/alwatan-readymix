import { useLanguage } from '@/lib/i18n';
import { getGetProductQueryKey, useGetProduct } from '@workspace/api-client-react';
import { useParams, Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, CheckCircle2, Building, ShieldCheck } from 'lucide-react';
import qualityImg from '@assets/Generated_Image_July_29,_2026_-_4_33AM_1787598707000.png';

export default function ProductDetail() {
  const { slug } = useParams();
  const { t, language, isRtl } = useLanguage();
  const productSlug = slug || '';
  const { data: product, isLoading } = useGetProduct(productSlug, {
    query: { enabled: !!slug, queryKey: getGetProductQueryKey(productSlug) },
  });

  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-20">
        <Skeleton className="w-32 h-6 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="h-[500px] rounded-3xl" />
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-secondary mb-4">{t('لم يتم العثور على المنتج', 'Product Not Found')}</h2>
        <Link href="/products">
          <Button>{t('العودة للمنتجات', 'Back to Products')}</Button>
        </Link>
      </div>
    );
  }

  const name = language === 'ar' ? product.nameAr : product.nameEn;
  const description = language === 'ar' ? product.descriptionAr : product.descriptionEn;
  const specs = language === 'ar' ? product.specsAr : product.specsEn;

  return (
    <div className="min-h-screen bg-card py-16">
      <div className="container mx-auto px-6">
        <Link href="/products" className="inline-flex items-center text-primary font-bold mb-10 hover:underline">
          <ArrowIcon className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          {t('العودة للمنتجات', 'Back to Products')}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="rounded-3xl overflow-hidden shadow-2xl relative sticky top-32">
            <img 
              src={product.imageUrl || qualityImg} 
              alt={name} 
              className="w-full h-auto aspect-square object-cover"
            />
            <div className="absolute top-6 right-6 bg-white text-secondary font-extrabold px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <span className="text-lg">{product.compressiveStrength}</span>
            </div>
          </div>

          <div className="space-y-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-secondary mb-6 leading-tight">
                {name}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                {description}
              </p>
            </div>

            <div className="bg-muted p-8 rounded-2xl border border-border">
              <h3 className="text-2xl font-bold text-secondary mb-6 flex items-center gap-3">
                <Building className="w-6 h-6 text-primary" />
                {t('المواصفات الفنية والاستخدامات', 'Technical Specifications & Uses')}
              </h3>
              <div className="prose prose-lg dark:prose-invert font-medium max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: specs }} />
            </div>

            <div className="pt-6 border-t border-border">
              <div className="bg-primary/5 border border-primary/20 p-8 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h4 className="text-xl font-bold text-secondary mb-2">
                    {t('هل هذا المنتج مناسب لمشروعك؟', 'Is this product suitable for your project?')}
                  </h4>
                  <p className="text-muted-foreground font-medium">
                    {t('تواصل مع فريقنا الهندسي لتأكيد المواصفات وطلب تسعيرة.', 'Contact our engineering team to confirm specifications and request a quote.')}
                  </p>
                </div>
                <Link href={`/quote?product=${product.id}`}>
                  <Button size="lg" className="h-14 px-8 text-lg font-bold shrink-0 shadow-lg hover:shadow-xl transition-shadow">
                    {t('اطلب تسعيرة الآن', 'Request a Quote Now')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
