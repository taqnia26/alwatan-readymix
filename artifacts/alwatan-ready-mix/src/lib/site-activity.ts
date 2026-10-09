import { recordSiteActivity } from '@workspace/api-client-react';

export type SiteEvent = 'page_view' | 'whatsapp_click' | 'quote_click' | 'profile_download' | 'contact_submit' | 'quote_submit';
let fallbackSession: string | undefined;

export function trackSiteActivity(event: SiteEvent, path = window.location.pathname): void {
  if (navigator.doNotTrack === '1' || path.startsWith('/admin')) return;
  try {
    let sessionId: string;
    let source = 'direct', campaign = '';
    const query = new URLSearchParams(window.location.search);
    const clean = (value: string | null) => (value || '').replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 100);
    try {
      sessionId = sessionStorage.getItem('alwatan-activity-session') || crypto.randomUUID();
      sessionStorage.setItem('alwatan-activity-session', sessionId);
      source = clean(query.get('utm_source')) || sessionStorage.getItem('alwatan-activity-source') || 'direct';
      campaign = clean(query.get('utm_campaign')) || sessionStorage.getItem('alwatan-activity-campaign') || '';
      if (source === 'direct' && document.referrer) {
        const referrer = new URL(document.referrer);
        if (referrer.hostname !== window.location.hostname) source = clean(referrer.hostname);
      }
      sessionStorage.setItem('alwatan-activity-source', source);
      sessionStorage.setItem('alwatan-activity-campaign', campaign);
    } catch {
      fallbackSession ??= crypto.randomUUID();
      sessionId = fallbackSession;
    }
    const safePath = path.split('?')[0].replace(/[^a-zA-Z0-9/_-]/g, '').slice(0, 300) || '/';
    void recordSiteActivity({ event, sessionId, path: safePath, source, campaign }, {
      keepalive: true,
    }).catch(() => { /* Optional analytics must never interrupt website usage. */ });
  } catch { /* Storage, network and tracker failures do not affect the website. */ }
}
