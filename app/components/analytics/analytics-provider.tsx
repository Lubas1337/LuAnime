'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

const PAGE_VIEW_COOLDOWN = 60 * 1000; // 1 minute

function getVisitorId(): string {
  if (typeof window === 'undefined') return '';

  let visitorId = localStorage.getItem('luwatch_visitor_id');
  if (!visitorId) {
    visitorId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('luwatch_visitor_id', visitorId);
  }
  return visitorId;
}

async function trackEvent(data: Record<string, unknown>) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true,
    });
  } catch {
    // Silently fail
  }
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lastPathRef = useRef<string>('');
  const lastViewTimeRef = useRef<number>(0);
  const visitorIdRef = useRef<string>('');

  // Initialize visitor ID
  useEffect(() => {
    if (typeof window === 'undefined') return;
    visitorIdRef.current = getVisitorId();
  }, []);

  // Track page views
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!visitorIdRef.current) {
      visitorIdRef.current = getVisitorId();
    }

    const now = Date.now();
    const isSamePage = pathname === lastPathRef.current;
    const isTooSoon = now - lastViewTimeRef.current < PAGE_VIEW_COOLDOWN;

    if (isSamePage && isTooSoon) return;

    lastPathRef.current = pathname;
    lastViewTimeRef.current = now;

    trackEvent({
      type: 'pageview',
      visitorId: visitorIdRef.current,
      path: pathname,
      title: document.title,
      referrer: document.referrer || undefined,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
    });
  }, [pathname]);

  // Track clicks
  const handleClick = useCallback((e: MouseEvent) => {
    if (!visitorIdRef.current) return;

    const target = e.target as HTMLElement;
    if (!target) return;

    const clickable = target.closest('a, button, [role="button"]');
    if (!clickable) return;

    const element = clickable.tagName.toLowerCase();
    const text = (clickable.textContent || '').trim().substring(0, 50);
    const href = clickable.getAttribute('href');

    trackEvent({
      type: 'click',
      visitorId: visitorIdRef.current,
      path: pathname,
      element: href ? `${element}[href="${href}"]` : element,
      text: text || undefined,
    });
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.addEventListener('click', handleClick, { passive: true });
    return () => document.removeEventListener('click', handleClick);
  }, [handleClick]);

  return <>{children}</>;
}
