'use client';

import { useEffect, useState } from 'react';
import { Tv, TrendingUp, Star, Sparkles, Loader2 } from 'lucide-react';
import { MovieGrid } from '@/components/movies/movie-grid';
import { kinopoiskClient } from '@/lib/api/kinopoisk';
import type { MoviePreview } from '@/types/movie';

export default function SeriesPage() {
  const [popularSeries, setPopularSeries] = useState<MoviePreview[]>([]);
  const [topRatedSeries, setTopRatedSeries] = useState<MoviePreview[]>([]);
  const [newSeries, setNewSeries] = useState<MoviePreview[]>([]);
  const [miniSeries, setMiniSeries] = useState<MoviePreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [popularRes, topRatedRes, newRes, miniRes] = await Promise.all([
          kinopoiskClient.getSeries(1, 'NUM_VOTE'),
          kinopoiskClient.getSeries(1, 'RATING'),
          kinopoiskClient.getSeries(1, 'YEAR'),
          kinopoiskClient.getMiniSeries(1, 'RATING'),
        ]);

        setPopularSeries(popularRes.items?.slice(0, 10) || []);
        setTopRatedSeries(topRatedRes.items?.slice(0, 10) || []);
        setNewSeries(newRes.items?.slice(0, 10) || []);
        setMiniSeries(miniRes.items?.slice(0, 10) || []);
      } catch (error) {
        console.error('Failed to fetch series:', error);
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
              <Tv className="h-10 w-10 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Сериалы
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Смотрите лучшие сериалы онлайн бесплатно в хорошем качестве
            </p>
          </div>
        </div>
      </section>

      {/* Popular Series */}
      {popularSeries.length > 0 && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Популярные сериалы</h2>
            </div>
            <MovieGrid movies={popularSeries} columns={5} />
          </div>
        </section>
      )}

      {/* Top Rated Series */}
      {topRatedSeries.length > 0 && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <Star className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Лучшие по рейтингу</h2>
            </div>
            <MovieGrid movies={topRatedSeries} columns={5} />
          </div>
        </section>
      )}

      {/* New Series */}
      {newSeries.length > 0 && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Новые сериалы</h2>
            </div>
            <MovieGrid movies={newSeries} columns={5} />
          </div>
        </section>
      )}

      {/* Mini Series */}
      {miniSeries.length > 0 && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <Tv className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Мини-сериалы</h2>
            </div>
            <MovieGrid movies={miniSeries} columns={5} />
          </div>
        </section>
      )}
    </div>
  );
}
