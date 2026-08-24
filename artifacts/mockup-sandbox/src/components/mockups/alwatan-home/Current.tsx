import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building,
  Building2,
  ChevronLeft,
  ChevronRight,
  Droplets,
  FileText,
  Globe,
  HardHat,
  Menu,
  X,
} from "lucide-react";
import "./_group.css";

const asset = (file: string) => `/__mockup/alwatan-home/${file}`;
const slides = ["slider-fleet-day.png", "slider-project-night.png", "slider-branch-night.png", "slider-fleet-night.png"];
const mobileSlides = ["slider-yard-mobile.png", "slider-plant-mobile.png", "slider-project-night.png", "slider-fleet-night.png"];

type Product = { id: number; slug: string; nameAr: string; nameEn: string; descriptionAr: string; descriptionEn: string; imageUrl: string };
const products: Product[] = [
  { id: 1, slug: "standard-ready-mix", nameAr: "الخرسانة الجاهزة القياسية", nameEn: "Standard Ready-Mix Concrete", descriptionAr: "خلطات خرسانية موثوقة لجميع أنواع المشاريع الإنشائية وفق أعلى المواصفات.", descriptionEn: "Reliable concrete mixes for every construction project, made to the highest specifications.", imageUrl: asset("quality-concrete.png") },
  { id: 2, slug: "high-strength-concrete", nameAr: "الخرسانة عالية المقاومة", nameEn: "High-Strength Concrete", descriptionAr: "حلول متقدمة للمشاريع التي تتطلب قوة تحمل ومتانة استثنائية.", descriptionEn: "Advanced solutions for projects requiring exceptional strength and durability.", imageUrl: asset("slider-fleet-day.png") },
  { id: 3, slug: "specialty-concrete", nameAr: "الخرسانة المتخصصة", nameEn: "Specialty Concrete", descriptionAr: "تصميمات دقيقة تلبي المتطلبات الفنية والبيئية للمشاريع الكبرى.", descriptionEn: "Precisely engineered mixes for the technical and environmental demands of major projects.", imageUrl: asset("slider-project-night.png") },
];

