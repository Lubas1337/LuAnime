export interface PageView {
  path: string;
  title: string;
  timestamp: number;
  sessionId: string;
  referrer?: string;
}

export interface ClickEvent {
  path: string;
  element: string;
  text?: string;
  timestamp: number;
  sessionId: string;
}

export interface Session {
  id: string;
  startTime: number;
  lastActivity: number;
  userAgent: string;
  language: string;
  screenWidth: number;
  screenHeight: number;
  pageViews: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  pageViews: number;
  uniqueVisitors: number;
  totalClicks: number;
  topPages: { path: string; views: number }[];
  topReferrers: { referrer: string; count: number }[];
  sessions: string[]; // session IDs
}

export interface AnalyticsData {
  sessions: Record<string, Session>;
  pageViews: PageView[];
  clicks: ClickEvent[];
  dailyStats: Record<string, DailyStats>;
  lastCleanup: number;
}

export interface AnalyticsOverview {
  today: {
    pageViews: number;
    uniqueVisitors: number;
    clicks: number;
  };
  week: {
    pageViews: number;
    uniqueVisitors: number;
    clicks: number;
  };
  realtimeVisitors: number;
  topPages: { path: string; views: number }[];
  topReferrers: { referrer: string; count: number }[];
  dailyData: { date: string; pageViews: number; visitors: number; clicks: number }[];
  recentPageViews: PageView[];
  recentClicks: ClickEvent[];
}
