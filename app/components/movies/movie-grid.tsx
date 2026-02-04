'use client';

import { MovieCard } from './movie-card';
import type { MoviePreview } from '@/types/movie';

interface MovieGridProps {
  movies: MoviePreview[];
  columns?: 2 | 3 | 4 | 5 | 6;
  variant?: 'default' | 'compact' | 'wide';
}

export function MovieGrid({ movies, columns = 5, variant = 'default' }: MovieGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
  };

  if (variant === 'wide') {
    return (
      <div className="space-y-3">
        {movies.map((movie, index) => (
          <div
            key={movie.kinopoiskId || movie.filmId || index}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <MovieCard movie={movie} variant="wide" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        {movies.map((movie, index) => (
          <div
            key={movie.kinopoiskId || movie.filmId || index}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <MovieCard movie={movie} variant="compact" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {movies.map((movie, index) => (
        <div
          key={movie.kinopoiskId || movie.filmId || index}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <MovieCard movie={movie} />
        </div>
      ))}
    </div>
  );
}
