import type { ReactNode, MouseEvent } from 'react';
import { Link } from 'wouter';
import { isExternal } from '@/lib/studio';
import { trackSiteActivity } from '@/lib/site-activity';

export function trackForHref(href: string) {
  if (/wa\.me|whatsapp/i.test(href)) trackSiteActivity('whatsapp_click');
  else if (href === '/quote' || href.startsWith('/quote?')) trackSiteActivity('quote_click');
}

export default function SmartLink({ href, className, children, onClick, testId }: {
  href: string; className?: string; children: ReactNode; onClick?: (e: MouseEvent) => void; testId?: string;
}) {
  const handle = (e: MouseEvent) => { trackForHref(href); onClick?.(e); };
  if (!href) return <span className={className}>{children}</span>;
  if (isExternal(href)) {
    return <a href={href} className={className} target="_blank" rel="noreferrer" onClick={handle} data-testid={testId}>{children}</a>;
  }
  return <Link href={href} className={className} onClick={handle} data-testid={testId}>{children}</Link>;
}
