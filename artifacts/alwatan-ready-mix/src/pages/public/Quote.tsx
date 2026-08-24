import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/lib/i18n';
import { useCreateQuote, useListProducts } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Building, MapPin, Calculator, Phone } from 'lucide-react';
import { useState } from 'react';

const formSchema = z.object({
  productId: z.number().min(1, 'Please select a product'),
  quantityEstimate: z.string().min(1, 'Quantity is required'),
  projectLocation: z.string().min(3, 'Location is required'),
  fullName: z.string().min(2, 'Name is required'),
  phone: z.string().min(8, 'Valid phone number is required'),
  email: z.string().email('Valid email is required'),
  notes: z.string().optional(),
});

export default function Quote() {
  const { t, language, isRtl } = useLanguage();
  const { toast } = useToast();
  const { data: products } = useListProducts();
  const createQuote = useCreateQuote();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: 0,
      quantityEstimate: '',
      projectLocation: '',
      fullName: '',
      phone: '',
      email: '',
      notes: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createQuote.mutate({ data: values }, {
      onSuccess: () => {
        setIsSuccess(true);
        toast({
          title: t('تم إرسال الطلب بنجاح', 'Request Sent Successfully'),
          description: t('سنتواصل معك في أقرب وقت ممكن.', 'We will contact you as soon as possible.'),
        });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: t('حدث خطأ', 'An Error Occurred'),
          description: t('يرجى المحاولة مرة أخرى لاحقاً.', 'Please try again later.'),
        });
      }
    });
  }

  return (
    <div className="min-h-screen bg-muted/30 py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-secondary mb-4">
              {t('اطلب تسعيرة لمشروعك', 'Request a Quote for Your Project')}
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              {t('املأ النموذج أدناه وسيقوم فريق المبيعات بالتواصل معك لتقديم أفضل عرض سعر.', 'Fill out the form below and our sales team will contact you to provide the best quotation.')}
            </p>
          </div>

          {isSuccess ? (
            <div className="bg-card p-12 rounded-3xl shadow-xl border border-border text-center animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-secondary mb-4">
                {t('شكراً لتواصلك معنا!', 'Thank you for contacting us!')}
              </h2>
              <p className="text-muted-foreground text-lg mb-8 font-medium">
                {t('لقد استلمنا طلب التسعيرة الخاص بك. سيقوم أحد ممثلي المبيعات بالتواصل معك خلال ٢٤ ساعة عمل.', 'We have received your quote request. One of our sales representatives will contact you within 24 working hours.')}
              </p>
              <Button onClick={() => window.location.href = '/'} size="lg" className="font-bold">
                {t('العودة للرئيسية', 'Back to Home')}
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="bg-secondary p-10 text-white flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-6">{t('معلومات الاتصال', 'Contact Information')}</h3>
                    <ul className="space-y-6">
                      <li className="flex items-start gap-4">
                        <MapPin className="w-6 h-6 text-primary shrink-0" />
                        <div>
                          <h4 className="font-bold text-lg">{t('المقر الرئيسي', 'Headquarters')}</h4>
                          <p className="text-white/70">الرياض، المملكة العربية السعودية</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-4">
                        <Phone className="w-6 h-6 text-primary shrink-0" />
                        <div>
                          <h4 className="font-bold text-lg">{t('المبيعات', 'Sales')}</h4>
                          <p className="text-white/70">+966 50 000 0000</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="md:col-span-2 p-10">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold text-secondary">{t('الاسم الكامل', 'Full Name')}</FormLabel>
                              <FormControl>
                                <Input className="h-12 bg-muted/50" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold text-secondary">{t('رقم الجوال', 'Phone Number')}</FormLabel>
                              <FormControl>
                                <Input className="h-12 bg-muted/50" dir="ltr" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold text-secondary">{t('البريد الإلكتروني', 'Email')}</FormLabel>
                            <FormControl>
                              <Input type="email" className="h-12 bg-muted/50" dir="ltr" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="productId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold text-secondary">{t('نوع الخرسانة', 'Concrete Type')}</FormLabel>
                              <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? field.value.toString() : ''}>
                                <FormControl>
                                  <SelectTrigger className="h-12 bg-muted/50">
                                    <SelectValue placeholder={t('اختر المنتج', 'Select Product')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {products?.map(p => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                      {language === 'ar' ? p.nameAr : p.nameEn}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="quantityEstimate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold text-secondary">{t('الكمية التقديرية (م٣)', 'Estimated Quantity (m³)')}</FormLabel>
                              <FormControl>
                                <Input className="h-12 bg-muted/50" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="projectLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold text-secondary">{t('موقع المشروع', 'Project Location')}</FormLabel>
                            <FormControl>
                              <Input className="h-12 bg-muted/50" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold text-secondary">{t('تفاصيل إضافية', 'Additional Details')}</FormLabel>
                            <FormControl>
                              <Textarea className="min-h-[120px] bg-muted/50" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full h-14 text-lg font-bold"
                        disabled={createQuote.isPending}
                      >
                        {createQuote.isPending ? t('جاري الإرسال...', 'Sending...') : t('إرسال طلب التسعيرة', 'Submit Quote Request')}
                      </Button>
                    </form>
                  </Form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
