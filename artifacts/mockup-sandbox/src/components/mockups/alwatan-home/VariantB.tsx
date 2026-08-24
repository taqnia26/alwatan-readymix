import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, ChevronLeft, ChevronRight, FileText, Globe, Menu, Pause, Play, X } from "lucide-react";
import "./_group.css";
import "./VariantB.css";

const asset = (file: string) => `/__mockup/alwatan-home/${file}`;
const slides = [
  { desktop: "slider-fleet-day.png", mobile: "slider-yard-mobile.png", kickerAr: "إمداد لا يتوقف", kickerEn: "SUPPLY WITHOUT PAUSE", titleAr: "نبني إيقاع المدن الكبرى", titleEn: "We keep major cities moving" },
  { desktop: "slider-project-night.png", mobile: "slider-plant-mobile.png", kickerAr: "هندسة تحت الضغط", kickerEn: "ENGINEERED UNDER PRESSURE", titleAr: "خرسانة لمشاريع تُرى من بعيد", titleEn: "Concrete for projects seen from afar" },
  { desktop: "slider-branch-night.png", mobile: "slider-project-night.png", kickerAr: "قربٌ يصنع الفرق", kickerEn: "CLOSER TO THE POUR", titleAr: "من الرياض إلى كل موقع", titleEn: "From Riyadh to every site" },
  { desktop: "slider-fleet-night.png", mobile: "slider-fleet-night.png", kickerAr: "الوطن للخرسانة الجاهزة", kickerEn: "ALWATAN READY-MIX", titleAr: "أساسات تثق بها المملكة", titleEn: "Foundations Saudi Arabia can trust" },
];
const products = [
  ["01", "الخرسانة الجاهزة القياسية", "Standard Ready-Mix", "خلطات موثوقة للأعمال اليومية والبنية الأساسية.", "Reliable mixes for everyday works and essential infrastructure.", "quality-concrete.png"],
  ["02", "الخرسانة عالية المقاومة", "High-Strength Concrete", "أداء محسوب للمباني والمنشآت التي تطلب المزيد.", "Measured performance for structures that demand more.", "slider-fleet-day.png"],
  ["03", "الخرسانة المتخصصة", "Specialty Concrete", "تصميمات دقيقة للمتطلبات الفنية والبيئية المعقدة.", "Precisely designed for complex technical and environmental needs.", "slider-project-night.png"],
];

function ActionLink({ children, className = "", href = "#quote", onClick }: { children: ReactNode; className?: string; href?: string; onClick?: () => void }) {
  return <a href={href} onClick={onClick ? (e) => { e.preventDefault(); onClick(); } : undefined} className={`vb-focus ${className}`}>{children}</a>;
}

