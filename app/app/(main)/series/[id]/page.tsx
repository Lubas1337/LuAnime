'use client';

import { useEffect, useState, use, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  Clock,
  Calendar,
  Globe,
  Play,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Tv,
  Volume2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MoviePlayer } from '@/components/movies/movie-player';
import { SeasonEpisodeList } from '@/components/movies/season-episode-list';
import { MovieGrid } from '@/components/movies/movie-grid';
import { kinopoiskClient } from '@/lib/api/kinopoisk';
import type { Movie, MoviePreview, MovieVideo, Season, Episode } from '@/types/movie';
import { getMoviePosterUrl, formatMovieDuration, getMovieTypeLabel } from '@/types/movie';

interface SeriesPageProps {
  params: Promise<{ id: string }>;
}

interface VideoStream {
  url: string;
  quality: string;
  translation: string;
  source: string;
}

interface PlayerInfo {
  type: string;
  iframeUrl: string;
  translation: string;
  quality: string;
}

interface Translation {
  id: string | number | null;
  name: string;
  quality: string;
  source: string;
}

export default function SeriesPage({ params }: SeriesPageProps) {
  const resolvedParams = use(params);
  const seriesId = parseInt(resolvedParams.id, 10);

  const [series, setSeries] = useState<Movie | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [trailers, setTrailers] = useState<MovieVideo[]>([]);
  const [similarSeries, setSimilarSeries] = useState<MoviePreview[]>([]);
  const [streams, setStreams] = useState<VideoStream[]>([]);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [streamLoading, setStreamLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('episodes');

  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [selectedAudioIndex, setSelectedAudioIndex] = useState<number>(0);

  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoading(true);
        setStreams([]);
        setPlayers([]);
        setCurrentEpisode(null);

        const [seriesData, seasonsData, trailersData, similarData] = await Promise.all([
          kinopoiskClient.getMovieById(seriesId),
          kinopoiskClient.getSeasons(seriesId).catch(() => ({ items: [] })),
          kinopoiskClient.getTrailers(seriesId).catch(() => ({ items: [] })),
          kinopoiskClient.getSimilarMovies(seriesId).catch(() => ({ items: [] })),
        ]);

        setSeries(seriesData);
        // Sort seasons by number and episodes within each season
        const sortedSeasons = (seasonsData.items || [])
          .map(season => ({
            ...season,
            episodes: [...season.episodes].sort((a, b) => a.episodeNumber - b.episodeNumber)
          }))
          .sort((a, b) => a.number - b.number);
        setSeasons(sortedSeasons);
        setTrailers(trailersData.items?.filter((t) => t.site === 'YOUTUBE') || []);
        setSimilarSeries(similarData.items?.slice(0, 10) || []);

        // Set first season as default (smallest number after sorting)
        if (sortedSeasons.length > 0) {
          setCurrentSeason(sortedSeasons[0].number);
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch series:', error);
        setLoading(false);
      }
    };

    if (seriesId) {
      fetchSeries();
    }
  }, [seriesId]);

  const handleSeasonSelect = (seasonNumber: number) => {
    setCurrentSeason(seasonNumber);
    setCurrentEpisode(null);
    setStreams([]);
    setPlayers([]);
  };

  const handleEpisodeSelect = (episode: Episode, audioIndex?: number) => {
    setCurrentEpisode(episode);
    setStreamLoading(true);
    setStreams([]);
    setPlayers([]);

    const audio = audioIndex ?? selectedAudioIndex;

    // Fetch video streams from Kinobox with audio parameter
    const url = `/api/kinobox/stream?kp=${seriesId}&season=${episode.seasonNumber}&episode=${episode.episodeNumber}&audio=${audio}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.streams?.length > 0) {
          setStreams(data.streams);
        }
        if (data.players?.length > 0) {
          setPlayers(data.players);
        }
        if (data.translations?.length > 0) {
          setTranslations(data.translations);
        }
      })
      .catch(error => {
        console.error('Failed to fetch streams:', error);
      })
      .finally(() => {
        setStreamLoading(false);
        // Scroll to player
        setTimeout(() => {
          playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      });
  };

  const handleTranslationSelect = (audioIndex: number) => {
    setSelectedAudioIndex(audioIndex);
    if (currentEpisode) {
      handleEpisodeSelect(currentEpisode, audioIndex);
    }
  };

  const handleNextEpisode = () => {
    if (!currentEpisode || seasons.length === 0) return;

    const currentSeasonData = seasons.find(s => s.number === currentSeason);
    if (!currentSeasonData) return;

    const currentIndex = currentSeasonData.episodes.findIndex(
      e => e.episodeNumber === currentEpisode.episodeNumber
    );

    if (currentIndex < currentSeasonData.episodes.length - 1) {
      // Next episode in same season
      handleEpisodeSelect(currentSeasonData.episodes[currentIndex + 1]);
    } else {
      // Try next season
      const nextSeasonIndex = seasons.findIndex(s => s.number === currentSeason) + 1;
      if (nextSeasonIndex < seasons.length) {
        const nextSeason = seasons[nextSeasonIndex];
        setCurrentSeason(nextSeason.number);
        if (nextSeason.episodes.length > 0) {
          handleEpisodeSelect(nextSeason.episodes[0]);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Сериал не найден</p>
        <Button asChild variant="outline">
          <Link href="/series">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к сериалам
          </Link>
        </Button>
      </div>
    );
  }

  const posterUrl = getMoviePosterUrl(series.posterUrl);
  const totalEpisodes = seasons.reduce((acc, s) => acc + s.episodes.length, 0);

  return (
    <div className="min-h-screen pb-12">
      {/* Hero backdrop */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={series.coverUrl || posterUrl}
            alt={series.nameRu}
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        </div>

        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Button asChild variant="ghost" size="sm" className="bg-black/30 backdrop-blur-sm">
            <Link href="/series">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Link>
          </Button>
        </div>
      </div>

      {/* Series info */}
      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Poster */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <div className="relative w-48 md:w-64 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
              <Image
                src={posterUrl}
                alt={series.nameRu}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-4">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">
              {series.nameRu}
            </h1>
            {series.nameOriginal && (
              <p className="text-lg text-muted-foreground mb-4">
                {series.nameOriginal}
              </p>
            )}

            {/* Ratings */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {series.ratingKinopoisk && series.ratingKinopoisk > 0 && (
                <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1.5 rounded-lg">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-yellow-400">{series.ratingKinopoisk.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">Кинопоиск</span>
                </div>
              )}
              {series.ratingImdb && series.ratingImdb > 0 && (
                <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-lg">
                  <Star className="h-5 w-5 fill-orange-400 text-orange-400" />
                  <span className="font-bold text-orange-400">{series.ratingImdb.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">IMDb</span>
                </div>
              )}
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              {series.year && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {series.startYear && series.endYear
                    ? `${series.startYear}–${series.endYear}`
                    : series.year}
                </span>
              )}
              {seasons.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tv className="h-4 w-4" />
                  {seasons.length} сезонов, {totalEpisodes} серий
                </span>
              )}
              {series.filmLength && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatMovieDuration(series.filmLength)} / серия
                </span>
              )}
              {series.countries && series.countries.length > 0 && (
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {series.countries.map((c) => c.country).join(', ')}
                </span>
              )}
              <Badge variant="outline">{getMovieTypeLabel(series.type)}</Badge>
            </div>

            {/* Genres */}
            {series.genres && series.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {series.genres.map((g) => (
                  <Badge key={g.genre} variant="secondary">
                    {g.genre}
                  </Badge>
                ))}
              </div>
            )}

            {/* Slogan */}
            {series.slogan && (
              <p className="text-sm italic text-muted-foreground mb-4">
                &quot;{series.slogan}&quot;
              </p>
            )}

            {/* Description */}
            {series.description && (
              <p className="text-foreground/90 leading-relaxed mb-6 line-clamp-4 md:line-clamp-none">
                {series.description}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {seasons.length > 0 && seasons[0].episodes.length > 0 && !currentEpisode && (
                <Button
                  size="lg"
                  onClick={() => handleEpisodeSelect(seasons[0].episodes[0])}
                  className="gap-2"
                >
                  <Play className="h-5 w-5" />
                  Смотреть
                </Button>
              )}
              {series.webUrl && (
                <Button asChild variant="outline" size="lg">
                  <a href={series.webUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Кинопоиск
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Episodes / Trailers */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="episodes" className="gap-2">
                <Tv className="h-4 w-4" />
                Серии
              </TabsTrigger>
              {trailers.length > 0 && (
                <TabsTrigger value="trailers" className="gap-2">
                  Трейлеры ({trailers.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="episodes" className="space-y-6">
              {seasons.length > 0 ? (
                <>
                  <SeasonEpisodeList
                    seasons={seasons}
                    currentSeason={currentSeason}
                    currentEpisode={currentEpisode?.episodeNumber || null}
                    onSeasonSelect={handleSeasonSelect}
                    onEpisodeSelect={handleEpisodeSelect}
                  />

                  {currentEpisode && (
                    <div ref={playerRef} className="space-y-4 scroll-mt-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-foreground">
                          Сезон {currentEpisode.seasonNumber}, Серия {currentEpisode.episodeNumber}
                          {currentEpisode.nameRu && ` — ${currentEpisode.nameRu}`}
                        </h2>
                        {translations.length > 1 && (
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4 text-muted-foreground" />
                            <select
                              value={selectedAudioIndex}
                              onChange={(e) => handleTranslationSelect(parseInt(e.target.value))}
                              className="bg-card border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              disabled={streamLoading}
                            >
                              {translations.map((t, idx) => (
                                <option key={idx} value={idx}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="rounded-xl overflow-hidden bg-black">
                        <MoviePlayer
                          streams={streams}
                          players={players}
                          kinopoiskId={seriesId}
                          season={currentEpisode.seasonNumber}
                          episode={currentEpisode.episodeNumber}
                          poster={posterUrl}
                          movieTitle={`${series.nameRu} S${currentEpisode.seasonNumber}E${currentEpisode.episodeNumber}`}
                          isLoading={streamLoading}
                        />
                      </div>
                      {/* Next episode button */}
                      <div className="flex justify-end">
                        <Button onClick={handleNextEpisode} variant="outline" className="gap-2">
                          Следующая серия
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Tv className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Информация о сериях недоступна</p>
                  <p className="text-sm mt-2">Попробуйте посмотреть через внешний плеер</p>
                  {players.length === 0 && (
                    <Button
                      className="mt-4"
                      onClick={() => {
                        setStreamLoading(true);
                        fetch(`/api/kinobox/stream?kp=${seriesId}`)
                          .then(res => res.json())
                          .then(data => {
                            if (data.players?.length > 0) {
                              setPlayers(data.players);
                            }
                            if (data.streams?.length > 0) {
                              setStreams(data.streams);
                            }
                          })
                          .finally(() => setStreamLoading(false));
                      }}
                    >
                      Загрузить плеер
                    </Button>
                  )}
                  {(players.length > 0 || streams.length > 0) && (
                    <div className="mt-4 rounded-xl overflow-hidden bg-black">
                      <MoviePlayer
                        streams={streams}
                        players={players}
                        translations={translations}
                        kinopoiskId={seriesId}
                        poster={posterUrl}
                        movieTitle={series.nameRu}
                        isLoading={streamLoading}
                      />
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {trailers.length > 0 && (
              <TabsContent value="trailers">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trailers.slice(0, 4).map((trailer, index) => (
                    <div key={index} className="aspect-video rounded-xl overflow-hidden bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${getYoutubeId(trailer.url)}`}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Similar series */}
        {similarSeries.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Похожие сериалы</h2>
            <MovieGrid movies={similarSeries} columns={5} />
          </section>
        )}
      </div>
    </div>
  );
}

function getYoutubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
  return match ? match[1] : '';
}
