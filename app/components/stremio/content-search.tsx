'use client';

import { useState, useCallback, useRef } from 'react';
import { Search, Loader2, Film, Tv, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchContent, getExternalIds } from '@/lib/api/stremio';
import type { TMDBSearchResult } from '@/types/stremio';
import { useRouter } from 'next/navigation';

export function ContentSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState<number | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await searchContent(q);
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
    debounceRef.current = setTimeout(() => handleSearch(value), 500);
  };

  const handleSelect = async (item: TMDBSearchResult) => {
    setResolving(item.id);
    try {
      const ids = await getExternalIds(item.id, item.mediaType);
      if (!ids.imdbId) {
        alert('IMDB ID не найден для этого контента');
        setResolving(null);
        return;
      }

      const type = item.mediaType === 'movie' ? 'movie' : 'series';
      const params = new URLSearchParams({
        imdb: ids.imdbId,
        type,
        title: item.title,
        tmdb: item.id.toString(),
      });
      if (item.posterPath) params.set('poster', item.posterPath);

      router.push(`/stremio/watch?${params}`);
    } catch {
      alert('Ошибка получения IMDB ID');
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
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
