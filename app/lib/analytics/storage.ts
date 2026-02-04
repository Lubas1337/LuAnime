import type { AnalyticsData, Session, PageView, ClickEvent, DailyStats } from './types';

const STORAGE_KEY = 'luwatch_analytics';
const RETENTION_DAYS = 7;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function getInitialData(): AnalyticsData {
  return {
    sessions: {},
    pageViews: [],
    clicks: [],
    dailyStats: {},
    lastCleanup: Date.now(),
  };
}

export function loadAnalytics(): AnalyticsData {
  if (typeof window === 'undefined') return getInitialData();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getInitialData();

    const data = JSON.parse(stored) as AnalyticsData;
    return cleanupOldData(data);
  } catch {
    return getInitialData();
  }
}

export function saveAnalytics(data: AnalyticsData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // Storage full, try cleanup
    const cleaned = cleanupOldData(data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    } catch {
      // Still full, clear old data more aggressively
      console.warn('Analytics storage full');
    }
  }
}

function cleanupOldData(data: AnalyticsData): AnalyticsData {
  const now = Date.now();
  const cutoff = now - RETENTION_DAYS * 24 * 60 * 60 * 1000;

  // Only cleanup once per hour
  if (now - data.lastCleanup < 60 * 60 * 1000) {
    return data;
  }

  // Clean old page views
  data.pageViews = data.pageViews.filter(pv => pv.timestamp > cutoff);

  // Clean old clicks
  data.clicks = data.clicks.filter(c => c.timestamp > cutoff);

  // Clean old sessions
  const activeSessions: Record<string, Session> = {};
  Object.entries(data.sessions).forEach(([id, session]) => {
    if (session.lastActivity > cutoff) {
      activeSessions[id] = session;
    }
  });
  data.sessions = activeSessions;

  // Clean old daily stats
  const cutoffDate = new Date(cutoff).toISOString().split('T')[0];
  const cleanedStats: Record<string, DailyStats> = {};
  Object.entries(data.dailyStats).forEach(([date, stats]) => {
    if (date >= cutoffDate) {
      cleanedStats[date] = stats;
    }
  });
  data.dailyStats = cleanedStats;

  data.lastCleanup = now;

  return data;
}

export function getOrCreateSession(data: AnalyticsData): { session: Session; isNew: boolean } {
  if (typeof window === 'undefined') {
    return {
      session: {
        id: 'server',
        startTime: Date.now(),
        lastActivity: Date.now(),
        userAgent: '',
        language: '',
        screenWidth: 0,
        screenHeight: 0,
        pageViews: 0,
      },
      isNew: false,
    };
  }

  // Try to find existing session from sessionStorage
  const existingSessionId = sessionStorage.getItem('luwatch_session_id');

  if (existingSessionId && data.sessions[existingSessionId]) {
    const session = data.sessions[existingSessionId];
    const now = Date.now();

    // Check if session is still valid (not timed out)
    if (now - session.lastActivity < SESSION_TIMEOUT) {
      session.lastActivity = now;
      return { session, isNew: false };
    }
  }

  // Create new session
  const newSession: Session = {
    id: generateSessionId(),
    startTime: Date.now(),
    lastActivity: Date.now(),
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    pageViews: 0,
  };

  sessionStorage.setItem('luwatch_session_id', newSession.id);
  data.sessions[newSession.id] = newSession;

  return { session: newSession, isNew: true };
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function recordPageView(
  data: AnalyticsData,
  session: Session,
  path: string,
  title: string,
  referrer?: string
): void {
  const pageView: PageView = {
    path,
    title,
    timestamp: Date.now(),
    sessionId: session.id,
    referrer,
  };

  data.pageViews.push(pageView);
  session.pageViews++;
  session.lastActivity = Date.now();

  // Update daily stats
  updateDailyStats(data, session.id, 'pageView', path, referrer);
}

export function recordClick(
  data: AnalyticsData,
  session: Session,
  path: string,
  element: string,
  text?: string
): void {
  const click: ClickEvent = {
    path,
    element,
    text,
    timestamp: Date.now(),
    sessionId: session.id,
  };

  data.clicks.push(click);
  session.lastActivity = Date.now();

  // Update daily stats
  updateDailyStats(data, session.id, 'click');
}

function updateDailyStats(
  data: AnalyticsData,
  sessionId: string,
  type: 'pageView' | 'click',
  path?: string,
  referrer?: string
): void {
  const today = new Date().toISOString().split('T')[0];

  if (!data.dailyStats[today]) {
    data.dailyStats[today] = {
      date: today,
      pageViews: 0,
      uniqueVisitors: 0,
      totalClicks: 0,
      topPages: [],
      topReferrers: [],
      sessions: [],
    };
  }

  const stats = data.dailyStats[today];

  if (type === 'pageView') {
    stats.pageViews++;

    // Track unique visitors
    if (!stats.sessions.includes(sessionId)) {
      stats.sessions.push(sessionId);
      stats.uniqueVisitors++;
    }

    // Update top pages
    if (path) {
      const pageIndex = stats.topPages.findIndex(p => p.path === path);
      if (pageIndex >= 0) {
        stats.topPages[pageIndex].views++;
      } else {
        stats.topPages.push({ path, views: 1 });
      }
      stats.topPages.sort((a, b) => b.views - a.views);
      stats.topPages = stats.topPages.slice(0, 10);
    }

    // Update referrers
    if (referrer && referrer !== '' && !referrer.includes(window.location.host)) {
      const refIndex = stats.topReferrers.findIndex(r => r.referrer === referrer);
      if (refIndex >= 0) {
        stats.topReferrers[refIndex].count++;
      } else {
        stats.topReferrers.push({ referrer, count: 1 });
      }
      stats.topReferrers.sort((a, b) => b.count - a.count);
      stats.topReferrers = stats.topReferrers.slice(0, 10);
    }
  } else if (type === 'click') {
    stats.totalClicks++;
  }
}

export function getRealtimeVisitors(data: AnalyticsData): number {
  const now = Date.now();
  const realtimeWindow = 5 * 60 * 1000; // 5 minutes

  const activeSessionIds = new Set<string>();
  data.pageViews.forEach(pv => {
    if (now - pv.timestamp < realtimeWindow) {
      activeSessionIds.add(pv.sessionId);
    }
  });

  return activeSessionIds.size;
}
