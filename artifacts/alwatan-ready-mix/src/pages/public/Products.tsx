import { useLanguage } from '@/lib/i18n';
import { useListProducts } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import qualityImg from '@assets/Generated_Image_July_29,_2026_-_4_33AM_1787598707000.png';

export default function Products() {
  const { t, language, isRtl } = useLanguage();
  const { data: products, isLoading } = useListProducts();

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-card py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-secondary mb-6">
            {t('منتجات الخرسانة الجاهزة', 'Ready-Mix Concrete Products')}
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            {t(
              'نقدم مجموعة متكاملة من الخلطات الخرسانية المصممة لتلبية المتطلبات الدقيقة لمختلف أنواع المشاريع الإنشائية، مع ضمان أعلى مستويات الجودة والمقاومة.',
              'We offer a comprehensive range of concrete mixes designed to meet the exact requirements of various types of construction projects, ensuring the highest levels of quality and strength.'
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products?.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="h-56 relative overflow-hidden bg-muted">
                  <img 
                    src={product.imageUrl || qualityImg} 
                    alt={language === 'ar' ? product.nameAr : product.nameEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full shadow-md">
                    {product.compressiveStrength}
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-secondary mb-3">
                    {language === 'ar' ? product.nameAr : product.nameEn}
                  </h3>
                  <p className="text-muted-foreground font-medium mb-6 line-clamp-3">
                    {language === 'ar' ? product.descriptionAr : product.descriptionEn}
                  </p>
                  <Link href={`/products/${product.slug}`}>
                    <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                      {t('التفاصيل والمواصفات', 'Details & Specifications')}
                      <ArrowIcon className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
