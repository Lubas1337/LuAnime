'use client';

import { useEffect, useState } from 'react';
import { Film, Calendar, TrendingUp, Award, Loader2 } from 'lucide-react';
import { MovieGrid } from '@/components/movies/movie-grid';
import { kinopoiskClient, getCurrentMonth, getCurrentYear } from '@/lib/api/kinopoisk';
import type { MoviePreview } from '@/types/movie';

export default function MoviesPage() {
  const [topMovies, setTopMovies] = useState<MoviePreview[]>([]);
  const [premieres, setPremieres] = useState<MoviePreview[]>([]);
  const [bestMovies, setBestMovies] = useState<MoviePreview[]>([]);
  const [awaitMovies, setAwaitMovies] = useState<MoviePreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [topRes, premRes, bestRes, awaitRes] = await Promise.all([
          kinopoiskClient.getTopMovies('TOP_100_POPULAR_FILMS'),
          kinopoiskClient.getPremieres(getCurrentYear(), getCurrentMonth()),
          kinopoiskClient.getTopMovies('TOP_250_BEST_FILMS'),
          kinopoiskClient.getTopMovies('TOP_AWAIT_FILMS'),
        ]);

        setTopMovies(topRes.films.slice(0, 10));
        setPremieres(premRes.items.slice(0, 10));
        setBestMovies(bestRes.films.slice(0, 10));
        setAwaitMovies(awaitRes.films.slice(0, 10));
      } catch (error) {
        console.error('Failed to fetch movies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Film className="h-10 w-10 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Кино
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Смотрите лучшие фильмы онлайн бесплатно в хорошем качестве
            </p>
          </div>
        </div>
      </section>

      {/* Top Popular Movies */}
      {topMovies.length > 0 && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Популярные фильмы</h2>
            </div>
            <MovieGrid movies={topMovies} columns={5} />
          </div>
        </section>
      )}

      {/* Premieres */}
      {premieres.length > 0 && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Премьеры месяца</h2>
            </div>
            <MovieGrid movies={premieres} columns={5} />
          </div>
        </section>
      )}

      {/* Best Movies */}
      {bestMovies.length > 0 && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <Award className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Лучшие фильмы</h2>
            </div>
            <MovieGrid movies={bestMovies} columns={5} />
          </div>
        </section>
      )}

      {/* Await Movies */}
      {awaitMovies.length > 0 && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <Film className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Ожидаемые фильмы</h2>
            </div>
            <MovieGrid movies={awaitMovies} columns={5} />
          </div>
        </section>
      )}
    </div>
  );
}
