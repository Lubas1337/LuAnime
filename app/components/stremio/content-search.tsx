'use client';

import { useState, useCallback, useRef } from 'react';
import { Search, Loader2, Film, Tv, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchContent, getExternalIds } from '@/lib/api/stremio';
import type { SearchSource } from '@/lib/api/stremio';
import type { TMDBSearchResult } from '@/types/stremio';
import { useRouter } from 'next/navigation';

export function ContentSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState<number | string | null>(null);
  const [source, setSource] = useState<SearchSource>('cinemeta');
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  const handleSearch = useCallback(async (q: string, src: SearchSource) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await searchContent(q, src);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(value, source), 500);
  };

  const handleSourceChange = (newSource: SearchSource) => {
    setSource(newSource);
    if (query.trim()) {
      handleSearch(query, newSource);
    }
  };

  const handleSelect = async (item: TMDBSearchResult) => {
    setResolving(item.id);
    try {
      let imdbId: string | null = null;

      // Cinemeta results already have IMDB ID as the `id` field
      if (item.imdbId) {
        imdbId = item.imdbId;
      } else if (source === 'cinemeta' && typeof item.id === 'string' && (item.id as string).startsWith('tt')) {
        imdbId = item.id as unknown as string;
      } else {
        // TMDB — need to fetch external IDs
        const ids = await getExternalIds(item.id as number, item.mediaType);
        imdbId = ids.imdbId;
      }

      if (!imdbId) {
        alert('IMDB ID не найден для этого контента');
        setResolving(null);
        return;
      }

      const type = item.mediaType === 'movie' ? 'movie' : 'series';
      const params = new URLSearchParams({
        imdb: imdbId,
        type,
        title: item.title,
      });
      if (item.posterPath) params.set('poster', item.posterPath);

      router.push(`/stremio/watch?${params}`);
    } catch {
      alert('Ошибка получения данных');
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Поиск фильмов и сериалов..."
            className="pl-10"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
          <button
            onClick={() => handleSourceChange('cinemeta')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              source === 'cinemeta'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            Cinemeta
          </button>
          <button
            onClick={() => handleSourceChange('tmdb')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              source === 'tmdb'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            TMDB
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((item) => (
            <button
              key={`${item.mediaType}-${item.id}`}
              onClick={() => handleSelect(item)}
              disabled={resolving === item.id}
              className="group text-left rounded-xl overflow-hidden border border-border bg-card hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
            >
              <div className="aspect-[2/3] relative bg-secondary">
                {item.posterPath ? (
                  <img
                    src={item.posterPath}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {item.mediaType === 'movie' ? (
                      <Film className="h-8 w-8 text-muted-foreground" />
                    ) : (
                      <Tv className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                )}
                {resolving === item.id && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    item.mediaType === 'movie'
                      ? 'bg-blue-500/80 text-white'
                      : 'bg-purple-500/80 text-white'
                  }`}>
                    {item.mediaType === 'movie' ? 'Фильм' : 'Сериал'}
                  </span>
                </div>
                {(item.voteAverage ?? 0) > 0 && (
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/70 rounded px-1.5 py-0.5">
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] font-medium text-white">
                      {item.voteAverage!.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="font-medium text-sm line-clamp-2 leading-tight">
                  {item.title}
                </p>
                {item.releaseDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.releaseDate.split('-')[0]}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Ничего не найдено
        </div>
      )}
    </div>
  );
}
