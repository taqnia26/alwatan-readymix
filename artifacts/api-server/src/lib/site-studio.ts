import { db, siteSettingsTable, pageContentTable } from "@workspace/db";
import { inArray } from "drizzle-orm";
import { GetPublicStudioResponse } from "@workspace/api-zod";
import type { StudioConfig } from "@workspace/api-zod";

export const STUDIO_KEYS = {
  draft: "studio_draft",
  published: "studio_published",
  updatedAt: "studio_updated_at",
  publishedAt: "studio_published_at",
};

// Upgrade only bundled slider artwork, including previously saved studio configs.
// Uploaded/custom images and other uses of the original posters are unchanged.
const HERO_IMAGES: Record<string, string> = {
  "/media/slider-fleet-day.png": "/media/hero-ai-day-fleet.webp",
  "/media/slider-yard-mobile.png": "/media/hero-ai-day-fleet.webp",
  "/media/slider-project-night.png": "/media/hero-ai-night-project.webp",
  "/media/slider-plant-mobile.png": "/media/hero-ai-night-project.webp",
  "/media/slider-branch-night.png": "/media/hero-ai-riyadh-branch.webp",
  "/media/slider-fleet-night.png": "/media/hero-ai-night-plant.webp",
};

export async function defaultStudio(): Promise<StudioConfig> {
  const [settings, content] = await Promise.all([
    db.select().from(siteSettingsTable),
    db.select().from(pageContentTable).where(inArray(pageContentTable.pageSlug, ["home", "about"])),
  ]);
  const values = Object.fromEntries(settings.map(row => [row.key, row.value]));
  const copy = (section: string, field: string, lang: "Ar" | "En", fallback: string) =>
    content.find(row => row.pageSlug === "home" && row.sectionKey === section && row.fieldKey === field)?.[`value${lang}`] || fallback;
  const aboutCopy = (keys: [string, string][], lang: "Ar" | "En", fallback: string) => {
    for (const [sectionKey, fieldKey] of keys) {
      const value = content.find(row => row.pageSlug === "about" && row.sectionKey === sectionKey && row.fieldKey === fieldKey)?.[`value${lang}`];
      if (value) return value;
    }
    return fallback;
  };
  const aboutSection = (id: string, kind: "text" | "image" | "cta", headingAr: string, headingEn: string, bodyAr: string, bodyEn: string, mediaUrl = "") => ({
    id, kind, headingAr, headingEn, bodyAr, bodyEn, mediaUrl,
    buttonAr: "", buttonEn: "", href: "", visible: true,
  });
  const titles = [
    ["خرسانة تبني الثقة", "Concrete that builds trust"],
    ["شريك مشاريعك الكبرى", "Your partner for major projects"],
    ["قريبون من مشاريعكم", "Closer to your projects"],
    ["جودة في كل خطوة", "Quality at every step"],
  ];
  const slides = ["slider-fleet-day", "slider-project-night", "slider-branch-night", "slider-fleet-night"].map((name, i) => ({
    id: `slide-${i + 1}`, imageUrl: HERO_IMAGES[`/media/${name}.png`],
    mobileImageUrl: HERO_IMAGES[`/media/${name}.png`],
    titleAr: titles[i][0], titleEn: titles[i][1],
    subtitleAr: "حلول خرسانة جاهزة موثوقة لمشاريع الرياض",
    subtitleEn: "Reliable ready-mix solutions for Riyadh's projects",
    buttonAr: "اطلب تسعير مشروعك", buttonEn: "Request a quote", href: "/quote", enabled: true,
  }));
  return {
    branding: {
      nameAr: "مصنع الوطن للخرسانة الجاهزة", nameEn: "AlWatan Ready-Mix",
      logoUrl: "/logo.png",
      footerAr: "حلول خرسانة جاهزة بمعايير جودة عالية، نبني معكم مستقبل مشاريعكم.",
      footerEn: "Quality ready-mix concrete. Building the future of your projects together.",
      phone: values.phone || "0595999659", email: values.email || "info@alwatan2030.com",
      whatsapp: values.whatsapp || "966595999659",
      profileUrl: "/alwatan-company-profile.pdf",
      facebook: "", instagram: values.instagramUrl || "", linkedin: values.linkedinUrl || "",
      seoTitleAr: "مصنع الوطن للخرسانة الجاهزة | الرياض",
      seoTitleEn: "AlWatan Ready-Mix | Riyadh",
      seoDescriptionAr: "مصنع الوطن للخرسانة الجاهزة في الرياض يقدم حلول خرسانة موثوقة بمعايير جودة عالية للمشاريع الإنشائية.",
      seoDescriptionEn: "Reliable ready-mix concrete solutions for construction projects in Riyadh.",
    },
    navigation: [
      ["home", "الرئيسية", "Home", "/"], ["about", "من نحن", "About", "/about"],
      ["products", "المنتجات", "Products", "/products"], ["branches", "الفروع", "Branches", "/branches"],
      ["certificates", "الشهادات", "Certificates", "/certificates"],
      ["blog", "المقالات", "Articles", "/blog"], ["contact", "تواصل معنا", "Contact", "/contact"],
    ].map(([id, labelAr, labelEn, href]) => ({ id, labelAr, labelEn, href, visible: true })),
    slides,
    videos: [
      { id: "video-voice", titleAr: "تعرف على مصنع الوطن", titleEn: "Meet AlWatan", descriptionAr: "نظرة على إمكاناتنا وخدماتنا", descriptionEn: "Discover our capabilities and services", src: "/media/company-voice.mp4", poster: "/media/slider-project-night.png", enabled: true },
      { id: "video-music", titleAr: "الوطن في الميدان", titleEn: "AlWatan in action", descriptionAr: "الجودة من المصنع إلى مشروعك", descriptionEn: "Quality from our plant to your project", src: "/media/company-music.mp4", poster: "/media/slider-branch-night.png", enabled: true },
    ],
    homeSections: [
      { id: "intro", key: "intro", titleAr: copy("intro", "title", "Ar", "نصنع الخرسانة. ونبني الثقة."), titleEn: copy("intro", "title", "En", "We make concrete. We build trust."), bodyAr: copy("intro", "subtitle", "Ar", "في مصنع الوطن نوفر حلول الخرسانة الجاهزة التي تلبي متطلبات مشاريعكم، من الإنتاج وحتى التوريد للموقع."), bodyEn: copy("intro", "subtitle", "En", "From production to delivery, AlWatan supplies ready-mix concrete that meets your project's requirements."), imageUrl: "/construction-1.png", href: "/about", visible: true },
      { id: "products", key: "products", titleAr: "حلول لكل مشروع", titleEn: "Solutions for every project", bodyAr: "منتجات الخرسانة الجاهزة", bodyEn: "Ready-mix concrete products", imageUrl: "", href: "/products", visible: true },
      { id: "videos", key: "videos", titleAr: "شاهد الوطن عن قرب", titleEn: "A closer look at AlWatan", bodyAr: "من أرض المصنع إلى مشاريعكم", bodyEn: "From our plants to your projects", imageUrl: "", href: "", visible: true },
      { id: "branches", key: "branches", titleAr: "أقرب لمشروعك", titleEn: "Closer to your project", bodyAr: "اكتشف مواقع فروعنا", bodyEn: "Discover our branches", imageUrl: "", href: "/branches", visible: true },
      { id: "certificates", key: "certificates", titleAr: "جودة موثقة", titleEn: "Certified quality", bodyAr: "شهادات واعتمادات تعزز ثقتكم", bodyEn: "Credentials that strengthen your confidence", imageUrl: "", href: "/certificates", visible: true },
      { id: "blog", key: "blog", titleAr: "معرفة تدعم البناء", titleEn: "Knowledge that supports construction", bodyAr: "أحدث المقالات والأخبار", bodyEn: "Latest articles and news", imageUrl: "", href: "/blog", visible: true },
      { id: "cta", key: "cta", titleAr: "مشروعك القادم يبدأ هنا", titleEn: "Your next project starts here", bodyAr: "تحدث مع فريقنا عن احتياجات مشروعك", bodyEn: "Talk to our team about your project", imageUrl: "", href: "/quote", visible: true },
    ],
    pages: [{
      id: "builtin-about", slug: "about", published: true,
      titleAr: aboutCopy([["intro", "title"]], "Ar", "عن شركة الوطن"),
      titleEn: aboutCopy([["intro", "title"]], "En", "About AlWatan"),
      descriptionAr: "رواد صناعة الخرسانة الجاهزة في المملكة العربية السعودية",
      descriptionEn: "Pioneers of Ready-Mix Concrete in Saudi Arabia",
      sections: [
        aboutSection("about-story", "image",
          aboutCopy([["story", "title"]], "Ar", "قصتنا"),
          aboutCopy([["story", "title"]], "En", "Our Story"),
          aboutCopy([["story", "content"], ["intro", "body"]], "Ar", "تأسست شركة الوطن لتقديم حلول الخرسانة الجاهزة بجودة موثوقة والتزام بمشاريع شركائنا."),
          aboutCopy([["story", "content"], ["intro", "body"]], "En", "AlWatan delivers reliable ready-mix concrete with a commitment to our partners' projects."),
          aboutCopy([["story", "imageUrl"]], "Ar", "/construction-1.png")),
        aboutSection("about-vision", "text",
          aboutCopy([["vision", "title"]], "Ar", "رؤيتنا"),
          aboutCopy([["vision", "title"]], "En", "Our Vision"),
          aboutCopy([["vision", "content"], ["values", "vision"]], "Ar", "أن نكون الخيار الأكثر ثقة لمشاريع المملكة"),
          aboutCopy([["vision", "content"], ["values", "vision"]], "En", "To be the most trusted choice for projects across the Kingdom")),
        aboutSection("about-mission", "text",
          aboutCopy([["mission", "title"]], "Ar", "مهمتنا"),
          aboutCopy([["mission", "title"]], "En", "Our Mission"),
          aboutCopy([["mission", "content"], ["values", "mission"]], "Ar", "نخدم شركاءنا بجودة وسلامة والتزام"),
          aboutCopy([["mission", "content"], ["values", "mission"]], "En", "Serve our partners with quality, safety, and commitment")),
        aboutSection("about-quality", "cta", "الالتزام بالجودة", "Commitment to Quality",
          "نطبق أعلى معايير الجودة في جميع مراحل الإنتاج، من اختيار المواد الخام وحتى تسليم الخرسانة في موقع المشروع.",
          "We apply high quality standards at every production stage, from raw materials to delivery at your project."),
      ],
    }], banners: [], campaigns: [],
  };
}

