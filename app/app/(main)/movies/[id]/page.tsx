'use client';

import { useEffect, useState, use } from 'react';
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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MoviePlayer } from '@/components/movies/movie-player';
import { MovieGrid } from '@/components/movies/movie-grid';
import { kinopoiskClient } from '@/lib/api/kinopoisk';
import type { Movie, MoviePreview, MovieVideo } from '@/types/movie';
import { getMoviePosterUrl, formatMovieDuration, getMovieTypeLabel } from '@/types/movie';

interface MoviePageProps {
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

export default function MoviePage({ params }: MoviePageProps) {
  const resolvedParams = use(params);
  const movieId = parseInt(resolvedParams.id, 10);

  const [movie, setMovie] = useState<Movie | null>(null);
  const [trailers, setTrailers] = useState<MovieVideo[]>([]);
  const [similarMovies, setSimilarMovies] = useState<MoviePreview[]>([]);
  const [streams, setStreams] = useState<VideoStream[]>([]);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [streamLoading, setStreamLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('player');

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        setStreams([]);
        setPlayers([]);

        const [movieData, trailersData, similarData] = await Promise.all([
          kinopoiskClient.getMovieById(movieId),
          kinopoiskClient.getTrailers(movieId).catch(() => ({ items: [] })),
          kinopoiskClient.getSimilarMovies(movieId).catch(() => ({ items: [] })),
        ]);

        setMovie(movieData);
        setTrailers(trailersData.items?.filter((t) => t.site === 'YOUTUBE') || []);
        setSimilarMovies(similarData.items?.slice(0, 10) || []);
        setLoading(false);

        // Fetch video streams from Kinobox in background
        setStreamLoading(true);
        fetch(`/api/kinobox/stream?kp=${movieId}`)
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
          });
      } catch (error) {
        console.error('Failed to fetch movie:', error);
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovie();
    }
  }, [movieId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Фильм не найден</p>
        <Button asChild variant="outline">
          <Link href="/movies">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к фильмам
          </Link>
        </Button>
      </div>
    );
  }

  const posterUrl = getMoviePosterUrl(movie.posterUrl);

  return (
    <div className="min-h-screen pb-12">
      {/* Hero backdrop */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={movie.coverUrl || posterUrl}
            alt={movie.nameRu}
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
            <Link href="/movies">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Link>
          </Button>
        </div>
      </div>

      {/* Movie info */}
      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Poster */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <div className="relative w-48 md:w-64 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
              <Image
                src={posterUrl}
                alt={movie.nameRu}
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
              {movie.nameRu}
            </h1>
            {movie.nameOriginal && (
              <p className="text-lg text-muted-foreground mb-4">
                {movie.nameOriginal}
              </p>
            )}

            {/* Ratings */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {movie.ratingKinopoisk && movie.ratingKinopoisk > 0 && (
                <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1.5 rounded-lg">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-yellow-400">{movie.ratingKinopoisk.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">Кинопоиск</span>
                </div>
              )}
              {movie.ratingImdb && movie.ratingImdb > 0 && (
                <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-lg">
                  <Star className="h-5 w-5 fill-orange-400 text-orange-400" />
                  <span className="font-bold text-orange-400">{movie.ratingImdb.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">IMDb</span>
                </div>
              )}
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              {movie.year && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {movie.year}
                </span>
              )}
              {movie.filmLength && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatMovieDuration(movie.filmLength)}
                </span>
              )}
              {movie.countries && movie.countries.length > 0 && (
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {movie.countries.map((c) => c.country).join(', ')}
                </span>
              )}
              <Badge variant="outline">{getMovieTypeLabel(movie.type)}</Badge>
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {movie.genres.map((g) => (
                  <Badge key={g.genre} variant="secondary">
                    {g.genre}
                  </Badge>
                ))}
              </div>
            )}

            {/* Slogan */}
            {movie.slogan && (
              <p className="text-sm italic text-muted-foreground mb-4">
                &quot;{movie.slogan}&quot;
              </p>
            )}

            {/* Description */}
            {movie.description && (
              <p className="text-foreground/90 leading-relaxed mb-6 line-clamp-4 md:line-clamp-none">
                {movie.description}
              </p>
            )}

            {/* External link */}
            {movie.webUrl && (
              <Button asChild variant="outline" size="sm">
                <a href={movie.webUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Кинопоиск
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs: Player / Trailers */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="player" className="gap-2">
                <Play className="h-4 w-4" />
                Смотреть
              </TabsTrigger>
              {trailers.length > 0 && (
                <TabsTrigger value="trailers" className="gap-2">
                  Трейлеры ({trailers.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="player">
              <div className="rounded-xl overflow-hidden bg-black">
                <MoviePlayer
                  streams={streams}
                  players={players}
                  translations={translations}
                  kinopoiskId={movieId}
                  poster={posterUrl}
                  movieTitle={movie.nameRu}
                  isLoading={streamLoading}
                />
              </div>
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

        {/* Similar movies */}
        {similarMovies.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Похожие фильмы</h2>
            <MovieGrid movies={similarMovies} columns={5} />
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
