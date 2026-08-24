import { useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, Building2, Check, ChevronLeft, ChevronRight,
  CircleHelp, FileText, Globe, Menu, Phone, ShieldCheck, X,
} from "lucide-react";
import "./_group.css";
import "./VariantA.css";

const asset = (file: string) => `/__mockup/alwatan-home/${file}`;
const slides = [
  { desktop: "slider-fleet-day.png", mobile: "slider-yard-mobile.png", labelAr: "أسطول يواكب حجم طموحك", labelEn: "A fleet built for your ambition" },
  { desktop: "slider-project-night.png", mobile: "slider-plant-mobile.png", labelAr: "نصنع الثقة في مواقع العمل", labelEn: "Confidence, delivered to site" },
  { desktop: "slider-branch-night.png", mobile: "slider-project-night.png", labelAr: "قربٌ يسرّع التنفيذ", labelEn: "Closer to every project" },
  { desktop: "slider-fleet-night.png", mobile: "slider-fleet-night.png", labelAr: "جاهزون عندما تحتاجنا", labelEn: "Ready when you are" },
];
const products = [
  ["الخرسانة الجاهزة القياسية", "Standard Ready-Mix Concrete", "حلول موثوقة لكل مرحلة من مراحل البناء.", "Reliable mixes for every stage of construction.", "quality-concrete.png"],
  ["الخرسانة عالية المقاومة", "High-Strength Concrete", "أداء مصمم للمشاريع التي لا تحتمل التنازل.", "Engineered performance for demanding projects.", "slider-fleet-day.png"],
  ["الخرسانة المتخصصة", "Specialty Concrete", "خلطات دقيقة للمتطلبات الفنية والبيئية.", "Precise mixes for technical and environmental demands.", "slider-project-night.png"],
];

