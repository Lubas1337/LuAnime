'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { CatalogCategory } from '@/lib/constants/catalog';

export interface CatalogFilters {
  category: CatalogCategory;
  genres: number[];
  year?: number;
  yearFrom?: number;
  yearTo?: number;
  status?: string;
  rating?: number;
  country?: number;
  sort: string;
  query: string;
}

const DEFAULT_SORT: Record<CatalogCategory, string> = {
  anime: 'popular',
  movies: 'NUM_VOTE',
  series: 'NUM_VOTE',
};

export function useCatalogFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters = useMemo<CatalogFilters>(() => {
    const category = (searchParams.get('category') as CatalogCategory) || 'anime';
    const genresParam = searchParams.get('genres');

    return {
      category,
      genres: genresParam ? genresParam.split(',').map(Number).filter(Boolean) : [],
      year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
      yearFrom: searchParams.get('yearFrom') ? Number(searchParams.get('yearFrom')) : undefined,
      yearTo: searchParams.get('yearTo') ? Number(searchParams.get('yearTo')) : undefined,
      status: searchParams.get('status') || undefined,
      rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
      country: searchParams.get('country') ? Number(searchParams.get('country')) : undefined,
      sort: searchParams.get('sort') || DEFAULT_SORT[category],
      query: searchParams.get('q') || '',
    };
  }, [searchParams]);

  const updateFilters = useCallback(
    (updates: Partial<CatalogFilters>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          newParams.delete(key === 'query' ? 'q' : key);
        } else if (key === 'genres' && Array.isArray(value)) {
          newParams.set('genres', value.join(','));
        } else if (key === 'query') {
          newParams.set('q', String(value));
        } else {
          newParams.set(key, String(value));
        }
      });

      // When changing category, reset category-specific filters
      if (updates.category && updates.category !== filters.category) {
        if (updates.category === 'anime') {
          newParams.delete('yearFrom');
          newParams.delete('yearTo');
          newParams.delete('country');
        } else {
          newParams.delete('year');
          newParams.delete('status');
        }
        // Reset sort to default for new category
        newParams.set('sort', DEFAULT_SORT[updates.category]);
        // Clear genres when switching category
        newParams.delete('genres');
      }

      router.push(`/catalog?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, router, filters.category]
  );

  const setCategory = useCallback(
    (category: CatalogCategory) => updateFilters({ category }),
    [updateFilters]
  );

  const setGenres = useCallback(
    (genres: number[]) => updateFilters({ genres }),
    [updateFilters]
  );

  const toggleGenre = useCallback(
    (genreId: number) => {
      const newGenres = filters.genres.includes(genreId)
        ? filters.genres.filter((id) => id !== genreId)
        : [...filters.genres, genreId];
      updateFilters({ genres: newGenres });
    },
    [filters.genres, updateFilters]
  );

  const setYear = useCallback(
    (year?: number) => updateFilters({ year }),
    [updateFilters]
  );

  const setYearRange = useCallback(
    (yearFrom?: number, yearTo?: number) => updateFilters({ yearFrom, yearTo }),
    [updateFilters]
  );

  const setStatus = useCallback(
    (status?: string) => updateFilters({ status }),
    [updateFilters]
  );

  const setRating = useCallback(
    (rating?: number) => updateFilters({ rating: rating === 0 ? undefined : rating }),
    [updateFilters]
  );

  const setCountry = useCallback(
    (country?: number) => updateFilters({ country }),
    [updateFilters]
  );

  const setSort = useCallback(
    (sort: string) => updateFilters({ sort }),
    [updateFilters]
  );

  const setQuery = useCallback(
    (query: string) => updateFilters({ query }),
    [updateFilters]
  );

  const resetFilters = useCallback(() => {
    const category = filters.category;
    router.push(`/catalog?category=${category}&sort=${DEFAULT_SORT[category]}`, { scroll: false });
  }, [filters.category, router]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.genres.length > 0 ||
      filters.year !== undefined ||
      filters.yearFrom !== undefined ||
      filters.yearTo !== undefined ||
      filters.status !== undefined ||
      (filters.rating !== undefined && filters.rating > 0) ||
      filters.country !== undefined ||
      filters.query !== ''
    );
  }, [filters]);

  return {
    filters,
    updateFilters,
    setCategory,
    setGenres,
    toggleGenre,
    setYear,
    setYearRange,
    setStatus,
    setRating,
    setCountry,
    setSort,
    setQuery,
    resetFilters,
    hasActiveFilters,
  };
}
