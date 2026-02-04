'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Loader2, Film, Tv, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimeGrid } from '@/components/anime/anime-grid';
import { MovieGrid } from '@/components/movies/movie-grid';
import { searchAnime, getDiscoverItems, getAnimeByIds } from '@/lib/api/anime';
import { kinopoiskClient } from '@/lib/api/kinopoisk';
import type { Anime } from '@/types/anime';
import type { MoviePreview } from '@/types/movie';

type SearchCategory = 'anime' | 'movies' | 'series';

const categoryConfig = {
  anime: {
    label: 'Аниме',
    icon: Sparkles,
    placeholder: 'Поиск аниме...',
    title: 'Каталог аниме',
  },
  movies: {
    label: 'Фильмы',
    icon: Film,
    placeholder: 'Поиск фильмов...',
    title: 'Каталог фильмов',
  },
  series: {
    label: 'Сериалы',
    icon: Tv,
    placeholder: 'Поиск сериалов...',
    title: 'Каталог сериалов',
  },
};

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [category, setCategory] = useState<SearchCategory>(
    (searchParams.get('category') as SearchCategory) || 'anime'
  );
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [animeResults, setAnimeResults] = useState<Anime[]>([]);
  const [movieResults, setMovieResults] = useState<MoviePreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const performSearch = useCallback(
    async (resetResults = true) => {
      setIsLoading(true);

      try {
        const currentPage = resetResults ? 0 : page;

        if (category === 'anime') {
          let response: Anime[];

          if (query.trim()) {
            response = await searchAnime(query, currentPage);
          } else {
            if (currentPage === 0) {
              const discoverItems = await getDiscoverItems();
              const animeIds = discoverItems.map(item => item.id);
              response = await getAnimeByIds(animeIds);
            } else {
              response = [];
            }
          }

          if (resetResults) {
            setAnimeResults(response);
            setPage(0);
          } else {
            setAnimeResults((prev) => [...prev, ...response]);
          }

          setHasMore(query.trim() ? response.length >= 20 : false);
        } else {
          // Movies or Series search
          if (query.trim()) {
            const kinoPage = currentPage + 1; // Kinopoisk uses 1-based pages
            const response = await kinopoiskClient.searchMovies(query, kinoPage);

            // Filter by type
            const filtered = response.films.filter((film) => {
              if (category === 'movies') {
                return film.type === 'FILM' || film.type === 'VIDEO' || !film.type;
              } else {
                return film.type === 'TV_SERIES' || film.type === 'MINI_SERIES' || film.type === 'TV_SHOW';
              }
            });

            if (resetResults) {
              setMovieResults(filtered);
              setPage(0);
            } else {
              setMovieResults((prev) => [...prev, ...filtered]);
            }

            setHasMore(currentPage + 1 < response.pagesCount);
          } else {
            // Show popular items when no query
            if (currentPage === 0) {
              if (category === 'movies') {
                const response = await kinopoiskClient.getTopMovies('TOP_100_POPULAR_FILMS', 1);
                setMovieResults(response.films);
              } else {
                const response = await kinopoiskClient.getSeries(1, 'NUM_VOTE');
                setMovieResults(response.items);
              }
              setPage(0);
            }
            setHasMore(false);
          }
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [query, page, category]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(true);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, category]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    const newParams = new URLSearchParams(searchParams.toString());
    if (value) {
      newParams.set('q', value);
    } else {
      newParams.delete('q');
    }
    newParams.set('category', category);
    router.push(`/search?${newParams.toString()}`, { scroll: false });
  };

  const handleCategoryChange = (newCategory: SearchCategory) => {
    setCategory(newCategory);
    setAnimeResults([]);
    setMovieResults([]);
    setPage(0);
    setHasMore(true);

    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('category', newCategory);
    router.push(`/search?${newParams.toString()}`, { scroll: false });
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
    performSearch(false);
  };

  const config = categoryConfig[category];
  const results = category === 'anime' ? animeResults : movieResults;
  const hasResults = results.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">{config.title}</h1>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6">
        {(Object.keys(categoryConfig) as SearchCategory[]).map((cat) => {
          const Icon = categoryConfig[cat].icon;
          const isActive = category === cat;
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

      {/* Search Input */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={config.placeholder}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

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
          {category === 'anime' ? (
            <AnimeGrid anime={animeResults} columns={5} />
          ) : (
            <MovieGrid movies={movieResults} columns={5} />
          )}

          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={loadMore}
                disabled={isLoading}
              >
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
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Ничего не найдено
          </h2>
          <p className="text-muted-foreground">
            Попробуйте изменить параметры поиска
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
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
      <SearchPageContent />
    </Suspense>
  );
}
