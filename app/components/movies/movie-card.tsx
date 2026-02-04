'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { MoviePreview } from '@/types/movie';
import { getMoviePosterUrl, getMovieTypeLabel } from '@/types/movie';

interface MovieCardProps {
  movie: MoviePreview;
  variant?: 'default' | 'compact' | 'wide';
}

function getMovieRating(movie: MoviePreview): number | null {
  if (movie.ratingKinopoisk && movie.ratingKinopoisk > 0) return movie.ratingKinopoisk;
  if (movie.rating) {
    const r = typeof movie.rating === 'string' ? parseFloat(movie.rating) : movie.rating;
    return r > 0 ? r : null;
  }
  return null;
}

function getMovieYear(movie: MoviePreview): string | null {
  if (!movie.year) return null;
  return String(movie.year);
}

export function MovieCard({ movie, variant = 'default' }: MovieCardProps) {
  const id = movie.kinopoiskId || movie.filmId;
  const imageUrl = getMoviePosterUrl(movie.posterUrlPreview || movie.posterUrl);
  const rating = getMovieRating(movie);
  const year = getMovieYear(movie);

  if (variant === 'wide') {
    return <WideMovieCard movie={movie} />;
  }

  if (variant === 'compact') {
    return <CompactMovieCard movie={movie} />;
  }

  return (
    <Link
      href={`/movies/${id}`}
      className="anime-card group block overflow-hidden rounded-xl bg-card border border-transparent hover:border-primary/20"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-t-xl">
        <Image
          src={imageUrl}
          alt={movie.nameRu || movie.nameOriginal || ''}
          fill
          className="card-image object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          unoptimized
        />

        <div className="card-overlay absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-primary/30">
            <Play className="h-6 w-6 fill-current ml-0.5" />
          </div>
        </div>

        {movie.type && (
          <Badge className="absolute top-2 left-2 border bg-blue-500/20 text-blue-400 border-blue-500/30">
            {getMovieTypeLabel(movie.type)}
          </Badge>
        )}

        {rating !== null && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium text-white">
              {rating.toFixed(1)}
            </span>
          </div>
        )}

        {year && (
          <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm">
            <span className="text-xs font-medium text-white">{year}</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          {movie.nameRu || movie.nameOriginal}
        </h3>
        {movie.genres && movie.genres.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
            {movie.genres.map((g) => g.genre).join(', ')}
          </p>
        )}
      </div>
    </Link>
  );
}

function CompactMovieCard({ movie }: { movie: MoviePreview }) {
  const id = movie.kinopoiskId || movie.filmId;
  const imageUrl = getMoviePosterUrl(movie.posterUrlPreview || movie.posterUrl);
  const rating = getMovieRating(movie);
  const year = getMovieYear(movie);

  return (
    <Link
      href={`/movies/${id}`}
      className="anime-card group flex gap-3 rounded-lg bg-card p-2 transition-colors hover:bg-secondary"
    >
      <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded">
        <Image
          src={imageUrl}
          alt={movie.nameRu || movie.nameOriginal || ''}
          fill
          className="object-cover"
          sizes="56px"
          unoptimized
        />
      </div>

      <div className="flex min-w-0 flex-col justify-center">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          {movie.nameRu || movie.nameOriginal}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {rating !== null && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {rating.toFixed(1)}
            </span>
          )}
          {year && <span>{year}</span>}
        </div>
      </div>
    </Link>
  );
}

function WideMovieCard({ movie }: { movie: MoviePreview }) {
  const id = movie.kinopoiskId || movie.filmId;
  const imageUrl = getMoviePosterUrl(movie.posterUrlPreview || movie.posterUrl);
  const rating = getMovieRating(movie);
  const year = getMovieYear(movie);

  return (
    <Link
      href={`/movies/${id}`}
      className="anime-card group flex gap-4 rounded-lg bg-card overflow-hidden"
    >
      <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden">
        <Image
          src={imageUrl}
          alt={movie.nameRu || movie.nameOriginal || ''}
          fill
          className="object-cover"
          sizes="96px"
          unoptimized
        />
      </div>

      <div className="flex flex-col justify-center py-3 pr-4">
        <h3 className="line-clamp-2 text-base font-medium text-foreground group-hover:text-primary transition-colors">
          {movie.nameRu || movie.nameOriginal}
        </h3>
        {movie.nameOriginal && movie.nameRu && (
          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
            {movie.nameOriginal}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {movie.type && (
            <Badge
              variant="outline"
              className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30"
            >
              {getMovieTypeLabel(movie.type)}
            </Badge>
          )}
          {rating !== null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {rating.toFixed(1)}
            </span>
          )}
          {year && (
            <span className="text-xs text-muted-foreground">{year}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
