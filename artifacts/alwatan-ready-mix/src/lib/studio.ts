import type { StudioConfig, StudioPageSection, StudioHomeSection } from '@workspace/api-client-react';

export const uid = (p = 'id') => `${p}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

export const pageHref = (slug: string) => slug === 'about' ? '/about' : `/p/${slug}`;

export function pick(lang: string, ar: string, en: string) {
  const a = (ar ?? '').trim();
  const e = (en ?? '').trim();
  return lang === 'ar' ? a || e : e || a;
}

export function moveItem<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
export const patchItem = <T,>(arr: T[], i: number, p: Partial<T>): T[] => arr.map((x, k) => (k === i ? { ...x, ...p } : x));
export const removeItem = <T,>(arr: T[], i: number): T[] => arr.filter((_, k) => k !== i);

export function mediaKind(url: string, contentType?: string): 'image' | 'video' | 'pdf' | 'file' {
  const c = contentType || '';
  const u = url.split('?')[0].toLowerCase();
  if (c.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|avif)$/.test(u)) return 'image';
  if (c.startsWith('video/') || /\.(mp4|webm|mov)$/.test(u)) return 'video';
  if (c === 'application/pdf' || u.endsWith('.pdf')) return 'pdf';
  return 'file';
}

export const isExternal = (href: string) => /^(https?:|mailto:|tel:|wa\.me)/i.test(href);

export const newSlide = () => ({ id: uid('slide'), imageUrl: '', mobileImageUrl: '', titleAr: '', titleEn: '', subtitleAr: '', subtitleEn: '', buttonAr: '', buttonEn: '', href: '/quote', enabled: false });
export const newVideo = () => ({ id: uid('video'), titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', src: '', poster: '', enabled: false });
export const newSection = (kind: StudioPageSection['kind'] = 'text'): StudioPageSection => ({ id: uid('sec'), kind, headingAr: '', headingEn: '', bodyAr: '', bodyEn: '', mediaUrl: '', buttonAr: '', buttonEn: '', href: '', visible: true });
export const newHomeSection = (key: StudioHomeSection['key']): StudioHomeSection => ({ id: uid('home'), key, titleAr: '', titleEn: '', bodyAr: '', bodyEn: '', imageUrl: '', href: '', visible: true });
export const newPage = (slug: string) => ({ id: uid('page'), slug, titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', published: false, sections: [newSection('text')] });

export const HOME_KEY_LABELS: Record<string, [string, string]> = {
  intro: ['المقدمة', 'Introduction'],
  products: ['المنتجات', 'Products'],
  videos: ['الفيديوهات', 'Videos'],
  branches: ['الفروع', 'Branches'],
  certificates: ['الاعتمادات', 'Certificates'],
  blog: ['المركز الإعلامي', 'Media center'],
  cta: ['دعوة لاتخاذ إجراء', 'Call to action'],
  custom: ['قسم مخصص', 'Custom block'],
};

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

export type Cfg = StudioConfig;