export function VariantB() {
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const rtl = language === "ar";
  const t = (ar: string, en: string) => rtl ? ar : en;
  const next = () => setSlide((value) => (value + 1) % slides.length);
  const previous = () => setSlide((value) => (value + slides.length - 1) % slides.length);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(next, 6000);
    return () => window.clearInterval(timer);
  }, [playing]);

  const nav = [
    ["#top", t("الرئيسية", "Home")], ["#capabilities", t("قدراتنا", "Capabilities")],
    ["#products", t("منتجاتنا", "Products")], ["#proof", t("اعتماداتنا", "Our proof")], ["#contact", t("تواصل معنا", "Contact")],
  ];
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSent(true); };

  return (
    <div id="alwatan-variant-b" className="alwatan-current alwatan-variant-b min-h-[100dvh]" dir={rtl ? "rtl" : "ltr"}>
      <div className="bg-[var(--ink)] text-[var(--paper)] text-xs">
        <div className="vb-container flex min-h-9 items-center justify-between gap-4">
          <span className="hidden sm:block opacity-70">{t("شركة مصنع الوطن للخرسانة الجاهزة", "AlWatan Ready-Mix Concrete Co.")}</span>
          <div className="flex w-full sm:w-auto items-center justify-between gap-5">
            <span className="opacity-70">{t("الرياض · المملكة العربية السعودية", "Riyadh · Saudi Arabia")}</span>
            <button className="vb-focus flex items-center gap-2 font-bold hover:text-[var(--signal)]" onClick={() => setLanguage(rtl ? "en" : "ar")} aria-label={t("التبديل إلى الإنجليزية", "Switch to Arabic")}><Globe size={14} />{rtl ? "English" : "العربية"}</button>
          </div>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur">
        <div className="vb-container flex h-[76px] items-center justify-between gap-8">
          <ActionLink href="#top" className="shrink-0"><img src={asset("brand-logo.png")} alt="AlWatan Ready-Mix" className="h-12 w-auto" /></ActionLink>
          <nav className="hidden lg:flex items-center gap-7" aria-label={t("التنقل الرئيسي", "Main navigation")}>
            {nav.map(([href, label], index) => <ActionLink key={href} href={href} className="vb-navlink" aria-current={index === 0 ? "page" : undefined}>{label}</ActionLink>)}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <ActionLink href="#proof" className="vb-focus inline-flex h-11 items-center gap-2 border border-[var(--line)] px-4 text-sm font-bold"><FileText size={16} />{t("الملف التعريفي", "Company profile")}</ActionLink>
            <button onClick={() => { setQuoteOpen(true); setSent(false); }} className="vb-focus inline-flex h-11 items-center gap-2 bg-[var(--signal)] px-5 text-sm font-extrabold text-[var(--ink)] hover:bg-[var(--signal-deep)]"><Building2 size={17} />{t("اطلب تسعيرة", "Request a quote")}</button>
          </div>
          <button className="vb-focus lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={t("فتح القائمة", "Open menu")}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <div className="lg:hidden border-t border-[var(--line)] bg-[var(--paper-deep)] px-4 py-4"><nav className="flex flex-col gap-1">{nav.map(([href, label]) => <ActionLink key={href} href={href} onClick={() => setMenuOpen(false)} className="vb-focus border-b border-[var(--line)] py-3 font-bold">{label}</ActionLink>)}<button onClick={() => { setQuoteOpen(true); setMenuOpen(false); }} className="mt-3 bg-[var(--signal)] px-4 py-3 text-start font-extrabold">{t("ابدأ محادثة مشروع", "Start a project conversation")}</button></nav></div>}
      </header>

      <main id="top">
        <section className="relative min-h-[600px] overflow-hidden bg-[var(--ink)] text-[var(--paper)] md:min-h-[680px]">
          {slides.map((item, index) => <picture key={item.desktop} className={`vb-slide absolute inset-0 block ${index === slide ? "is-active opacity-100" : "opacity-0"}`}><source media="(max-width: 767px)" srcSet={asset(item.mobile)} /><img className="h-full w-full object-cover opacity-60" src={asset(item.desktop)} alt={t(`مشهد من عمليات الوطن، ${index + 1}`, `AlWatan operations, scene ${index + 1}`)} /></picture>)}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--ink)] via-[var(--ink)]/65 to-transparent" />
          <div className="vb-container relative flex min-h-[600px] items-end pb-24 md:min-h-[680px] md:pb-28">
            <div className="vb-hero-copy max-w-3xl">
              <div className="mb-7 flex items-center gap-3 text-[var(--signal)]"><span className="h-px w-12 bg-[var(--signal)]" /><span className="text-xs font-extrabold tracking-[.2em]">{rtl ? slides[slide].kickerAr : slides[slide].kickerEn}</span></div>
              <h1 className="vb-serif max-w-3xl text-5xl leading-[.98] md:text-7xl lg:text-[6.6rem]">{rtl ? slides[slide].titleAr : slides[slide].titleEn}</h1>
              <p className="mt-8 max-w-xl text-base leading-8 text-[var(--paper)]/75 md:text-lg">{t("نضبط الخلطة، نعرف الموقع، ونصل في الموعد. شريك صناعي للمشاريع التي تعيد تعريف المملكة.", "We dial in the mix, know the site, and arrive on time. An industrial partner for projects redefining the Kingdom.")}</p>
              <div className="mt-9 flex flex-wrap items-center gap-3"><button onClick={() => { setQuoteOpen(true); setSent(false); }} className="vb-focus bg-[var(--signal)] px-7 py-4 font-extrabold text-[var(--ink)] hover:bg-[var(--paper)]">{t("تحدث مع فريق المشاريع", "Talk to our projects team")}<ArrowRight className="mx-2 inline-block" size={18} /></button><ActionLink href="#capabilities" className="vb-focus border border-[var(--paper)]/40 px-7 py-4 font-bold hover:border-[var(--signal)] hover:text-[var(--signal)]">{t("اكتشف قدراتنا", "Explore capability")}</ActionLink></div>
            </div>
          </div>
          <div className="absolute bottom-7 left-0 right-0"><div className="vb-container flex items-center justify-between"><div className="flex items-center gap-3" dir="ltr">{slides.map((_, index) => <button key={index} className="vb-focus h-1.5 transition-all" style={{ width: index === slide ? 48 : 20, background: index === slide ? "var(--signal)" : "rgba(244,242,236,.45)" }} onClick={() => setSlide(index)} aria-label={`Slide ${index + 1}`} />)}</div><div className="flex items-center gap-2" dir="ltr"><button className="vb-focus border border-[var(--paper)]/30 p-2" onClick={previous} aria-label="Previous slide">{rtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button><button className="vb-focus border border-[var(--paper)]/30 p-2" onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause slideshow" : "Play slideshow"}>{playing ? <Pause size={16} /> : <Play size={16} />}</button><button className="vb-focus border border-[var(--paper)]/30 p-2" onClick={next} aria-label="Next slide">{rtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</button></div></div></div>
        </section>

        <section className="border-b border-[var(--line)] bg-[var(--paper-deep)] py-8"><div className="vb-container grid grid-cols-2 gap-6 md:grid-cols-4"><div className="vb-stat"><strong className="vb-serif block text-4xl">24/7</strong><span className="text-sm text-[var(--ink-soft)]">{t("جاهزية التوريد", "Supply readiness")}</span></div><div className="vb-stat"><strong className="vb-serif block text-4xl">01</strong><span className="text-sm text-[var(--ink-soft)]">{t("شريك مشروع واحد", "One project partner")}</span></div><div className="vb-stat"><strong className="vb-serif block text-4xl">KSA</strong><span className="text-sm text-[var(--ink-soft)]">{t("خبرة محلية", "Local intelligence")}</span></div><div className="vb-stat"><strong className="vb-serif block text-4xl">ISO</strong><span className="text-sm text-[var(--ink-soft)]">{t("عقلية جودة", "Quality mindset")}</span></div></div></section>

        <section id="capabilities" className="vb-container grid gap-14 py-24 md:grid-cols-[.8fr_1.2fr] md:py-32"><div><p className="vb-eyebrow">{t("لماذا الوطن", "Why AlWatan")}</p><h2 className="vb-serif mt-5 text-5xl leading-none md:text-6xl">{t("قوة صناعية، بعقلية شريك.", "Industrial strength, partner mindset.")}</h2><p className="mt-7 max-w-md leading-8 text-[var(--ink-soft)]">{t("نحضر في المراحل التي لا تحتمل التأخير: من ضبط الخلطة إلى آخر شاحنة في الموقع.", "We show up where delays are not an option—from mix design to the final truck on site.")}</p><ActionLink href="#contact" className="mt-8 inline-flex items-center gap-2 border-b-2 border-[var(--signal)] pb-2 font-extrabold">{t("تعرّف على طريقة عملنا", "See how we work")} {rtl ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}</ActionLink></div><div className="grid gap-8 md:grid-cols-2"><article className="border-t-4 border-[var(--signal)] pt-5"><span className="vb-serif text-5xl">01</span><h3 className="mt-5 text-xl font-extrabold">{t("هندسة تفهم الموقع", "Engineering that reads the site")}</h3><p className="mt-3 leading-7 text-[var(--ink-soft)]">{t("مختبرات وفنيون يترجمون المواصفات إلى أداء يمكن قياسه.", "Labs and technicians translating specifications into measurable performance.")}</p></article><article className="border-t-4 border-[var(--signal)] pt-5"><span className="vb-serif text-5xl">02</span><h3 className="mt-5 text-xl font-extrabold">{t("أسطول يعرف الطريق", "A fleet that knows the route")}</h3><p className="mt-3 leading-7 text-[var(--ink-soft)]">{t("تنسيق لوجستي واضح يبقي الإمداد متقدماً على صبّتك.", "Clear logistics that keep supply ahead of your pour.")}</p></article></div></section>

        <section id="proof" className="bg-[var(--ink)] py-24 text-[var(--paper)] md:py-32"><div className="vb-container"><div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="vb-eyebrow !text-[var(--signal)]">{t("شاهد العمل", "See the work")}</p><h2 className="vb-serif mt-4 text-5xl md:text-6xl">{t("الثقة تُبنى على أرض الواقع.", "Trust is built on the ground.")}</h2></div><p className="max-w-sm leading-7 text-[var(--paper)]/60">{t("من المصنع إلى الموقع، تفاصيلنا التشغيلية تصنع النتيجة النهائية.", "From plant to site, operational details shape the final result.")}</p></div><div className="grid gap-8 md:grid-cols-2">{[["company-voice.webm", "slider-project-night.png", t("صوت الوطن", "The AlWatan voice")], ["company-music.webm", "slider-branch-night.png", t("منظومة تعمل", "A system in motion")]].map(([video, poster, title]) => <article key={video} className="overflow-hidden border border-[var(--paper)]/15 bg-[var(--paper)]/5"><div className="aspect-video"><video controls playsInline preload="metadata" poster={asset(poster)} className="aw-video"><source src={asset(video)} type="video/webm" /><source src={asset(video.replace(".webm", ".mp4"))} type="video/mp4" /></video></div><h3 className="p-5 text-xl font-bold">{title}</h3></article>)}</div></div></section>

        <section id="products" className="vb-container py-24 md:py-32"><div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="vb-eyebrow">{t("المنتجات", "The range")}</p><h2 className="vb-serif mt-4 text-5xl md:text-6xl">{t("خلطات لكل قرار هندسي.", "A mix for every engineering decision.")}</h2></div><ActionLink href="#quote" onClick={() => { setQuoteOpen(true); setSent(false); }} className="font-extrabold underline decoration-[var(--signal)] decoration-4 underline-offset-8">{t("اطلب توصية فنية", "Ask for a technical recommendation")}</ActionLink></div><div className="grid gap-5 md:grid-cols-3">{products.map(([number, ar, en, arDesc, enDesc, image]) => <ActionLink key={number} href="#quote" onClick={() => { setQuoteOpen(true); setSent(false); }} className="group vb-focus block border border-[var(--line)] bg-[#fbfaf6]"><div className="relative aspect-[1.35] overflow-hidden"><img src={asset(image)} alt={rtl ? ar : en} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /><span className="absolute start-4 top-4 bg-[var(--signal)] px-3 py-1 text-xs font-extrabold">{number}</span></div><div className="p-6"><h3 className="text-xl font-extrabold">{rtl ? ar : en}</h3><p className="mt-3 leading-7 text-[var(--ink-soft)]">{rtl ? arDesc : enDesc}</p><span className="mt-6 inline-flex items-center gap-2 font-extrabold">{t("اعرف المزيد", "Learn more")} {rtl ? <ArrowLeft size={17} /> : <ArrowRight size={17} />}</span></div></ActionLink>)}</div></section>

        <section id="contact" className="bg-[var(--signal)] py-20"><div className="vb-container flex flex-col items-start justify-between gap-8 md:flex-row md:items-center"><div><p className="text-xs font-extrabold tracking-[.18em] text-[var(--ink)]/70">{t("خطوتك التالية", "YOUR NEXT POUR")}</p><h2 className="vb-serif mt-3 text-5xl leading-none md:text-6xl">{t("لنبدأ من المخطط.", "Let's start with the plan.")}</h2></div><button onClick={() => { setQuoteOpen(true); setSent(false); }} className="vb-focus bg-[var(--ink)] px-8 py-5 font-extrabold text-[var(--paper)] hover:bg-[var(--paper)] hover:text-[var(--ink)]">{t("تحدث مع الوطن", "Talk to AlWatan")} {rtl ? <ArrowLeft className="mx-2 inline" size={18} /> : <ArrowRight className="mx-2 inline" size={18} />}</button></div></section>
      </main>

      <footer className="bg-[var(--ink)] py-14 text-[var(--paper)]"><div className="vb-container grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]"><div><img src={asset("brand-logo.png")} alt="AlWatan Ready-Mix" className="mb-6 h-14 w-auto bg-[var(--paper)] p-2" /><p className="max-w-md leading-7 text-[var(--paper)]/60">{t("حلول خرسانية عالية الأداء للمشاريع التي تبني مستقبل المملكة.", "High-performance concrete solutions for the projects building Saudi Arabia's future.")}</p></div><div><h3 className="mb-5 font-extrabold text-[var(--signal)]">{t("استكشف", "Explore")}</h3>{nav.slice(1).map(([href, label]) => <ActionLink key={href} href={href} className="vb-muted-link mb-3 block">{label}</ActionLink>)}</div><div><h3 className="mb-5 font-extrabold text-[var(--signal)]">{t("تواصل", "Contact")}</h3><p className="vb-muted-link leading-8">info@alwatanreadymix.com<br /><span dir="ltr">+966 50 000 0000</span><br />{t("الرياض، المملكة العربية السعودية", "Riyadh, Saudi Arabia")}</p></div></div><div className="vb-container mt-12 border-t border-[var(--paper)]/15 pt-6 text-xs text-[var(--paper)]/45">© {new Date().getFullYear()} {t("شركة مصنع الوطن للخرسانة الجاهزة. جميع الحقوق محفوظة.", "AlWatan Ready-Mix Concrete Co. All rights reserved.")}</div></footer>

      {quoteOpen && <div className="vb-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="quote-title"><div className="vb-modal relative w-full max-w-lg bg-[var(--paper)] p-7 md:p-10"><button onClick={() => setQuoteOpen(false)} className="vb-focus absolute end-5 top-5" aria-label={t("إغلاق", "Close")}><X /></button>{sent ? <div className="py-10 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center bg-[var(--signal)]"><Check /></div><h2 className="vb-serif mt-6 text-4xl" id="quote-title">{t("وصل طلبك.", "Request received.")}</h2><p className="mt-4 leading-7 text-[var(--ink-soft)]">{t("سيتواصل معك فريق المشاريع قريباً.", "Our projects team will be in touch shortly.")}</p><button onClick={() => setQuoteOpen(false)} className="mt-7 border border-[var(--line)] px-6 py-3 font-bold">{t("إغلاق", "Close")}</button></div> : <><p className="vb-eyebrow">{t("مشروع جديد", "New project")}</p><h2 className="vb-serif mt-3 text-5xl" id="quote-title">{t("حدثنا عن صبّتك.", "Tell us about your pour.")}</h2><form onSubmit={submit} className="mt-8 space-y-4"><label className="block text-sm font-bold">{t("الاسم", "Name")}<input className="vb-input mt-2" required /></label><label className="block text-sm font-bold">{t("البريد الإلكتروني", "Email")}<input type="email" className="vb-input mt-2" required /></label><label className="block text-sm font-bold">{t("تفاصيل المشروع", "Project details")}<textarea className="vb-input mt-2 min-h-24 resize-y" required /></label><button className="vb-focus w-full bg-[var(--signal)] px-5 py-4 font-extrabold hover:bg-[var(--signal-deep)]">{t("إرسال الطلب", "Send request")}</button></form></>}</div></div>}
    </div>
  );
}

export default VariantB;