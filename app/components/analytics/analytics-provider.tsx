'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  loadAnalytics,
  saveAnalytics,
  getOrCreateSession,
  recordPageView,
  recordClick,
} from '@/lib/analytics';

const PAGE_VIEW_COOLDOWN = 60 * 1000; // 1 minute - don't count same page twice within this time

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lastPathRef = useRef<string>('');
  const lastViewTimeRef = useRef<number>(0);
  const dataRef = useRef(loadAnalytics());
  const sessionRef = useRef<ReturnType<typeof getOrCreateSession> | null>(null);
  const initializedRef = useRef(false);

  // Initialize session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initializedRef.current) return;

    initializedRef.current = true;
    const data = loadAnalytics();
    dataRef.current = data;
    sessionRef.current = getOrCreateSession(data);
    saveAnalytics(data);
  }, []);

  // Track page views
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!sessionRef.current) return;

    const now = Date.now();
    const isSamePage = pathname === lastPathRef.current;
    const isTooSoon = now - lastViewTimeRef.current < PAGE_VIEW_COOLDOWN;

    // Skip if same page and within cooldown
    if (isSamePage && isTooSoon) return;

    lastPathRef.current = pathname;
    lastViewTimeRef.current = now;

    const data = dataRef.current;
    const { session } = sessionRef.current;

    recordPageView(
      data,
      session,
      pathname,
      document.title,
      document.referrer || undefined
    );
    saveAnalytics(data);
  }, [pathname]);

  // Track clicks
  const handleClick = useCallback((e: MouseEvent) => {
    if (!sessionRef.current) return;

    const target = e.target as HTMLElement;
    if (!target) return;

    // Only track meaningful clicks (links, buttons, interactive elements)
    const clickable = target.closest('a, button, [role="button"], [onclick]');
    if (!clickable) return;

    const data = dataRef.current;
    const { session } = sessionRef.current;

    const element = clickable.tagName.toLowerCase();
    const text = (clickable.textContent || '').trim().substring(0, 50);
    const href = clickable.getAttribute('href');

    recordClick(
      data,
      session,
      pathname,
      href ? `${element}[href="${href}"]` : element,
      text || undefined
    );
    saveAnalytics(data);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.addEventListener('click', handleClick, { passive: true });
    return () => document.removeEventListener('click', handleClick);
  }, [handleClick]);

  // Save data periodically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const interval = setInterval(() => {
      saveAnalytics(dataRef.current);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Save data before unload
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUnload = () => {
      saveAnalytics(dataRef.current);
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return <>{children}</>;
}
