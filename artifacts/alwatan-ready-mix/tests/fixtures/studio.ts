import { vi } from 'vitest';
import type { StudioConfig, StudioState } from '@workspace/api-client-react';

export function fixtureConfig(): StudioConfig {
  return {
    branding: {
      nameAr: 'شركة التجهيز', nameEn: 'Fixture Company', logoUrl: '/fixture-logo.png',
      footerAr: 'تذييل التجهيز', footerEn: 'Fixture footer', phone: '0111111111',
      email: 'published@example.test', whatsapp: '966111111111',
      profileUrl: '/fixture-profile.pdf', facebook: '', instagram: '', linkedin: '',
      seoTitleAr: 'عنوان التجهيز', seoTitleEn: 'Fixture title',
      seoDescriptionAr: 'وصف التجهيز', seoDescriptionEn: 'Fixture description',
    },
    pages: [{
      id: 'builtin-about', slug: 'about', published: true,
      titleAr: 'من نحن التجريبية', titleEn: 'Fixture About',
      descriptionAr: 'وصف من نحن', descriptionEn: 'About description',
      sections: [
        { id: 'story', kind: 'text', headingAr: 'قصتنا', headingEn: 'Our story', bodyAr: 'قصة منشورة', bodyEn: 'Published story', mediaUrl: '', buttonAr: 'اطلب عرضًا', buttonEn: 'Request quote', href: '/quote', visible: true },
        { id: 'hidden', kind: 'text', headingAr: 'قسم مخفي', headingEn: 'Hidden section', bodyAr: 'لا يظهر للزوار', bodyEn: 'Hidden body', mediaUrl: '', buttonAr: '', buttonEn: '', href: '', visible: false },
      ],
    }],
    navigation: [{ id: 'about', labelAr: 'من نحن', labelEn: 'About', href: '/about', visible: true }],
    slides: [{ id: 'slide', imageUrl: '/fixture-slide.png', mobileImageUrl: '', titleAr: '', titleEn: '', subtitleAr: '', subtitleEn: '', buttonAr: '', buttonEn: '', href: '/', enabled: true }],
    homeSections: [], videos: [], banners: [], campaigns: [],
  };
}

// Transport fixture only, not mocked hooks. Unknown requests fail closed.
// Persistence outlives mounted trees/QueryClients to simulate a full reload.
export function installStudioTransport() {
  const config = fixtureConfig();
  let stored: StudioState = {
    draft: structuredClone(config), published: structuredClone(config),
    updatedAt: null, publishedAt: null,
  };
  const requests: { path: string; method: string; body: unknown }[] = [];
  let saveFailure = false;
  let publishFailure = false;
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input), 'http://fixture.test').pathname;
    const method = init?.method?.toUpperCase() ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    requests.push({ path, method, body });
    const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
    if (path === '/api/auth/me' && method === 'GET') return json({ user: { id: 1, username: 'fixture-admin', name: 'Fixture admin', role: 'admin', permissions: [], isActive: true } });
    if (path === '/api/admin/studio' && method === 'GET') return json(stored);
    if (path === '/api/admin/studio' && method === 'PUT') {
      if (saveFailure) return json({ error: 'Fixture save failure' }, 500);
      stored = { ...stored, draft: structuredClone(body.config), updatedAt: '2026-01-01T00:00:00Z' };
      return json(stored);
    }
    if (path === '/api/admin/studio/publish' && method === 'POST') {
      if (publishFailure) return json({ error: 'Fixture publish failure' }, 500);
      stored = { ...stored, published: structuredClone(stored.draft), publishedAt: '2026-01-01T00:01:00Z' };
      return json(stored);
    }
    if (path === '/api/public/studio' && method === 'GET') {
      const config = structuredClone(stored.published);
      return json({
        ...config, pages: config.pages.filter(p => p.published), campaigns: [],
        navigation: config.navigation.filter(n => n.visible && (!(n.href === '/about' || n.href.startsWith('/p/')) ||
          config.pages.some(p => p.published && n.href === (p.slug === 'about' ? '/about' : `/p/${p.slug}`)))),
      });
    }
    if (path === '/api/admin/settings' && method === 'GET') return json({ quoteEmail: 'notifications@example.test' });
    throw new Error(`Unexpected fixture request: ${method} ${path}`);
  });
  vi.stubGlobal('fetch', fetch);
  return {
    requests, snapshot: () => structuredClone(stored),
    failSave: (fail: boolean) => { saveFailure = fail; },
    failPublish: (fail: boolean) => { publishFailure = fail; },
  };
}
