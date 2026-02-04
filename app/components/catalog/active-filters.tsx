'use client';

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ANIME_GENRES,
  MOVIE_GENRES,
  COUNTRIES,
  ANIME_STATUS,
  RATING_OPTIONS,
  type CatalogCategory,
} from '@/lib/constants/catalog';
import type { CatalogFilters } from '@/hooks/use-catalog-filters';

interface ActiveFiltersProps {
  filters: CatalogFilters;
  onRemoveGenre: (id: number) => void;
  onRemoveYear: () => void;
  onRemoveYearRange: () => void;
  onRemoveStatus: () => void;
  onRemoveRating: () => void;
  onRemoveCountry: () => void;
  onRemoveQuery: () => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function ActiveFilters({
  filters,
  onRemoveGenre,
  onRemoveYear,
  onRemoveYearRange,
  onRemoveStatus,
  onRemoveRating,
  onRemoveCountry,
  onRemoveQuery,
  onReset,
  hasActiveFilters,
}: ActiveFiltersProps) {
  if (!hasActiveFilters) return null;

  const genresList = filters.category === 'anime' ? ANIME_GENRES : MOVIE_GENRES;

  const getGenreName = (id: number) => {
    return genresList.find((g) => g.id === id)?.name || `Жанр ${id}`;
  };

  const getCountryName = (id: number) => {
    return COUNTRIES.find((c) => c.id === id)?.name || `Страна ${id}`;
  };

  const getStatusLabel = (value: string) => {
    return ANIME_STATUS.find((s) => s.value === value)?.label || value;
  };

  const getRatingLabel = (value: number) => {
    return RATING_OPTIONS.find((r) => r.value === value)?.label || `${value}+`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Выбрано:</span>

      {filters.query && (
        <Badge variant="secondary" className="gap-1">
          &quot;{filters.query}&quot;
          <button
            onClick={onRemoveQuery}
            className="ml-1 rounded-full hover:bg-foreground/10"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.genres.map((genreId) => (
        <Badge key={genreId} variant="secondary" className="gap-1">
          {getGenreName(genreId)}
          <button
            onClick={() => onRemoveGenre(genreId)}
            className="ml-1 rounded-full hover:bg-foreground/10"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {filters.year && (
        <Badge variant="secondary" className="gap-1">
          {filters.year}
          <button
            onClick={onRemoveYear}
            className="ml-1 rounded-full hover:bg-foreground/10"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {(filters.yearFrom || filters.yearTo) && (
        <Badge variant="secondary" className="gap-1">
          {filters.yearFrom || '...'} — {filters.yearTo || '...'}
          <button
            onClick={onRemoveYearRange}
            className="ml-1 rounded-full hover:bg-foreground/10"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.status && (
        <Badge variant="secondary" className="gap-1">
          {getStatusLabel(filters.status)}
          <button
            onClick={onRemoveStatus}
            className="ml-1 rounded-full hover:bg-foreground/10"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.rating && filters.rating > 0 && (
        <Badge variant="secondary" className="gap-1">
          {getRatingLabel(filters.rating)}
          <button
            onClick={onRemoveRating}
            className="ml-1 rounded-full hover:bg-foreground/10"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.country && (
        <Badge variant="secondary" className="gap-1">
          {getCountryName(filters.country)}
          <button
            onClick={onRemoveCountry}
            className="ml-1 rounded-full hover:bg-foreground/10"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
        Сбросить
      </Button>
    </div>
  );
}
