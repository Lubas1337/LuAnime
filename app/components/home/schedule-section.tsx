'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Play, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getSchedule } from '@/lib/api/anime';
import type { ScheduleAnime } from '@/types/anime';
import { getImageUrl } from '@/types/anime';

const dayNames = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
];

const shortDayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function ScheduleSection() {
  const [schedule, setSchedule] = useState<ScheduleAnime[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  useEffect(() => {
    setActiveDay(todayIndex);
  }, [todayIndex]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const data = await getSchedule();
        setSchedule(data);
      } catch (error) {
        console.error('Failed to fetch schedule:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  // Update indicator position when active tab changes
  useEffect(() => {
    const activeTab = tabRefs.current[activeDay];
    if (activeTab && tabsRef.current) {
      const tabRect = activeTab.getBoundingClientRect();
      const containerRect = tabsRef.current.getBoundingClientRect();
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, [activeDay, isLoading]);

  return (
    <section className="animate-fade-in">
      {/* Apple-style header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background animate-pulse" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Расписание
          </h2>
          <p className="text-sm text-muted-foreground/80">
            Выход новых серий по дням недели
          </p>
        </div>
      </div>

      {isLoading ? (
        <ScheduleSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Apple-style pill tabs with sliding indicator */}
          <div className="relative">
            <div
              ref={tabsRef}
              className="flex gap-1 p-1.5 bg-secondary/50 backdrop-blur-xl rounded-2xl overflow-x-auto scrollbar-hide"
            >
              {/* Sliding indicator */}
              <div
                className="absolute top-1.5 h-[calc(100%-12px)] bg-white/10 backdrop-blur-sm rounded-xl transition-all duration-300 ease-out"
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                  transform: 'translateX(0)',
                }}
              />

              {dayNames.map((day, index) => (
                <button
                  key={index}
                  ref={(el) => { tabRefs.current[index] = el; }}
                  onClick={() => setActiveDay(index)}
                  className={`relative z-10 flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out ${
                    activeDay === index
                      ? 'text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{shortDayNames[index]}</span>
                  {index === todayIndex && (
                    <span className="ml-2 inline-flex items-center justify-center h-5 px-2 text-[10px] font-semibold uppercase tracking-wider bg-violet-500/20 text-violet-400 rounded-full">
                      Сейчас
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content area with smooth fade animation */}
          <div className="relative min-h-[300px]">
            <div
              key={activeDay}
              className="animate-schedule-fade-in"
            >
              {schedule[activeDay]?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {schedule[activeDay].map((item, index) => (
                    <ScheduleCard
                      key={item.id}
                      item={item}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ScheduleCard({
  item,
  index,
}: {
  item: ScheduleAnime;
  index: number;
}) {
  const imageUrl = item.image || getImageUrl(item.poster);

  return (
    <Link
      href={`/anime/${item.id}`}
      className="group relative flex gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-white/5 hover:border-white/10 hover:bg-card/80 transition-all duration-300 ease-out hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5 opacity-0 animate-schedule-card"
      style={{ animationDelay: `${Math.min(index * 40, 200)}ms` }}
    >
      {/* Image with gradient overlay */}
      <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-xl">
        <Image
          src={imageUrl}
          alt={item.title_ru}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="64px"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg">
            <Play className="h-3.5 w-3.5 text-black fill-black ml-0.5" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <h3 className="font-medium text-foreground line-clamp-2 leading-snug group-hover:text-white transition-colors duration-300">
          {item.title_ru}
        </h3>

        {item.episodes_released && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-400">
              <Clock className="h-3 w-3" />
              <span className="text-xs font-medium">
                Серия {item.episodes_released}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Subtle shine effect on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
        <Calendar className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <p className="text-muted-foreground/80 font-medium">
        Нет запланированных релизов
      </p>
      <p className="text-sm text-muted-foreground/50 mt-1">
        На этот день релизы не запланированы
      </p>
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tabs skeleton */}
      <div className="flex gap-1 p-1.5 bg-secondary/30 rounded-2xl overflow-x-auto">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-10 w-24 flex-shrink-0 rounded-xl bg-secondary/50"
          />
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 p-4 rounded-2xl bg-card/30 border border-white/5"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <Skeleton className="h-24 w-16 flex-shrink-0 rounded-xl" />
            <div className="flex-1 space-y-3 py-2">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
