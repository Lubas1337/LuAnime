'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Loader2, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchAnime } from '@/lib/api/anime';
import { getImageUrl } from '@/types/anime';
import type { Anime } from '@/types/anime';

interface SearchAutocompleteProps {
  className?: string;
  onSelect?: () => void;
}

export function SearchAutocomplete({ className, onSelect }: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchAnime(query, 0);
        setResults(data.slice(0, 6)); // Limit to 6 results
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (anime: Anime) => {
    setQuery('');
    setIsOpen(false);
    onSelect?.();
    router.push(`/anime/${anime.id}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (query.trim()) {
      setIsOpen(false);
      onSelect?.();
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Поиск аниме..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim() && results.length > 0 && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="w-64 pl-9 pr-9 bg-secondary border-none"
            autoComplete="off"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>
      </form>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[400px] overflow-y-auto">
            {results.map((anime, index) => {
              const imageUrl = anime.image || getImageUrl(anime.poster);
              return (
                <button
                  key={anime.id}
                  type="button"
                  onClick={() => handleSelect(anime)}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-secondary/80 ${
                    index === selectedIndex ? 'bg-secondary' : ''
                  }`}
                >
                  <div className="relative w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
                    <Image
                      src={imageUrl}
                      alt={anime.title_ru}
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {anime.title_ru}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {anime.year && (
                        <span className="text-xs text-muted-foreground">
                          {anime.year}
                        </span>
                      )}
                      {anime.grade !== undefined && anime.grade > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {anime.grade.toFixed(1)}
                        </span>
                      )}
                      {anime.episodes_total && (
                        <span className="text-xs text-muted-foreground">
                          {anime.episodes_released || anime.episodes_total} эп.
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer - show all results */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onSelect?.();
              router.push(`/search?q=${encodeURIComponent(query)}`);
            }}
            className="w-full p-3 text-sm text-center text-primary hover:bg-secondary/50 border-t border-border transition-colors"
          >
            Показать все результаты
          </button>
        </div>
      )}

      {/* No results */}
      {isOpen && query.trim() && !isLoading && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-muted-foreground text-center">
            Ничего не найдено
          </p>
        </div>
      )}
    </div>
  );
}