function StubLink({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <a href="#alwatan-current" onClick={(event) => event.preventDefault()} className={className}>{children}</a>;
}

export function Current() {
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [slide, setSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const isRtl = language === "ar";
  const t = (ar: string, en: string) => (isRtl ? ar : en);
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, []);

  const navLinks = [
    ["/", t("الرئيسية", "Home")], ["/about", t("من نحن", "About Us")], ["/products", t("منتجاتنا", "Products")],
    ["/certificates", t("الاعتمادات", "Certificates")], ["/branches", t("الفروع", "Branches")],
    ["/blog", t("المركز الإعلامي", "Media Center")], ["/contact", t("تواصل معنا", "Contact")],
  ];

  return (
    <div id="alwatan-current" className="alwatan-current min-h-screen" dir={isRtl ? "rtl" : "ltr"}>
      <div className="bg-secondary text-secondary-foreground py-2 px-6 flex justify-between items-center text-sm font-medium">
        <span>{t("شركة مصنع الوطن للخرسانة الجاهزة", "AlWatan Ready-Mix Concrete Co.")}</span>
        <div className="flex items-center gap-4">
          <StubLink className="hover:text-primary transition-colors">{t("دخول الموظفين", "Staff Login")}</StubLink>
          <button onClick={() => setLanguage(isRtl ? "en" : "ar")} className="flex items-center gap-2 hover:text-primary transition-colors">
            <Globe className="w-4 h-4" /><span>{isRtl ? "English" : "العربية"}</span>
          </button>
        </div>
      </div>

      <header className="bg-card shadow-sm sticky top-0 z-50">
        <div className="aw-container py-4 flex items-center justify-between">
          <StubLink className="flex items-center gap-3"><img src={asset("brand-logo.png")} alt="AlWatan Logo" className="h-12 w-auto object-contain" /></StubLink>
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
            {navLinks.map(([href, label]) => <StubLink key={href} className={`text-sm xl:text-base font-semibold transition-colors hover:text-primary ${href === "/" ? "text-primary border-b-2 border-primary pb-1" : "text-foreground"}`}>{label}</StubLink>)}
            <StubLink className="inline-flex items-center justify-center gap-2 min-h-9 px-4 py-2 rounded-md border border-primary/40 text-primary font-bold hover:bg-primary/10"><span>{t("الملف التعريفي", "Company Profile")}</span><FileText className="w-4 h-4" /></StubLink>
            <StubLink className="inline-flex items-center justify-center gap-2 min-h-9 px-4 py-2 rounded-md bg-primary text-primary-foreground font-bold"><span>{t("اطلب تسعيرة", "Request a Quote")}</span><Building className="w-4 h-4" /></StubLink>
          </nav>
          <button className="lg:hidden text-foreground" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
        </div>
        {menuOpen && <div className="lg:hidden bg-card border-t border-border p-4 flex flex-col gap-4">{navLinks.map(([href, label]) => <StubLink key={href} className={`block font-semibold p-2 rounded-md ${href === "/" ? "bg-primary/10 text-primary" : "text-foreground"}`} >{label}</StubLink>)}</div>}
      </header>

      <main>
        <section className="relative w-full h-[75vh] md:h-[85vh] overflow-hidden bg-secondary">
          {slides.map((file, index) => (
            <picture key={file} className={`absolute inset-0 transition-opacity duration-700 ${slide === index ? "opacity-100" : "opacity-0"}`}>
              <source media="(max-width: 768px)" srcSet={asset(mobileSlides[index])} />
              <img src={asset(file)} alt={`AlWatan Ready-Mix Slide ${index + 1}`} className="w-full h-full object-cover object-center" />
            </picture>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent opacity-60 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-8 flex justify-center items-center gap-6 z-10" dir="ltr">
            <button onClick={() => setSlide((slide + slides.length - 1) % slides.length)} className="p-3 rounded-full bg-black/20 text-white hover:bg-black/50 backdrop-blur-md border border-white/10" aria-label="Previous Slide">{isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}</button>
            <div className="flex gap-3">{slides.map((_, index) => <button key={index} onClick={() => setSlide(index)} aria-label={`Go to slide ${index + 1}`} className={`h-1.5 rounded-full transition-all duration-500 ${index === slide ? "w-10 bg-primary" : "w-4 bg-white/50"}`} />)}</div>
            <button onClick={() => setSlide((slide + 1) % slides.length)} className="p-3 rounded-full bg-black/20 text-white hover:bg-black/50 backdrop-blur-md border border-white/10" aria-label="Next Slide">{isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}</button>
          </div>
        </section>

        <section className="py-20 md:py-32 bg-background border-b border-border">
          <div className="aw-container"><div className="flex flex-col md:flex-row items-center justify-between gap-16">
            <div className="flex-1 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-8"><span className="w-2 h-2 rounded-full bg-primary animate-pulse" /><span className="font-bold text-sm tracking-wider uppercase">{t("الجودة في كل قطرة", "Quality in every drop")}</span></div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-8">{t("أساسات قوية لمستقبل مستدام", "Strong Foundations for a Sustainable Future")}</h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 font-medium">{t("الوطن للخرسانة الجاهزة. شريكك الموثوق في توريد الخرسانة عالية الأداء للمشاريع الضخمة والبنية التحتية في المملكة.", "AlWatan Ready-Mix. Your trusted partner for high-performance concrete supply for mega projects and infrastructure in the Kingdom.")}</p>
              <div className="flex flex-wrap gap-4"><StubLink className="inline-flex items-center h-14 px-8 rounded-md text-lg font-bold shadow-lg bg-primary text-primary-foreground">{t("اطلب تسعيرة الآن", "Request a Quote Now")}<Arrow className={isRtl ? "w-5 h-5 mr-2" : "w-5 h-5 ml-2"} /></StubLink><StubLink className="inline-flex items-center h-14 px-8 rounded-md text-lg font-bold border border-border bg-transparent">{t("تعرف علينا", "Discover Us")}</StubLink></div>
            </div>
            <div className="flex-1 w-full flex justify-end"><div className="relative w-full max-w-lg aspect-[4/3] rounded-3xl overflow-hidden border-8 border-card shadow-2xl"><img src={asset("quality-concrete.png")} alt="Quality Concrete" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-primary/10 mix-blend-multiply" /></div></div>
          </div></div>
        </section>

        <section className="py-24 bg-muted/30"><div className="aw-container">
          <div className="text-center mb-16 max-w-3xl mx-auto"><h2 className="text-primary font-bold tracking-widest uppercase mb-4 text-sm">{t("لماذا تختارنا", "Why Choose Us")}</h2><h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground">{t("معايير لا تقبل المساومة", "Uncompromising Standards")}</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">{[
            [HardHat, t("خبرة هندسية", "Engineering Expertise"), t("فريق متكامل من المهندسين والفنيين ذوي الخبرة العالية في تصميم الخلطات الخرسانية المطابقة لأدق المواصفات.", "A complete team of engineers and technicians highly experienced in designing concrete mixes that meet exact specifications.")],
            [Building2, t("مشاريع عملاقة", "Mega Projects"), t("سجل حافل بالنجاحات والموثوقية في توريد الخرسانة لأكبر المشاريع التنموية ومشاريع البنية التحتية.", "A proven track record of success and reliability in supplying concrete to the largest developmental and infrastructure projects.")],
            [Droplets, t("جودة عالية", "High Quality"), t("مواد خام مختارة بعناية واختبارات معملية دقيقة ومستمرة لضمان أعلى درجات المقاومة والتحمل.", "Carefully selected raw materials and precise, continuous laboratory testing to ensure the highest degrees of resistance and durability.")],
          ].map(([Icon, title, description], index) => { const FeatureIcon = Icon as typeof HardHat; return <div key={index} className="bg-card p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-border group hover:-translate-y-1"><div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all"><FeatureIcon className="w-8 h-8" /></div><h4 className="text-2xl font-bold text-foreground mb-4">{title as string}</h4><p className="text-muted-foreground text-lg leading-relaxed">{description as string}</p></div>; })}</div>
        </div></section>

        <section className="py-24 bg-card"><div className="aw-container">
          <div className="max-w-3xl mx-auto text-center mb-16"><h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-4">{t("هويتنا وقدراتنا", "Our Identity and Capabilities")}</h2><h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-6">{t("القوة والموثوقية في كل تفصيل", "Strength and Reliability in Every Detail")}</h3><p className="text-lg text-muted-foreground leading-relaxed">{t("تعرف على شركة مصنع الوطن للخرسانة الجاهزة من خلال هذه المقاطع التي تعكس التزامنا بالجودة وقدرتنا على تنفيذ أضخم المشاريع.", "Discover AlWatan Ready-Mix Concrete Co. through these clips that reflect our commitment to quality and our capability to execute the largest projects.")}</p></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">{[
            ["company-voice.webm", "slider-project-night.png", t("صوت الوطن", "Voice of AlWatan"), t("رسالة الشركة وأهدافها المستقبلية في بناء أساسات متينة تدعم رؤية المملكة التنموية الطموحة.", "Our mission and future goals in building solid foundations that support the Kingdom's ambitious developmental vision.")],
            ["company-music.webm", "slider-branch-night.png", t("قدراتنا الصناعية", "Our Industrial Capabilities"), t("نظرة على أسطولنا الضخم ومصانعنا المتطورة التي تضمن إمداد المشاريع الكبرى بالخرسانة دون انقطاع.", "A look at our massive fleet and advanced plants that ensure uninterrupted concrete supply to major projects.")],
          ].map(([video, poster, title, description]) => <div key={video} className="rounded-3xl overflow-hidden shadow-xl bg-secondary border border-border flex flex-col"><div className="relative aspect-video bg-black"><video controls playsInline className="aw-video" poster={asset(poster)} preload="metadata"><source src={asset(video)} type="video/webm" /><source src={asset(video.replace("webm", "mp4"))} type="video/mp4" /></video></div><div className="p-8 bg-card flex-1 border-t border-border"><h4 className="text-2xl font-bold text-foreground mb-3">{title}</h4><p className="text-muted-foreground leading-relaxed text-lg">{description}</p></div></div>)}</div>
        </div></section>

        <section className="py-24 bg-secondary text-secondary-foreground border-t-[12px] border-primary"><div className="aw-container">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 border-b border-white/10 pb-8"><div className="max-w-2xl"><h2 className="text-primary font-bold tracking-widest uppercase mb-4 text-sm">{t("منتجاتنا", "Our Products")}</h2><h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">{t("تشكيلة واسعة من الخرسانة الجاهزة", "A Wide Range of Ready-Mix Concrete")}</h3></div><StubLink className="inline-flex items-center h-14 px-8 border border-white/20 rounded-md text-white text-lg font-bold hover:bg-white hover:text-secondary">{t("عرض كل المنتجات", "View All Products")}</StubLink></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">{products.map((product) => <StubLink key={product.id}><div className="bg-white/5 rounded-3xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all group hover:-translate-y-1 flex flex-col h-full"><div className="h-64 overflow-hidden bg-black/40 relative"><img src={product.imageUrl} alt={isRtl ? product.nameAr : product.nameEn} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" /></div><div className="p-8 flex-1 flex flex-col"><h4 className="text-2xl font-bold text-white mb-4">{isRtl ? product.nameAr : product.nameEn}</h4><p className="text-gray-400 text-lg mb-8 leading-relaxed flex-1">{isRtl ? product.descriptionAr : product.descriptionEn}</p><div className="flex items-center text-primary font-bold text-lg">{t("اكتشف المزيد", "Learn More")}<ChevronRight className={isRtl ? "w-5 h-5 rotate-180 mr-1" : "w-5 h-5 ml-1"} /></div></div></div></StubLink>)}</div>
        </div></section>

        <section className="py-24 bg-background border-t border-border"><div className="aw-container"><div className="bg-primary rounded-[2.5rem] p-12 md:p-20 text-center text-primary-foreground shadow-2xl relative overflow-hidden"><div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-white/10 rounded-full blur-3xl" /><div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-black/10 rounded-full blur-3xl" /><h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 relative z-10">{t("هل لديك مشروع قادم؟", "Do you have an upcoming project?")}</h2><p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-primary-foreground/90 relative z-10 font-medium leading-relaxed">{t("دعنا نساعدك في بناء أساس قوي. فريقنا الهندسي والتجاري مستعد لتقديم الاستشارة والتسعيرة المناسبة لمشروعك بأعلى معايير الجودة.", "Let us help you build a strong foundation. Our engineering and commercial team is ready to provide consultation and appropriate pricing for your project with the highest quality standards.")}</p><StubLink className="inline-flex items-center h-16 px-12 rounded-md text-xl font-bold bg-white text-secondary shadow-xl relative z-10">{t("اطلب تسعيرة الآن", "Request a Quote Now")}</StubLink></div></div></section>
      </main>

      <footer className="bg-secondary text-secondary-foreground py-16 px-6"><div className="aw-container grid grid-cols-1 md:grid-cols-4 gap-12"><div className="col-span-1 md:col-span-2"><img src={asset("brand-logo.png")} alt="AlWatan Logo" className="h-16 w-auto object-contain mb-6 bg-white p-2 rounded" /><p className="max-w-md text-secondary-foreground/80 leading-relaxed font-medium">{t("الوطن للخرسانة الجاهزة هي إحدى الشركات الرائدة في مجال صناعة الخرسانة الجاهزة في المملكة العربية السعودية، نقدم حلولاً مبتكرة ومستدامة تلبي أعلى معايير الجودة للمشاريع الإنشائية.", "AlWatan Ready-Mix is a leading ready-mix concrete supplier in Saudi Arabia, providing innovative and sustainable solutions that meet the highest quality standards for construction projects.")}</p></div><div><h4 className="text-xl font-bold mb-6 text-primary">{t("روابط سريعة", "Quick Links")}</h4><ul className="space-y-4 font-medium text-secondary-foreground/80">{[t("عن الشركة", "About Company"), t("المنتجات", "Products"), t("الاعتمادات", "Certificates"), t("الملف التعريفي", "Company Profile"), t("اتصل بنا", "Contact Us")].map((label) => <li key={label}><StubLink className="hover:text-primary">{label}</StubLink></li>)}</ul></div><div><h4 className="text-xl font-bold mb-6 text-primary">{t("تواصل معنا", "Contact Us")}</h4><ul className="space-y-4 font-medium text-secondary-foreground/80"><li>{t("الرياض، المملكة العربية السعودية", "Riyadh, Saudi Arabia")}</li><li>info@alwatanreadymix.com</li><li dir="ltr">+966 50 000 0000</li></ul></div></div><div className="aw-container mt-12 pt-8 border-t border-secondary-foreground/20 text-center text-sm text-secondary-foreground/60"><p>© {new Date().getFullYear()} {t("شركة مصنع الوطن للخرسانة الجاهزة. جميع الحقوق محفوظة.", "AlWatan Ready-Mix Concrete Co. All rights reserved.")}</p></div></footer>
    </div>
  );
}

export default Current;