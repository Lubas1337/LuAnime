import fs from 'fs';
import path from 'path';
import type { AnalyticsData, Session, PageView, ClickEvent, DailyStats } from './types';

const DATA_DIR = process.env.ANALYTICS_DATA_DIR || '/tmp/luwatch-analytics';
const DATA_FILE = path.join(DATA_DIR, 'analytics.json');
const RETENTION_DAYS = 7;

// In-memory cache
let cachedData: AnalyticsData | null = null;
let lastSaveTime = 0;
const SAVE_INTERVAL = 5000; // Save to disk every 5 seconds max

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getInitialData(): AnalyticsData {
  return {
    sessions: {},
    pageViews: [],
    clicks: [],
    dailyStats: {},
    lastCleanup: Date.now(),
  };
}

export function loadServerAnalytics(): AnalyticsData {
  if (cachedData) return cachedData;

  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      cachedData = JSON.parse(content) as AnalyticsData;
      cachedData = cleanupOldData(cachedData);
      return cachedData;
    }
  } catch (error) {
    console.error('Failed to load analytics:', error);
  }

  cachedData = getInitialData();
  return cachedData;
}

export function saveServerAnalytics(data: AnalyticsData, force = false): void {
  cachedData = data;

  const now = Date.now();
  // Throttle disk writes
  if (!force && now - lastSaveTime < SAVE_INTERVAL) {
    return;
  }

  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data), 'utf-8');
    lastSaveTime = now;
  } catch (error) {
    console.error('Failed to save analytics:', error);
  }
}

function cleanupOldData(data: AnalyticsData): AnalyticsData {
  const now = Date.now();
  const cutoff = now - RETENTION_DAYS * 24 * 60 * 60 * 1000;

  // Only cleanup once per hour
  if (now - data.lastCleanup < 60 * 60 * 1000) {
    return data;
  }

  // Clean old page views (keep last 10000 max)
  data.pageViews = data.pageViews
    .filter(pv => pv.timestamp > cutoff)
    .slice(-10000);

  // Clean old clicks (keep last 10000 max)
  data.clicks = data.clicks
    .filter(c => c.timestamp > cutoff)
    .slice(-10000);

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

export function recordServerPageView(
  visitorId: string,
  path: string,
  title: string,
  userAgent: string,
  referrer?: string,
  screenWidth?: number,
  screenHeight?: number,
  language?: string
): void {
  const data = loadServerAnalytics();
  const now = Date.now();

  // Get or create session
  if (!data.sessions[visitorId]) {
    data.sessions[visitorId] = {
      id: visitorId,
      startTime: now,
      lastActivity: now,
      userAgent: userAgent || '',
      language: language || '',
      screenWidth: screenWidth || 0,
      screenHeight: screenHeight || 0,
      pageViews: 0,
    };
  }

  const session = data.sessions[visitorId];
  session.lastActivity = now;
  session.pageViews++;

  // Record page view
  const pageView: PageView = {
    path,
    title,
    timestamp: now,
    sessionId: visitorId,
    referrer,
  };
  data.pageViews.push(pageView);

  // Update daily stats
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
  stats.pageViews++;

  if (!stats.sessions.includes(visitorId)) {
    stats.sessions.push(visitorId);
    stats.uniqueVisitors++;
  }

  // Update top pages
  const pageIndex = stats.topPages.findIndex(p => p.path === path);
  if (pageIndex >= 0) {
    stats.topPages[pageIndex].views++;
  } else {
    stats.topPages.push({ path, views: 1 });
  }
  stats.topPages.sort((a, b) => b.views - a.views);
  stats.topPages = stats.topPages.slice(0, 20);

  // Update referrers
  if (referrer && referrer !== '') {
    try {
      const refUrl = new URL(referrer);
      if (!refUrl.hostname.includes('lubax.net') && !refUrl.hostname.includes('localhost')) {
        const refIndex = stats.topReferrers.findIndex(r => r.referrer === referrer);
        if (refIndex >= 0) {
          stats.topReferrers[refIndex].count++;
        } else {
          stats.topReferrers.push({ referrer, count: 1 });
        }
        stats.topReferrers.sort((a, b) => b.count - a.count);
        stats.topReferrers = stats.topReferrers.slice(0, 20);
      }
    } catch {
      // Invalid URL, skip
    }
  }

  saveServerAnalytics(data);
}

export function recordServerClick(
  visitorId: string,
  path: string,
  element: string,
  text?: string
): void {
  const data = loadServerAnalytics();
  const now = Date.now();

  // Update session activity
  if (data.sessions[visitorId]) {
    data.sessions[visitorId].lastActivity = now;
  }

  // Record click
  const click: ClickEvent = {
    path,
    element,
    text,
    timestamp: now,
    sessionId: visitorId,
  };
  data.clicks.push(click);

  // Update daily stats
  const today = new Date().toISOString().split('T')[0];
  if (data.dailyStats[today]) {
    data.dailyStats[today].totalClicks++;
  }

  saveServerAnalytics(data);
}

export function getServerRealtimeVisitors(): number {
  const data = loadServerAnalytics();
  const now = Date.now();
  const realtimeWindow = 5 * 60 * 1000; // 5 minutes

  let count = 0;
  Object.values(data.sessions).forEach(session => {
    if (now - session.lastActivity < realtimeWindow) {
      count++;
    }
  });

  return count;
}
