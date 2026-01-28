'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, History, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimeGrid } from '@/components/anime/anime-grid';
import { useAuthStore } from '@/lib/store/auth-store';
import { usePlayerStore } from '@/lib/store/player-store';
import { useFavoritesStore } from '@/lib/store/favorites-store';
import { useAuthModalStore } from '@/lib/store/auth-modal-store';
import type { Anime } from '@/types/anime';

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'favorites';

  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuthStore();
  const { watchHistory } = usePlayerStore();
  const { getFavoriteAnime } = useFavoritesStore();
  const { open: openAuthModal } = useAuthModalStore();

  const favorites = getFavoriteAnime();
  const isLoading = false;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openAuthModal('login');
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router, openAuthModal]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (authLoading) {
    return <ProfileSkeleton />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const historyItems = Object.entries(watchHistory).map(([animeId, data]) => ({
    animeId: parseInt(animeId, 10),
    ...data,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-80 space-y-6">
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.avatar} alt={user.login} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {user.login.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <h1 className="text-xl font-bold text-foreground">{user.login}</h1>

              {user.status && (
                <p className="text-sm text-muted-foreground mt-1">{user.status}</p>
              )}

              {user.is_premium && (
                <span className="mt-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  Premium
                </span>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-border space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">В избранном</span>
                <span className="text-foreground font-medium">
                  {favorites.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Просмотрено</span>
                <span className="text-foreground font-medium">
                  {historyItems.length}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="favorites" className="gap-2">
                <Heart className="h-4 w-4" />
                Избранное
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                История
              </TabsTrigger>
            </TabsList>

            <TabsContent value="favorites">
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                      <Skeleton className="h-4 w-full mt-3" />
                    </div>
                  ))}
                </div>
              ) : favorites.length > 0 ? (
                <AnimeGrid anime={favorites} columns={4} />
              ) : (
                <div className="text-center py-20">
                  <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Избранное пусто
                  </h2>
                  <p className="text-muted-foreground">
                    Добавляйте аниме в избранное, чтобы не потерять их
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              {historyItems.length > 0 ? (
                <div className="space-y-4">
                  {historyItems.map((item) => (
                    <div
                      key={item.animeId}
                      className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          Аниме #{item.animeId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Серия {item.episode} • {Math.round(item.progress * 100)}%
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/anime/${item.animeId}`}>Продолжить</a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    История пуста
                  </h2>
                  <p className="text-muted-foreground">
                    Начните смотреть аниме, чтобы сохранить прогресс
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-80">
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex flex-col items-center">
              <Skeleton className="h-24 w-24 rounded-full mb-4" />
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
        <div className="flex-1">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-full mt-3" />
              </div>
            ))}
          </div>
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
