'use client';

import { GenreSelector } from './genre-selector';
import { YearSelector } from './year-selector';
import { StatusSelector } from './status-selector';
import { RatingSelector } from './rating-selector';
import { CountrySelector } from './country-selector';
import { SortSelect } from './sort-select';
import { ActiveFilters } from './active-filters';
import {
  ANIME_GENRES,
  MOVIE_GENRES,
  type CatalogCategory,
} from '@/lib/constants/catalog';
import type { CatalogFilters } from '@/hooks/use-catalog-filters';

interface FilterPanelProps {
  filters: CatalogFilters;
  onToggleGenre: (id: number) => void;
  onClearGenres: () => void;
  onYearChange: (year?: number) => void;
  onYearRangeChange: (from?: number, to?: number) => void;
  onStatusChange: (status?: string) => void;
  onRatingChange: (rating?: number) => void;
  onCountryChange: (country?: number) => void;
  onSortChange: (sort: string) => void;
  onQueryChange: (query: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function FilterPanel({
  filters,
  onToggleGenre,
  onClearGenres,
  onYearChange,
  onYearRangeChange,
  onStatusChange,
  onRatingChange,
  onCountryChange,
  onSortChange,
  onQueryChange,
  onReset,
  hasActiveFilters,
}: FilterPanelProps) {
  const genres = filters.category === 'anime' ? ANIME_GENRES : MOVIE_GENRES;
  const isAnime = filters.category === 'anime';

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <GenreSelector
          genres={genres}
          selectedGenres={filters.genres}
          onToggleGenre={onToggleGenre}
          onClear={onClearGenres}
        />

        {isAnime ? (
          <YearSelector
            variant="single"
            year={filters.year}
            onYearChange={onYearChange}
          />
        ) : (
          <YearSelector
            variant="range"
            yearFrom={filters.yearFrom}
            yearTo={filters.yearTo}
            onYearRangeChange={onYearRangeChange}
          />
        )}

        {isAnime && (
          <StatusSelector value={filters.status} onChange={onStatusChange} />
        )}

        <RatingSelector value={filters.rating} onChange={onRatingChange} />

        {!isAnime && (
          <CountrySelector value={filters.country} onChange={onCountryChange} />
        )}

        <div className="ml-auto">
          <SortSelect
            category={filters.category}
            value={filters.sort}
            onChange={onSortChange}
          />
        </div>
      </div>

      {/* Active Filters */}
      <ActiveFilters
        filters={filters}
        onRemoveGenre={onToggleGenre}
        onRemoveYear={() => onYearChange(undefined)}
        onRemoveYearRange={() => onYearRangeChange(undefined, undefined)}
        onRemoveStatus={() => onStatusChange(undefined)}
        onRemoveRating={() => onRatingChange(undefined)}
        onRemoveCountry={() => onCountryChange(undefined)}
        onRemoveQuery={() => onQueryChange('')}
        onReset={onReset}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
}
