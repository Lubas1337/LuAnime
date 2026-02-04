'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { MovieGrid } from './movie-grid';
import { kinopoiskClient } from '@/lib/api/kinopoisk';
import type { MoviePreview } from '@/types/movie';

interface TopMoviesProps {
  title?: string;
  type?: 'TOP_100_POPULAR_FILMS' | 'TOP_250_BEST_FILMS' | 'TOP_AWAIT_FILMS';
  limit?: number;
  showLink?: boolean;
}

export function TopMovies({
  title = 'Популярные фильмы',
  type = 'TOP_100_POPULAR_FILMS',
  limit = 10,
  showLink = true,
}: TopMoviesProps) {
  const [movies, setMovies] = useState<MoviePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await kinopoiskClient.getTopMovies(type);
        setMovies(response.films.slice(0, limit));
      } catch (err) {
        console.error('Failed to fetch top movies:', err);
        setError('Не удалось загрузить фильмы');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [type, limit]);

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (error || movies.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          </div>
          {showLink && (
            <Link
              href="/movies/catalog"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Все фильмы
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <MovieGrid movies={movies} columns={5} />
      </div>
    </section>
  );
}