function StubLink({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <a href="#alwatan-variant" onClick={(event) => event.preventDefault()} className={className}>{children}</a>;
}

export function VariantA() {
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [slide, setSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const isRtl = language === "ar";
  const t = (ar: string, en: string) => isRtl ? ar : en;
  const next = () => setSlide((current) => (current + 1) % slides.length);
  const previous = () => setSlide((current) => (current + slides.length - 1) % slides.length);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(next, 6500);
    return () => window.clearInterval(timer);
  }, [paused]);

  const nav = [
    t("من نحن", "About Us"), t("حلولنا", "Solutions"), t("الجودة والاعتمادات", "Quality & Certifications"),
    t("الفروع", "Branches"), t("المركز الإعلامي", "Media Center"),
  ];

  return (
    <div id="alwatan-variant" className="alwatan-variant min-h-screen" dir={isRtl ? "rtl" : "ltr"}>
      <div className="bg-[#112536] text-white/80 text-[12px]">
        <div className="av-container flex min-h-9 items-center justify-between gap-3">
          <span>{t("شركة مصنع الوطن للخرسانة الجاهزة", "AlWatan Ready-Mix Concrete Co.")}</span>
          <div className="flex items-center gap-4">
            <StubLink className="hidden sm:inline hover:text-[#e7d3b2]">{t("دخول الموظفين", "Staff Login")}</StubLink>
            <button className="flex items-center gap-1.5 hover:text-[#e7d3b2]" onClick={() => setLanguage(isRtl ? "en" : "ar")} aria-label="Change language">
              <Globe className="h-3.5 w-3.5" />{isRtl ? "English" : "العربية"}
            </button>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-[#dce4e5] bg-[#f7f8f6]/95 backdrop-blur-md">
        <div className="av-container flex min-h-[78px] items-center justify-between gap-8">
          <StubLink className="shrink-0"><img src={asset("brand-logo.png")} alt="AlWatan Ready-Mix" className="h-11 w-auto object-contain" /></StubLink>
          <nav className="hidden items-center gap-6 lg:flex">
            {nav.map((item, index) => <StubLink key={item} className={`text-[13px] font-bold transition-colors hover:text-[#087f78] ${index === 0 ? "text-[#087f78]" : "text-[#526675]"}`}>{item}</StubLink>)}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <StubLink className="av-outline-btn inline-flex h-10 items-center gap-2 rounded-md border border-[#087f78]/35 px-4 text-[13px] font-bold text-[#075b5a]"><FileText className="h-4 w-4" />{t("الملف التعريفي", "Company Profile")}</StubLink>
            <StubLink className="av-solid-btn inline-flex h-10 items-center gap-2 rounded-md bg-[#087f78] px-4 text-[13px] font-bold text-white shadow-sm"><Building2 className="h-4 w-4" />{t("اطلب تسعيرة", "Request a quote")}</StubLink>
          </div>
          <button className="rounded-md p-2 text-[#112536] lg:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label={t("فتح القائمة", "Open menu")} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <div className="av-container border-t border-[#dce4e5] py-4 lg:hidden">
          <nav className="flex flex-col gap-1">{nav.map((item) => <StubLink key={item} className="rounded-md px-3 py-3 text-sm font-bold text-[#526675] hover:bg-[#e8f1ef] hover:text-[#075b5a]">{item}</StubLink>)}</nav>
          <StubLink className="mt-3 flex h-11 items-center justify-center rounded-md bg-[#087f78] font-bold text-white">{t("اطلب تسعيرة", "Request a quote")}</StubLink>
        </div>}
      </header>

      <main>
        <section className="av-noise relative min-h-[570px] overflow-hidden bg-[#112536] md:min-h-[650px]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          {slides.map((item, index) => <picture key={item.desktop} className={`av-hero-media absolute inset-0 transition-opacity duration-700 ${slide === index ? "opacity-100" : "opacity-0"}`}>
            <source media="(max-width: 767px)" srcSet={asset(item.mobile)} />
            <img src={asset(item.desktop)} alt={item.labelEn} className="h-full w-full object-cover object-center" />
          </picture>)}
          <div className="absolute inset-0 bg-gradient-to-r from-[#112536]/90 via-[#112536]/45 to-transparent" />
          <div className="av-container relative flex min-h-[570px] items-end pb-24 md:min-h-[650px] md:items-center md:pb-0">
            <div className="av-reveal max-w-xl text-white">
              <div className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[.2em] text-[#e7d3b2]"><span className="h-px w-9 bg-[#e7d3b2]" />AlWatan Ready-Mix / 01</div>
              <h1 className="av-display mb-5 text-4xl font-extrabold leading-[1.08] md:text-6xl">{t("نبني ما يدوم.", "Built to last.")}<br /><span className="text-[#e7d3b2]">{t("بثقة تُقاس.", "Measured in trust.")}</span></h1>
              <p className="mb-8 max-w-lg text-base leading-8 text-white/78 md:text-lg">{t("خرسانة جاهزة عالية الأداء، تصل إلى مشروعك في الوقت والمواصفة التي تحتاجها.", "High-performance ready-mix concrete, delivered to your project on time and to specification.")}</p>
              <div className="flex flex-wrap gap-3">
                <StubLink className="av-solid-btn inline-flex h-12 items-center gap-2 rounded-md bg-[#e7d3b2] px-6 font-extrabold text-[#112536]">{t("ابدأ محادثة", "Start a conversation")}<ArrowRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} /></StubLink>
                <StubLink className="av-outline-btn inline-flex h-12 items-center gap-2 rounded-md border border-white/35 px-6 font-bold text-white">{t("اكتشف قدراتنا", "Explore our capabilities")}</StubLink>
              </div>
            </div>
          </div>
          <div className="av-container absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center justify-between gap-4" dir="ltr">
            <div className="flex items-center gap-2">{slides.map((_, index) => <button key={index} onClick={() => setSlide(index)} className={`h-1 rounded-full transition-all duration-300 ${index === slide ? "w-12 bg-[#e7d3b2]" : "w-5 bg-white/50"}`} aria-label={`Go to slide ${index + 1}`} />)}</div>
            <div className="flex gap-2"><button onClick={previous} className="rounded-full border border-white/30 p-2.5 text-white hover:bg-white/15" aria-label="Previous slide"><ChevronLeft className="h-4 w-4" /></button><button onClick={next} className="rounded-full border border-white/30 p-2.5 text-white hover:bg-white/15" aria-label="Next slide"><ChevronRight className="h-4 w-4" /></button></div>
          </div>
        </section>

        <section className="av-grid border-b border-[#dce4e5] bg-[#f7f8f6] py-8">
          <div className="av-container grid grid-cols-2 gap-6 md:grid-cols-4">
            {[["25+", t("عاماً من الخبرة", "Years of experience")], ["24/7", t("جاهزية التوريد", "Supply readiness")], ["03", t("محطات إنتاج", "Production plants")], ["01", t("التزام واحد: الجودة", "Commitment: quality")]].map(([value, label]) => <div key={value} className="border-s-2 border-[#e7d3b2] ps-4"><strong className="av-display block text-2xl font-extrabold text-[#075b5a] md:text-3xl">{value}</strong><span className="text-xs font-semibold text-[#526675] md:text-sm">{label}</span></div>)}
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="av-container grid gap-12 md:grid-cols-[.85fr_1.15fr] md:items-start">
            <div className="av-reveal"><p className="mb-4 text-xs font-extrabold uppercase tracking-[.2em] text-[#087f78]">{t("لماذا الوطن", "Why AlWatan")}</p><h2 className="av-display text-3xl font-extrabold leading-tight text-[#112536] md:text-5xl">{t("شريك هندسي، لا مجرد مورّد.", "An engineering partner, not just a supplier.")}</h2><p className="mt-5 max-w-md leading-8 text-[#526675]">{t("من تصميم الخلطة إلى آخر شاحنة في الموقع، نعمل كجزء من فريقك. قرارات دقيقة، تواصل واضح، ونتائج يمكن الاعتماد عليها.", "From mix design to the last truck on site, we work as part of your team. Precise decisions, clear communication, dependable results.")}</p><StubLink className="mt-7 inline-flex items-center gap-2 font-extrabold text-[#087f78]">{t("تعرف على نهجنا", "Learn about our approach")}<ArrowLeft className={`h-4 w-4 ${isRtl ? "" : "rotate-180"}`} /></StubLink></div>
            <div className="grid gap-4 sm:grid-cols-2">{[
              [ShieldCheck, t("جودة موثقة", "Verified quality"), t("اختبارات مستمرة ومواد خام مختارة وفق المواصفات.", "Continuous testing and carefully selected materials.")],
              [CircleHelp, t("دعم هندسي", "Engineering support"), t("خبراء يساعدونك على اختيار الحل الأنسب للمشروع.", "Experts help you choose the right solution for your project.")],
              [Phone, t("تواصل مباشر", "Direct communication"), t("قناة واضحة من التسعير وحتى التسليم في الموقع.", "One clear channel from quote to site delivery.")],
              [Check, t("التزام بالمواعيد", "Schedule commitment"), t("تنسيق لوجستي يواكب إيقاع مشاريعك.", "Logistics coordinated to your project’s rhythm.")],
            ].map(([Icon, title, description]) => { const FeatureIcon = Icon as typeof Check; return <div key={title as string} className="av-card rounded-xl border border-[#dce4e5] bg-white p-6"><FeatureIcon className="mb-5 h-6 w-6 text-[#087f78]" /><h3 className="mb-2 text-lg font-extrabold">{title as string}</h3><p className="text-sm leading-7 text-[#526675]">{description as string}</p></div>; })}</div>
          </div>
        </section>

        <section className="bg-[#e8f1ef] py-20 md:py-24"><div className="av-container"><div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-3 text-xs font-extrabold uppercase tracking-[.2em] text-[#087f78]">{t("قدراتنا", "Capabilities")}</p><h2 className="av-display text-3xl font-extrabold md:text-4xl">{t("ما تحتاجه لبناء أفضل.", "Everything to build better.")}</h2></div><StubLink className="font-extrabold text-[#075b5a]">{t("عرض كل الحلول", "View all solutions")} <ArrowRight className={`inline h-4 w-4 ${isRtl ? "rotate-180" : ""}`} /></StubLink></div><div className="grid gap-5 md:grid-cols-3">{products.map(([ar, en, dar, den, image]) => <StubLink key={en} className="av-card group overflow-hidden rounded-xl border border-[#cbdedd] bg-[#f7f8f6]"><div className="h-44 overflow-hidden"><img src={asset(image)} alt={en} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div><div className="p-6"><h3 className="mb-2 text-lg font-extrabold">{isRtl ? ar : en}</h3><p className="text-sm leading-7 text-[#526675]">{isRtl ? dar : den}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#087f78]">{t("التفاصيل", "Details")}<ChevronRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} /></span></div></StubLink>)}</div></div></section>

        <section className="py-20 md:py-28"><div className="av-container"><div className="mb-10 max-w-2xl"><p className="mb-3 text-xs font-extrabold uppercase tracking-[.2em] text-[#087f78]">{t("داخل الوطن", "Inside AlWatan")}</p><h2 className="av-display text-3xl font-extrabold md:text-4xl">{t("الجودة تبدأ من الداخل.", "Quality starts from within.")}</h2></div><div className="grid gap-6 md:grid-cols-2">{[["company-voice.webm", "slider-project-night.png", t("صوت الوطن", "The AlWatan story"), t("رسالتنا، ثقافتنا، وما الذي يجعل كل تسليم مهماً.", "Our mission, culture, and why every delivery matters.")], ["company-music.webm", "slider-branch-night.png", t("قدراتنا الصناعية", "Industrial capability"), t("نظرة على العمليات والأسطول الذي يحرك مشاريع المملكة.", "A look at the operations and fleet moving Saudi projects forward.")]].map(([video, poster, title, desc]) => <div key={video} className="overflow-hidden rounded-xl border border-[#dce4e5] bg-white"><div className="aspect-video bg-[#112536]"><video controls playsInline poster={asset(poster)} preload="metadata" className="aw-video"><source src={asset(video)} type="video/webm" /><source src={asset(video.replace(".webm", ".mp4"))} type="video/mp4" /></video></div><div className="p-5"><h3 className="font-extrabold">{title}</h3><p className="mt-2 text-sm leading-7 text-[#526675]">{desc}</p></div></div>)}</div></div></section>

        <section className="bg-[#075b5a] py-16 text-white md:py-20"><div className="av-container flex flex-col items-start justify-between gap-8 md:flex-row md:items-center"><div><p className="mb-3 text-xs font-extrabold uppercase tracking-[.2em] text-[#e7d3b2]">{t("جاهزون للخطوة التالية؟", "Ready for the next step?")}</p><h2 className="av-display text-3xl font-extrabold md:text-4xl">{t("لنبنِ خطة توريد واضحة لمشروعك.", "Let's build a clear supply plan for your project.")}</h2></div><StubLink className="av-solid-btn inline-flex h-13 shrink-0 items-center gap-2 rounded-md bg-[#e7d3b2] px-7 py-4 font-extrabold text-[#112536]">{t("اطلب تسعيرة", "Request a quote")}<ArrowRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} /></StubLink></div></section>
      </main>

      <footer className="bg-[#112536] py-12 text-white"><div className="av-container grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]"><div><img src={asset("brand-logo.png")} alt="AlWatan Ready-Mix" className="mb-5 h-12 w-auto rounded bg-white p-1 object-contain" /><p className="max-w-sm text-sm leading-7 text-white/65">{t("شركة رائدة في صناعة الخرسانة الجاهزة، نضع الجودة والموثوقية في أساس كل مشروع.", "A ready-mix concrete company built around quality and reliability in every project.")}</p></div><div><h3 className="mb-4 font-extrabold text-[#e7d3b2]">{t("روابط سريعة", "Explore")}</h3><div className="grid gap-3 text-sm text-white/70">{nav.slice(0, 4).map((item) => <StubLink key={item} className="hover:text-white">{item}</StubLink>)}</div></div><div><h3 className="mb-4 font-extrabold text-[#e7d3b2]">{t("تواصل معنا", "Contact")}</h3><div className="grid gap-3 text-sm text-white/70"><span>{t("الرياض، المملكة العربية السعودية", "Riyadh, Saudi Arabia")}</span><span>info@alwatanreadymix.com</span><span dir="ltr">+966 50 000 0000</span></div></div></div><div className="av-container mt-10 border-t border-white/15 pt-6 text-xs text-white/45">© {new Date().getFullYear()} {t("شركة مصنع الوطن للخرسانة الجاهزة. جميع الحقوق محفوظة.", "AlWatan Ready-Mix Concrete Co. All rights reserved.")}</div></footer>
    </div>
  );
}

export default VariantA;