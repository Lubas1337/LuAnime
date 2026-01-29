'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, History, Play, ArrowUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnimeGrid } from '@/components/anime/anime-grid';
import { usePlayerStore } from '@/lib/store/player-store';
import { useFavoritesStore } from '@/lib/store/favorites-store';
import type { Anime } from '@/types/anime';
import { getImageUrl } from '@/types/anime';

type FavoritesSort = 'date' | 'rating' | 'name';

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'favorites';

  const { watchHistory } = usePlayerStore();
  const { favorites, getFavoriteAnime } = useFavoritesStore();

  const [favoritesSort, setFavoritesSort] = useState<FavoritesSort>('date');

  const favoriteAnime = getFavoriteAnime();

  const sortedFavorites = useMemo(() => {
    const items = [...favoriteAnime];
    switch (favoritesSort) {
      case 'rating':
        return items.sort((a, b) => (b.grade || 0) - (a.grade || 0));
      case 'name':
        return items.sort((a, b) => a.title_ru.localeCompare(b.title_ru, 'ru'));
      case 'date':
      default:
        return items.reverse();
    }
  }, [favoriteAnime, favoritesSort]);

  const historyItems = useMemo(() => {
    return Object.entries(watchHistory)
      .map(([animeId, data]) => ({
        animeId: parseInt(animeId, 10),
        ...data,
      }))
      .sort((a, b) => {
        if (a.lastWatched && b.lastWatched) {
          return new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime();
        }
        if (a.lastWatched) return -1;
        if (b.lastWatched) return 1;
        return 0;
      });
  }, [watchHistory]);

  const handleTabChange = (value: string) => {
    router.replace(`/profile?tab=${value}`, { scroll: false });
  };

  return (
    <div className="min-h-screen">
      {/* Header area */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-10 relative">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Мой профиль</h1>
          <p className="text-muted-foreground mt-2">Избранное и история просмотров</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue={defaultTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-8 h-12 p-1 bg-card border border-border">
            <TabsTrigger value="favorites" className="gap-2 h-10 px-6 data-[state=active]:shadow-md">
              <Heart className="h-4 w-4" />
              Избранное
              {favoriteAnime.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-semibold">
                  {favoriteAnime.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 h-10 px-6 data-[state=active]:shadow-md">
              <History className="h-4 w-4" />
              История
              {historyItems.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-semibold">
                  {historyItems.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites">
            {favoriteAnime.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {favoriteAnime.length} {favoriteAnime.length === 1 ? 'аниме' : 'аниме'} в избранном
                  </p>
                  <Select value={favoritesSort} onValueChange={(v) => setFavoritesSort(v as FavoritesSort)}>
                    <SelectTrigger className="w-[180px] h-9">
                      <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">По дате</SelectItem>
                      <SelectItem value="rating">По рейтингу</SelectItem>
                      <SelectItem value="name">По названию</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <AnimeGrid anime={sortedFavorites} columns={5} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150" />
                  <Heart className="relative h-20 w-20 text-muted-foreground/30" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Избранное пусто
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Добавляйте аниме в избранное, нажимая на сердечко, чтобы не потерять их
                </p>
                <Button asChild>
                  <Link href="/search">
                    <Search className="h-4 w-4 mr-2" />
                    Перейти в каталог
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {historyItems.length > 0 ? (
              <div className="space-y-3">
                {historyItems.map((item) => {
                  const posterUrl = item.poster
                    ? getImageUrl(item.poster)
                    : 'https://placehold.co/80x120/1e293b/8b5cf6?text=?';
                  const title = item.title || `Аниме #${item.animeId}`;
                  const progressPercent = Math.round(item.progress * 100);

                  return (
                    <div
                      key={item.animeId}
                      className="group flex items-center gap-4 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-200"
                    >
                      <Link href={`/anime/${item.animeId}`} className="flex-shrink-0">
                        <div className="relative w-16 h-24 sm:w-20 sm:h-[120px] rounded-lg overflow-hidden">
                          <Image
                            src={posterUrl}
                            alt={title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="80px"
                            unoptimized
                          />
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/anime/${item.animeId}`}>
                          <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {title}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          Серия {item.episode} &bull; {progressPercent}% просмотрено
                        </p>
                        {item.lastWatched && (
                          <p className="text-xs text-muted-foreground/60 mt-0.5">
                            {new Date(item.lastWatched).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        )}

                        {/* Progress bar */}
                        <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-primary transition-all duration-300"
                            style={{ width: `${Math.min(progressPercent, 100)}%` }}
                          />
                        </div>
                      </div>

                      <Button variant="outline" size="sm" asChild className="flex-shrink-0 gap-1.5">
                        <Link href={`/anime/${item.animeId}`}>
                          <Play className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Продолжить</span>
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150" />
                  <History className="relative h-20 w-20 text-muted-foreground/30" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  История пуста
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Начните смотреть аниме, чтобы сохранить прогресс просмотра
                </p>
                <Button asChild>
                  <Link href="/search">
                    <Search className="h-4 w-4 mr-2" />
                    Перейти в каталог
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
        <div className="container mx-auto px-4 py-10 relative">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-12 w-80 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-full mt-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfilePageContent />
    </Suspense>
  );
}
