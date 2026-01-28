'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimeGrid } from '@/components/anime/anime-grid';
import { searchAnime, getDiscoverItems, getAnimeByIds } from '@/lib/api/anime';
import type { Anime } from '@/types/anime';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const performSearch = useCallback(
    async (resetResults = true) => {
      setIsLoading(true);

      try {
        const currentPage = resetResults ? 0 : page;

        let response: Anime[];

        if (query.trim()) {
          // Search by query
          response = await searchAnime(query, currentPage);
        } else {
          // Show popular/discover items when no query
          if (currentPage === 0) {
            const discoverItems = await getDiscoverItems();
            const animeIds = discoverItems.map(item => item.id);
            response = await getAnimeByIds(animeIds);
          } else {
            response = [];
          }
        }

        if (resetResults) {
          setResults(response);
          setPage(0);
        } else {
          setResults((prev) => [...prev, ...response]);
        }

        setHasMore(query.trim() ? response.length >= 20 : false);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [query, page]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(true);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    const newParams = new URLSearchParams(searchParams.toString());
    if (value) {
      newParams.set('q', value);
    } else {
      newParams.delete('q');
    }
    router.push(`/search?${newParams.toString()}`, { scroll: false });
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
    performSearch(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Каталог аниме</h1>

      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск аниме..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

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
      ) : results.length > 0 ? (
        <>
          <AnimeGrid anime={results} columns={5} />

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
