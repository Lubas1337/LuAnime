import { NextRequest, NextResponse } from 'next/server';
import { loadServerAnalytics, getServerRealtimeVisitors } from '@/lib/analytics/server-storage';
import type { AnalyticsOverview } from '@/lib/analytics/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const data = loadServerAnalytics();
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];

    // Today stats
    const todayStats = data.dailyStats[today] || {
      pageViews: 0,
      uniqueVisitors: 0,
      totalClicks: 0,
      topPages: [],
      topReferrers: [],
      sessions: [],
    };

    // Week stats
    let weekPageViews = 0;
    let weekClicks = 0;
    const weekSessions = new Set<string>();
    const allTopPages: Record<string, number> = {};
    const allReferrers: Record<string, number> = {};
    const dailyData: { date: string; pageViews: number; visitors: number; clicks: number }[] = [];

    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const stats = data.dailyStats[date];

      if (stats) {
        weekPageViews += stats.pageViews;
        weekClicks += stats.totalClicks;
        stats.sessions.forEach(s => weekSessions.add(s));

        stats.topPages.forEach(p => {
          allTopPages[p.path] = (allTopPages[p.path] || 0) + p.views;
        });

        stats.topReferrers.forEach(r => {
          allReferrers[r.referrer] = (allReferrers[r.referrer] || 0) + r.count;
        });

        dailyData.push({
          date,
          pageViews: stats.pageViews,
          visitors: stats.uniqueVisitors,
          clicks: stats.totalClicks,
        });
      } else {
        dailyData.push({
          date,
          pageViews: 0,
          visitors: 0,
          clicks: 0,
        });
      }
    }

    const topPages = Object.entries(allTopPages)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const topReferrers = Object.entries(allReferrers)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent activity (last 50)
    const recentPageViews = data.pageViews
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);

    const recentClicks = data.clicks
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);

    // Active sessions (devices info)
    const realtimeWindow = 5 * 60 * 1000;
    const activeSessions = Object.values(data.sessions)
      .filter(s => now - s.lastActivity < realtimeWindow)
      .map(s => ({
        id: s.id.substring(0, 8),
        userAgent: s.userAgent,
        lastActivity: s.lastActivity,
        pageViews: s.pageViews,
        screenWidth: s.screenWidth,
        screenHeight: s.screenHeight,
      }));

    const overview: AnalyticsOverview & { activeSessions: typeof activeSessions } = {
      today: {
        pageViews: todayStats.pageViews,
        uniqueVisitors: todayStats.uniqueVisitors,
        clicks: todayStats.totalClicks,
      },
      week: {
        pageViews: weekPageViews,
        uniqueVisitors: weekSessions.size,
        clicks: weekClicks,
      },
      realtimeVisitors: getServerRealtimeVisitors(),
      topPages,
      topReferrers,
      dailyData,
      recentPageViews,
      recentClicks,
      activeSessions,
    };

    return NextResponse.json(overview);
  } catch (error) {
    console.error('Analytics get error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
