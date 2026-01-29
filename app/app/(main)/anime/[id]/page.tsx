'use client';

import { useEffect, useState, use, useRef } from 'react';
import Image from 'next/image';
import { Heart, Star, Calendar, Clock, Film, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoPlayer } from '@/components/anime/video-player';
import { EpisodeList } from '@/components/anime/episode-list';
import { AnimeCard } from '@/components/anime/anime-card';
import {
  getAnimeById,
  getTranslations,
  getEpisodes,
} from '@/lib/api/anime';
import { useAuthStore } from '@/lib/store/auth-store';
import { usePlayerStore } from '@/lib/store/player-store';
import { useFavoritesStore } from '@/lib/store/favorites-store';
import { useAuthModalStore } from '@/lib/store/auth-modal-store';
import type { Anime, Episode, Translation } from '@/types/anime';
import { getImageUrl } from '@/types/anime';

function getStatusColor(statusName?: string): string {
  if (!statusName) return '';
  const name = statusName.toLowerCase();
  if (name.includes('онгоинг') || name.includes('выход')) {
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  }
  if (name.includes('вышел') || name.includes('завершен')) {
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
  if (name.includes('анонс')) {
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  }
  return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

export default function AnimePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const animeId = parseInt(id, 10);

  const [anime, setAnime] = useState<Anime | null>(null);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [currentTranslation, setCurrentTranslation] = useState<Translation | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEpisodesLoading, setIsEpisodesLoading] = useState(false);

  const playerRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated } = useAuthStore();
  const { saveProgress, getProgress, saveEpisodeTime, getEpisodeTime } = usePlayerStore();
  const { addFavorite, removeFavorite, isFavorite: checkIsFavorite } = useFavoritesStore();
  const { open: openAuthModal } = useAuthModalStore();

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        const [animeData, translationsData] = await Promise.all([
          getAnimeById(animeId),
          getTranslations(animeId),
        ]);

        setAnime(animeData);
        setTranslations(translationsData);
        setIsFavorite(checkIsFavorite(animeId));

        if (translationsData.length > 0) {
          const defaultTranslation = translationsData[0];
          setCurrentTranslation(defaultTranslation);

          const episodesCount = animeData.episodes_released || animeData.episodes_total || 0;
          const episodesData = await getEpisodes(animeId, defaultTranslation.id, episodesCount);
          setEpisodes(episodesData);

          const savedProgress = getProgress(animeId);
          if (savedProgress && episodesData.length > 0) {
            const savedEpisode = episodesData.find(
              (e) => e.number === savedProgress.episode
            );
            if (savedEpisode) {
              setCurrentEpisode(savedEpisode);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch anime:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnime();
  }, [animeId, getProgress, checkIsFavorite]);

  const handleTranslationSelect = async (translation: Translation) => {
    setCurrentTranslation(translation);
    setIsEpisodesLoading(true);

    try {
      const episodesCount = anime?.episodes_released || anime?.episodes_total || 0;
      const episodesData = await getEpisodes(animeId, translation.id, episodesCount);
      setEpisodes(episodesData);
      setCurrentEpisode(null);
    } catch (error) {
      console.error('Failed to fetch episodes:', error);
    } finally {
      setIsEpisodesLoading(false);
    }
  };

  const handleEpisodeSelect = (episode: Episode) => {
    setCurrentEpisode(episode);
    // Scroll to player
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleNextEpisode = () => {
    if (!currentEpisode || episodes.length === 0) return;

    const currentIndex = episodes.findIndex(
      (e) => e.number === currentEpisode.number
    );
    if (currentIndex < episodes.length - 1) {
      setCurrentEpisode(episodes[currentIndex + 1]);
    }
  };

  const handleProgress = (progress: number, currentTime: number) => {
    if (currentEpisode) {
      saveProgress(animeId, currentEpisode.number, progress);
      saveEpisodeTime(animeId, currentEpisode.number, currentTime);
    }
  };

  const toggleFavorite = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (isFavorite) {
      removeFavorite(animeId);
    } else {
      addFavorite(animeId, anime || undefined);
    }
    setIsFavorite(!isFavorite);
  };

  if (isLoading) {
    return <AnimePageSkeleton />;
  }

  if (!anime) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Аниме не найдено</h1>
        <p className="mt-2 text-muted-foreground">
          Запрашиваемое аниме не существует или было удалено
        </p>
      </div>
    );
  }

  const imageUrl = anime.image || getImageUrl(anime.poster);

  return (
    <div className="min-h-screen">
      <div className="relative h-[300px] md:h-[400px]">
        <Image
          src={imageUrl}
          alt={anime.title_ru}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
          unoptimized
        />
        <div className="absolute inset-0 gradient-overlay" />
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <div className="relative w-48 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
              <Image
                src={imageUrl}
                alt={anime.title_ru}
                fill
                className="object-cover"
                sizes="192px"
                unoptimized
              />
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap gap-2">
              {anime.status?.name && (
                <Badge
                  variant="outline"
                  className={`border ${getStatusColor(anime.status.name)}`}
                >
                  {anime.status.name}
                </Badge>
              )}
              {anime.year && (
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" />
                  {anime.year}
                </Badge>
              )}
              {anime.grade !== undefined && anime.grade > 0 && (
                <Badge variant="secondary">
                  <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                  {anime.grade.toFixed(1)}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl md:text-4xl font-bold text-foreground">
              {anime.title_ru}
            </h1>

            {anime.title_original && (
              <p className="text-lg text-muted-foreground">
                {anime.title_original}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {anime.episodes_total && (
                <span className="flex items-center gap-1">
                  <Film className="h-4 w-4" />
                  {anime.episodes_released || 0} / {anime.episodes_total} серий
                </span>
              )}
              {anime.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {anime.duration} мин
                </span>
              )}
              {anime.vote_count && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {anime.vote_count.toLocaleString()} голосов
                </span>
              )}
            </div>

            {anime.genres && (
              <div className="flex flex-wrap gap-2">
                {anime.genres.split(',').map((genre, index) => (
                  <Badge key={index} variant="outline">
                    {genre.trim()}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {episodes.length > 0 && !currentEpisode && (
                <Button
                  size="lg"
                  onClick={() => handleEpisodeSelect(episodes[0])}
                  className="gap-2"
                >
                  Смотреть
                </Button>
              )}

              <Button
                variant={isFavorite ? 'default' : 'outline'}
                size="lg"
                onClick={toggleFavorite}
                className="gap-2"
              >
                <Heart
                  className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`}
                />
                {isFavorite ? 'В избранном' : 'В избранное'}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-8 pb-12">
          <Tabs defaultValue="episodes" className="w-full">
            <TabsList>
              <TabsTrigger value="episodes">Серии</TabsTrigger>
              <TabsTrigger value="description">Описание</TabsTrigger>
              {anime.related_releases && anime.related_releases.length > 0 && (
                <TabsTrigger value="related">Связанное</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="episodes" className="mt-6 space-y-6">
              {isEpisodesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-[400px] w-full" />
                </div>
              ) : episodes.length > 0 ? (
                <>
                  <EpisodeList
                    episodes={episodes}
                    translations={translations}
                    currentEpisode={currentEpisode?.number || null}
                    currentTranslation={currentTranslation}
                    onEpisodeSelect={handleEpisodeSelect}
                    onTranslationSelect={handleTranslationSelect}
                  />

                  {currentEpisode && (
                    <div ref={playerRef} className="space-y-4 scroll-mt-4">
                      <h2 className="text-xl font-bold text-foreground">
                        {currentEpisode.name || `Серия ${currentEpisode.number}`}
                      </h2>
                      <VideoPlayer
                        sources={currentEpisode.sources || []}
                        embedUrl={currentEpisode.embed_url}
                        poster={imageUrl}
                        animeTitle={anime.title_ru}
                        episodeNumber={currentEpisode.number}
                        startTime={getEpisodeTime(animeId, currentEpisode.number) ?? undefined}
                        onEnded={handleNextEpisode}
                        onProgress={handleProgress}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Серии пока недоступны</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="description" className="mt-6">
              {anime.description ? (
                <p className="text-foreground leading-relaxed whitespace-pre-line">
                  {anime.description}
                </p>
              ) : (
                <p className="text-muted-foreground">Описание отсутствует</p>
              )}
            </TabsContent>

            {anime.related_releases && anime.related_releases.length > 0 && (
              <TabsContent value="related" className="mt-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {anime.related_releases.map((item) => (
                    <AnimeCard
                      key={item.id}
                      anime={{
                        id: item.id,
                        title_ru: item.title_ru,
                        title_original: '',
                        poster: item.poster,
                        image: item.image,
                      }}
                    />
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function AnimePageSkeleton() {
  return (
    <div className="min-h-screen">
      <Skeleton className="h-[300px] md:h-[400px] w-full" />

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          <Skeleton className="w-48 aspect-[2/3] rounded-lg mx-auto md:mx-0" />

          <div className="flex-1 space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="flex gap-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-18" />
            </div>
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-36" />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
