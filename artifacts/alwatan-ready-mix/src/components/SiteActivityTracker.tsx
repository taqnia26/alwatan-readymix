import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { trackSiteActivity } from '@/lib/site-activity';

export default function SiteActivityTracker() {
  const [location] = useLocation();
  const lastPath = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (lastPath.current === location) return;
    lastPath.current = location;
    trackSiteActivity('page_view', location);
  }, [location]);
  return null;
}
