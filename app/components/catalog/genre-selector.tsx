'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface Genre {
  id: number;
  name: string;
}

interface GenreSelectorProps {
  genres: Genre[];
  selectedGenres: number[];
  onToggleGenre: (id: number) => void;
  onClear?: () => void;
}

export function GenreSelector({
  genres,
  selectedGenres,
  onToggleGenre,
  onClear,
}: GenreSelectorProps) {
  const [search, setSearch] = useState('');

  const filteredGenres = useMemo(() => {
    if (!search) return genres;
    return genres.filter((genre) =>
      genre.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [genres, search]);

  const selectedCount = selectedGenres.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[140px] justify-between">
          <span className="truncate">
            {selectedCount > 0 ? `Жанры (${selectedCount})` : 'Жанры'}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск жанров..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-8"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-64 overflow-y-auto">
          {filteredGenres.map((genre) => (
            <DropdownMenuCheckboxItem
              key={genre.id}
              checked={selectedGenres.includes(genre.id)}
              onCheckedChange={() => onToggleGenre(genre.id)}
              onSelect={(e) => e.preventDefault()}
            >
              {genre.name}
            </DropdownMenuCheckboxItem>
          ))}
          {filteredGenres.length === 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Жанры не найдены
            </div>
          )}
        </div>
        {selectedCount > 0 && onClear && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.preventDefault();
                  onClear();
                }}
              >
                Очистить выбор
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
