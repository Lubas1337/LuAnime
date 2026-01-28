'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimeCard } from '@/components/anime/anime-card';
import { getDiscoverItems, getAnimeByIds } from '@/lib/api/anime';
import type { Anime } from '@/types/anime';

export function TrendingSection() {
  const [anime, setAnime] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const discoverItems = await getDiscoverItems();

        const animeIds = discoverItems
          .filter((item) => item.type === 1)
          .map((item) => parseInt(item.action, 10))
          .filter((id) => !isNaN(id));

        const animeList = await getAnimeByIds(animeIds);
        setAnime(animeList);
      } catch (error) {
        console.error('Failed to fetch trending:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrending();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.offsetWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Популярное</h2>
            <p className="text-sm text-muted-foreground">
              Рекомендации редакции
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => scroll('left')}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => scroll('right')}
              className="h-9 w-9"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <Button variant="ghost" asChild className="text-primary">
            <Link href="/search">Каталог</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[160px] sm:w-[180px]">
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-full mt-3" />
              <Skeleton className="h-3 w-20 mt-2" />
            </div>
          ))}
        </div>
      ) : anime.length > 0 ? (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {anime.map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-[160px] sm:w-[180px]"
            >
              <AnimeCard anime={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Не удалось загрузить рекомендации
        </div>
      )}
    </section>
  );
}
