'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { Search, Loader2, Film, Tv, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimeGrid } from '@/components/anime/anime-grid';
import { MovieGrid } from '@/components/movies/movie-grid';
import { FilterPanel } from '@/components/catalog/filter-panel';
import { useCatalogFilters } from '@/hooks/use-catalog-filters';
import { searchAnime, getDiscoverItems, getAnimeByIds } from '@/lib/api/anime';
import { kinopoiskClient } from '@/lib/api/kinopoisk';
import type { Anime } from '@/types/anime';
import type { MoviePreview } from '@/types/movie';
import type { CatalogCategory } from '@/lib/constants/catalog';

const categoryConfig = {
  anime: {
    label: 'Аниме',
    icon: Sparkles,
    placeholder: 'Поиск аниме...',
    title: 'Каталог',
  },
  movies: {
    label: 'Фильмы',
    icon: Film,
    placeholder: 'Поиск фильмов...',
    title: 'Каталог',
  },
  series: {
    label: 'Сериалы',
    icon: Tv,
    placeholder: 'Поиск сериалов...',
    title: 'Каталог',
  },
};

function CatalogPageContent() {
  const {
    filters,
    setCategory,
    toggleGenre,
    setGenres,
    setYear,
    setYearRange,
    setStatus,
    setRating,
    setCountry,
    setSort,
    setQuery,
    resetFilters,
    hasActiveFilters,
  } = useCatalogFilters();

  const [animeResults, setAnimeResults] = useState<Anime[]>([]);
  const [movieResults, setMovieResults] = useState<MoviePreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState(filters.query);

  const performSearch = useCallback(
    async (resetResults = true) => {
      setIsLoading(true);

      try {
        const currentPage = resetResults ? 1 : page;

        if (filters.category === 'anime') {
          let response: Anime[];

          if (filters.query.trim()) {
            response = await searchAnime(filters.query, currentPage - 1);
          } else if (filters.genres.length > 0 || filters.year || filters.status) {
            // For anime with filters but no query, we'll still use discover
            // and filter client-side (anime API doesn't support filtering)
            if (currentPage === 1) {
              const discoverItems = await getDiscoverItems();
              const animeIds = discoverItems.map((item) => item.id);
              response = await getAnimeByIds(animeIds);

              // Client-side filtering for anime
              if (filters.year) {
                response = response.filter((a) => a.year === String(filters.year));
              }
              if (filters.status) {
                // Map status filter values to status names
                const statusMap: Record<string, string> = {
                  ongoing: 'В эфире',
                  released: 'Вышел',
                  announced: 'Анонс',
                };
                const statusName = statusMap[filters.status];
                if (statusName) {
                  response = response.filter((a) => a.status?.name === statusName);
                }
              }
            } else {
              response = [];
            }
          } else {
            if (currentPage === 1) {
              const discoverItems = await getDiscoverItems();
              const animeIds = discoverItems.map((item) => item.id);
              response = await getAnimeByIds(animeIds);
            } else {
              response = [];
            }
          }

          if (resetResults) {
            setAnimeResults(response);
            setPage(1);
            setTotalResults(null);
          } else {
            setAnimeResults((prev) => [...prev, ...response]);
          }

          setHasMore(filters.query.trim() ? response.length >= 20 : false);
        } else {
          // Movies or Series with filters
          if (filters.query.trim()) {
            const kinoPage = currentPage;
            const response = await kinopoiskClient.searchMovies(filters.query, kinoPage);

            const filtered = response.films.filter((film) => {
              if (filters.category === 'movies') {
                return film.type === 'FILM' || film.type === 'VIDEO' || !film.type;
              } else {
                return (
                  film.type === 'TV_SERIES' ||
                  film.type === 'MINI_SERIES' ||
                  film.type === 'TV_SHOW'
                );
              }
            });

            if (resetResults) {
              setMovieResults(filtered);
              setPage(1);
              setTotalResults(response.searchFilmsCountResult);
            } else {
              setMovieResults((prev) => [...prev, ...filtered]);
            }

            setHasMore(currentPage < response.pagesCount);
          } else {
            // Use filters API
            const type = filters.category === 'movies' ? 'FILM' : 'TV_SERIES';
            const response = await kinopoiskClient.getFilmsWithFilters({
              type,
              genres: filters.genres.length > 0 ? filters.genres[0] : undefined,
              countries: filters.country,
              yearFrom: filters.yearFrom,
              yearTo: filters.yearTo,
              ratingFrom: filters.rating,
              order: filters.sort as 'RATING' | 'NUM_VOTE' | 'YEAR',
              page: currentPage,
            });

            if (resetResults) {
              setMovieResults(response.items);
              setPage(1);
              setTotalResults(response.total);
            } else {
              setMovieResults((prev) => [...prev, ...response.items]);
            }

            setHasMore(currentPage < response.totalPages);
          }
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, page]
  );

  useEffect(() => {
    setSearchInput(filters.query);
  }, [filters.query]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(true);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    filters.category,
    filters.genres,
    filters.year,
    filters.yearFrom,
    filters.yearTo,
    filters.status,
    filters.rating,
    filters.country,
    filters.sort,
    filters.query,
  ]);

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    // Debounce the actual filter update
    const timeoutId = setTimeout(() => {
      setQuery(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const handleCategoryChange = (category: CatalogCategory) => {
    setCategory(category);
    setAnimeResults([]);
    setMovieResults([]);
    setPage(1);
    setHasMore(true);
    setTotalResults(null);
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
    performSearch(false);
  };

  const config = categoryConfig[filters.category];
  const results = filters.category === 'anime' ? animeResults : movieResults;
  const hasResults = results.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">{config.title}</h1>

      {/* Category Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex gap-2">
          {(Object.keys(categoryConfig) as CatalogCategory[]).map((cat) => {
            const Icon = categoryConfig[cat].icon;
            const isActive = filters.category === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
              >
                <Icon className="h-4 w-4" />
                {categoryConfig[cat].label}
              </button>
            );
          })}
        </div>

        <div className="relative sm:ml-auto w-full sm:w-auto sm:min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={config.placeholder}
            value={searchInput}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <FilterPanel
          filters={filters}
          onToggleGenre={toggleGenre}
          onClearGenres={() => setGenres([])}
          onYearChange={setYear}
          onYearRangeChange={setYearRange}
          onStatusChange={setStatus}
          onRatingChange={setRating}
          onCountryChange={setCountry}
          onSortChange={setSort}
          onQueryChange={setQuery}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Results Count */}
      {totalResults !== null && (
        <p className="text-sm text-muted-foreground mb-4">
          Найдено: {totalResults.toLocaleString('ru-RU')} результатов
        </p>
      )}

      {/* Results */}
      {isLoading && results.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-full mt-3" />
              <Skeleton className="h-3 w-20 mt-2" />
            </div>
          ))}
        </div>
      ) : hasResults ? (
        <>
          {filters.category === 'anime' ? (
            <AnimeGrid anime={animeResults} columns={5} />
          ) : (
            <MovieGrid movies={movieResults} columns={5} />
          )}

          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button variant="outline" size="lg" onClick={loadMore} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  'Загрузить ещё'
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Ничего не найдено</h2>
          <p className="text-muted-foreground">Попробуйте изменить параметры поиска</p>
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-full mt-3" />
                <Skeleton className="h-3 w-20 mt-2" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <CatalogPageContent />
    </Suspense>
  );
}
