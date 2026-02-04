'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  BarChart3,
  Users,
  MousePointerClick,
  Eye,
  Clock,
  Globe,
  TrendingUp,
  Activity,
  Monitor,
  Smartphone,
} from 'lucide-react';
import type { AnalyticsOverview, PageView, ClickEvent } from '@/lib/analytics/types';

interface ActiveSession {
  id: string;
  userAgent: string;
  lastActivity: number;
  pageViews: number;
  screenWidth: number;
  screenHeight: number;
}

interface ExtendedOverview extends AnalyticsOverview {
  activeSessions: ActiveSession[];
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              trend.isPositive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            <TrendingUp
              className={`h-3 w-3 ${!trend.isPositive && 'rotate-180'}`}
            />
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </div>
    </div>
  );
}

function DailyChart({ data }: { data: { date: string; pageViews: number; visitors: number; clicks: number }[] }) {
  const maxValue = Math.max(...data.map(d => Math.max(d.pageViews, d.visitors, d.clicks)), 1);

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Статистика за неделю</h3>
      </div>

      <div className="flex items-end gap-2 h-48">
        {data.map((day) => {
          const pageViewHeight = (day.pageViews / maxValue) * 100;
          const visitorHeight = (day.visitors / maxValue) * 100;
          const clickHeight = (day.clicks / maxValue) * 100;
          const dateObj = new Date(day.date);
          const dayName = dateObj.toLocaleDateString('ru-RU', { weekday: 'short' });
          const dayNum = dateObj.getDate();

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center gap-1 h-40">
                <div
                  className="w-3 bg-primary/80 rounded-t transition-all hover:bg-primary"
                  style={{ height: `${Math.max(pageViewHeight, 2)}%` }}
                  title={`Просмотры: ${day.pageViews}`}
                />
                <div
                  className="w-3 bg-blue-500/80 rounded-t transition-all hover:bg-blue-500"
                  style={{ height: `${Math.max(visitorHeight, 2)}%` }}
                  title={`Посетители: ${day.visitors}`}
                />
                <div
                  className="w-3 bg-green-500/80 rounded-t transition-all hover:bg-green-500"
                  style={{ height: `${Math.max(clickHeight, 2)}%` }}
                  title={`Клики: ${day.clicks}`}
                />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-foreground">{dayNum}</p>
                <p className="text-xs text-muted-foreground">{dayName}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded" />
          <span className="text-xs text-muted-foreground">Просмотры</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-xs text-muted-foreground">Посетители</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-xs text-muted-foreground">Клики</span>
        </div>
      </div>
    </div>
  );
}

function TopPagesList({ pages }: { pages: { path: string; views: number }[] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Популярные страницы</h3>
      </div>

      <div className="space-y-3">
        {pages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Нет данных
          </p>
        ) : (
          pages.slice(0, 10).map((page, index) => (
            <div
              key={page.path}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-medium text-muted-foreground w-5">
                  {index + 1}
                </span>
                <span className="text-sm text-foreground truncate">
                  {page.path}
                </span>
              </div>
              <span className="text-sm font-medium text-primary ml-2">
                {page.views}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TopReferrersList({ referrers }: { referrers: { referrer: string; count: number }[] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Источники трафика</h3>
      </div>

      <div className="space-y-3">
        {referrers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Прямые заходы
          </p>
        ) : (
          referrers.slice(0, 10).map((ref, index) => {
            let displayName = ref.referrer;
            try {
              const url = new URL(ref.referrer);
              displayName = url.hostname;
            } catch {
              // Keep original
            }

            return (
              <div
                key={ref.referrer}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-medium text-muted-foreground w-5">
                    {index + 1}
                  </span>
                  <span className="text-sm text-foreground truncate">
                    {displayName}
                  </span>
                </div>
                <span className="text-sm font-medium text-primary ml-2">
                  {ref.count}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ActiveSessionsList({ sessions }: { sessions: ActiveSession[] }) {
  const getDeviceInfo = (ua: string, width: number) => {
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua) || width < 768;
    const browser = /Chrome/i.test(ua) ? 'Chrome' :
                    /Firefox/i.test(ua) ? 'Firefox' :
                    /Safari/i.test(ua) ? 'Safari' :
                    /Edge/i.test(ua) ? 'Edge' : 'Other';
    return { isMobile, browser };
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Онлайн сейчас</h3>
        <span className="ml-auto text-sm font-medium text-primary">{sessions.length}</span>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Нет активных посетителей
          </p>
        ) : (
          sessions.map((session) => {
            const { isMobile, browser } = getDeviceInfo(session.userAgent, session.screenWidth);
            const timeAgo = Math.floor((Date.now() - session.lastActivity) / 1000);
            const timeStr = timeAgo < 60 ? `${timeAgo}с назад` : `${Math.floor(timeAgo / 60)}м назад`;

            return (
              <div
                key={session.id}
                className="flex items-center gap-3 py-2 border-b border-border last:border-0"
              >
                <div className={`p-1.5 rounded ${isMobile ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                  {isMobile ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    {browser} • {session.screenWidth}x{session.screenHeight}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.pageViews} просмотров • {timeStr}
                  </p>
                </div>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function RecentActivityList({
  pageViews,
  clicks,
}: {
  pageViews: PageView[];
  clicks: ClickEvent[];
}) {
  const activities = useMemo(() => {
    const all = [
      ...pageViews.map(pv => ({
        type: 'pageView' as const,
        ...pv,
      })),
      ...clicks.map(c => ({
        type: 'click' as const,
        ...c,
      })),
    ];

    return all
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 30);
  }, [pageViews, clicks]);

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Недавняя активность</h3>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Нет активности
          </p>
        ) : (
          activities.map((activity, index) => {
            const time = new Date(activity.timestamp).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={`${activity.timestamp}-${index}`}
                className="flex items-center gap-3 py-2 border-b border-border last:border-0"
              >
                <div
                  className={`p-1.5 rounded ${
                    activity.type === 'pageView'
                      ? 'bg-blue-500/10 text-blue-500'
                      : 'bg-green-500/10 text-green-500'
                  }`}
                >
                  {activity.type === 'pageView' ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <MousePointerClick className="h-3 w-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {activity.path}
                  </p>
                  {activity.type === 'click' && activity.text && (
                    <p className="text-xs text-muted-foreground truncate">
                      Клик: {activity.text}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<ExtendedOverview | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/analytics');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setOverview(data);
        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        setError('Ошибка загрузки данных');
        console.error('Analytics fetch error:', err);
      }
    };

    loadData();

    // Refresh every 3 seconds for realtime updates
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (error && !overview) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Аналитика</h1>
          <p className="text-muted-foreground mt-1">
            Статистика всех посетителей за последние 7 дней
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-green-500">Live</span>
          </div>
          {lastUpdate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {lastUpdate.toLocaleTimeString('ru-RU')}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Онлайн сейчас"
          value={overview.realtimeVisitors}
          icon={Activity}
          description="Активных за 5 мин"
        />
        <StatCard
          title="Просмотры сегодня"
          value={overview.today.pageViews}
          icon={Eye}
        />
        <StatCard
          title="Посетители сегодня"
          value={overview.today.uniqueVisitors}
          icon={Users}
        />
        <StatCard
          title="Клики сегодня"
          value={overview.today.clicks}
          icon={MousePointerClick}
        />
      </div>

      {/* Week Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Просмотры за неделю"
          value={overview.week.pageViews}
          icon={Eye}
        />
        <StatCard
          title="Посетители за неделю"
          value={overview.week.uniqueVisitors}
          icon={Users}
        />
        <StatCard
          title="Клики за неделю"
          value={overview.week.clicks}
          icon={MousePointerClick}
        />
      </div>

      {/* Chart */}
      <div className="mb-8">
        <DailyChart data={overview.dailyData} />
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <ActiveSessionsList sessions={overview.activeSessions} />
        <TopPagesList pages={overview.topPages} />
        <TopReferrersList referrers={overview.topReferrers} />
        <RecentActivityList
          pageViews={overview.recentPageViews}
          clicks={overview.recentClicks}
        />
      </div>
    </div>
  );
}