export async function readStudio() {
  const rows = await db.select().from(siteSettingsTable).where(inArray(siteSettingsTable.key, Object.values(STUDIO_KEYS)));
  const values = Object.fromEntries(rows.map(row => [row.key, row.value]));
  const initial = await defaultStudio();
  const decode = (key: string): StudioConfig => {
    if (!values[key]) return initial;
    const config = GetPublicStudioResponse.parse(JSON.parse(values[key]));
    return {
      ...config,
      pages: config.pages.some(page => page.slug === "about")
        ? config.pages : [...initial.pages, ...config.pages],
      slides: config.slides.map(slide => ({
        ...slide,
        imageUrl: HERO_IMAGES[slide.imageUrl] ?? slide.imageUrl,
        mobileImageUrl: slide.mobileImageUrl
          ? HERO_IMAGES[slide.mobileImageUrl] ?? slide.mobileImageUrl : slide.mobileImageUrl,
      })),
    };
  };
  return {
    draft: decode(STUDIO_KEYS.draft), published: decode(STUDIO_KEYS.published),
    updatedAt: values[STUDIO_KEYS.updatedAt] || null,
    publishedAt: values[STUDIO_KEYS.publishedAt] || null,
  };
}

export function validateStudioLinks(config: StudioConfig): string | null {
  const urls: string[] = [];
  const collect = (value: unknown): void => {
    if (Array.isArray(value)) { value.forEach(collect); return; }
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      if (typeof item === "string" && ["href", "target", "src", "poster", "imageUrl", "mobileImageUrl", "mediaUrl", "logoUrl", "profileUrl", "facebook", "instagram", "linkedin"].includes(key)) urls.push(item);
      else collect(item);
    }
  };
  collect(config);
  for (const url of urls) {
    if (!url) continue;
    if (/^\/(?!\/)[^\s\\]*$/.test(url)) continue;
    try {
      const parsed = new URL(url);
      if ((parsed.protocol === "https:" || parsed.protocol === "http:") && !parsed.username && !parsed.password) continue;
    } catch { /* Invalid URLs rejected below. */ }
    return "الروابط يجب أن تبدأ بـ / أو http:// أو https://";
  }
  if (new Set(config.pages.map(page => page.slug)).size !== config.pages.length) return "مسار الصفحة مكرر";
  if (!config.slides.some(slide => slide.enabled && slide.imageUrl)) return "يجب الإبقاء على شريحة واحدة مفعلة بصورة";
  if (config.slides.some(slide => slide.enabled && !slide.imageUrl)) return "أرفق صورة لكل شريحة مفعلة";
  if (config.videos.some(video => video.enabled && !video.src)) return "أرفق ملفًا لكل فيديو مفعل";
  if (config.pages.some(page => page.published && !page.titleAr.trim())) return "أدخل عنوانًا عربيًا لكل صفحة منشورة";
  for (const items of [config.pages, config.slides, config.videos, config.navigation, config.homeSections, config.banners, config.campaigns]) {
    if (items.some(item => !item.id) || new Set(items.map(item => item.id)).size !== items.length) return "معرّفات عناصر الموقع مكررة أو فارغة";
  }
  return null;
}
