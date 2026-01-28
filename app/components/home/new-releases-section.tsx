'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimeGrid } from '@/components/anime/anime-grid';
import { getSchedule, getAnimeByIds } from '@/lib/api/anime';
import type { Anime, ScheduleAnime } from '@/types/anime';

export function NewReleasesSection() {
  const [anime, setAnime] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNewReleases = async () => {
      try {
        const schedule = await getSchedule();

        const allScheduleAnime: ScheduleAnime[] = schedule.flat();

        const uniqueIds = [...new Set(allScheduleAnime.map((a) => a.id))].slice(0, 10);

        const animeList = await getAnimeByIds(uniqueIds);
        setAnime(animeList);
      } catch (error) {
        console.error('Failed to fetch new releases:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewReleases();
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Онгоинги</h2>
            <p className="text-sm text-muted-foreground">
              Аниме из расписания этой недели
            </p>
          </div>
        </div>

        <Button variant="ghost" asChild className="text-primary">
          <Link href="/search">Каталог</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-full mt-3" />
              <Skeleton className="h-3 w-20 mt-2" />
            </div>
          ))}
        </div>
      ) : anime.length > 0 ? (
        <AnimeGrid anime={anime} columns={5} />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Не удалось загрузить онгоинги
        </div>
      )}
    </section>
  );
}
