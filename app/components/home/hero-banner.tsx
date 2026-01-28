'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getDiscoverItems, getAnimeByIds } from '@/lib/api/anime';
import type { Anime, DiscoverItem } from '@/types/anime';
import { getImageUrl } from '@/types/anime';

interface BannerItem {
  id: number;
  title: string;
  description: string;
  image: string;
  animeId: number;
  anime?: Anime;
}

export function HeroBanner() {
  const [items, setItems] = useState<BannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const discoverItems = await getDiscoverItems();

        const bannerItems: BannerItem[] = discoverItems
          .filter((item) => item.type === 1)
          .slice(0, 6)
          .map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            image: item.image,
            animeId: parseInt(item.action, 10),
          }));

        const animeIds = bannerItems.map((b) => b.animeId);
        const animeList = await getAnimeByIds(animeIds);

        const enrichedItems = bannerItems.map((item) => ({
          ...item,
          anime: animeList.find((a) => a.id === item.animeId),
        }));

        setItems(enrichedItems);
      } catch (error) {
        console.error('Failed to fetch banner data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [items.length, nextSlide]);

  if (isLoading) {
    return <HeroBannerSkeleton />;
  }

  if (items.length === 0) {
    return null;
  }

  const current = items[currentIndex];
  const anime = current.anime;

  return (
    <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={current.image}
          alt={current.title}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
          unoptimized
        />
        <div className="absolute inset-0 gradient-overlay" />
        <div className="absolute inset-0 gradient-overlay-right" />
      </div>

      <div className="relative h-full container mx-auto px-4 flex items-end pb-16 md:pb-20">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
            {current.title}
          </h1>

          {anime?.title_original && (
            <p className="text-lg text-muted-foreground">
              {anime.title_original}
            </p>
          )}

          <p className="text-sm md:text-base text-muted-foreground line-clamp-3 max-w-xl">
            {current.description}
          </p>

          {anime && (
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {anime.year && <span>{anime.year}</span>}
              {anime.genres && (
                <span className="before:content-['•'] before:mx-2">
                  {anime.genres.split(',').slice(0, 3).join(', ')}
                </span>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button asChild size="lg" className="gap-2">
              <Link href={`/anime/${current.animeId}`}>
                <Play className="h-5 w-5 fill-current" />
                Смотреть
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href={`/anime/${current.animeId}`}>
                <Info className="h-5 w-5" />
                Подробнее
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-4 md:right-8 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevSlide}
          className="h-10 w-10 rounded-full bg-background/20 backdrop-blur-sm hover:bg-background/40"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex gap-1.5">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-foreground/30 hover:bg-foreground/50'
              }`}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextSlide}
          className="h-10 w-10 rounded-full bg-background/20 backdrop-blur-sm hover:bg-background/40"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

function HeroBannerSkeleton() {
  return (
    <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden bg-secondary">
      <div className="absolute inset-0 gradient-overlay" />
      <div className="relative h-full container mx-auto px-4 flex items-end pb-16 md:pb-20">
        <div className="max-w-2xl space-y-4">
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-20 w-full max-w-xl" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
