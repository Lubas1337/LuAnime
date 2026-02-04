export interface Movie {
  kinopoiskId: number;
  nameRu: string;
  nameOriginal?: string;
  nameEn?: string;
  posterUrl: string;
  posterUrlPreview: string;
  coverUrl?: string;
  logoUrl?: string;
  year?: number;
  filmLength?: number;
  slogan?: string;
  description?: string;
  shortDescription?: string;
  ratingKinopoisk?: number;
  ratingImdb?: number;
  ratingFilmCritics?: number;
  ratingAwait?: number;
  ratingKinopoiskVoteCount?: number;
  ratingImdbVoteCount?: number;
  type: 'FILM' | 'TV_SERIES' | 'TV_SHOW' | 'MINI_SERIES' | 'VIDEO';
  countries?: { country: string }[];
  genres?: { genre: string }[];
  startYear?: number;
  endYear?: number;
  serial?: boolean;
  shortFilm?: boolean;
  completed?: boolean;
  webUrl?: string;
}

export interface MoviePreview {
  kinopoiskId?: number;
  filmId?: number;
  nameRu: string;
  nameOriginal?: string;
  nameEn?: string;
  posterUrl: string;
  posterUrlPreview: string;
  year?: number | string;
  filmLength?: string;
  rating?: number | string;
  ratingKinopoisk?: number;
  ratingImdb?: number;
  countries?: { country: string }[];
  genres?: { genre: string }[];
  type?: string;
}

export interface MovieVideo {
  url: string;
  name: string;
  site: string;
}

export interface MovieVideosResponse {
  total: number;
  items: MovieVideo[];
}

export interface TopMoviesResponse {
  pagesCount: number;
  films: MoviePreview[];
}

export interface PremieresResponse {
  total: number;
  items: MoviePreview[];
}

export interface SearchMoviesResponse {
  keyword: string;
  pagesCount: number;
  searchFilmsCountResult: number;
  films: MoviePreview[];
}

export interface FilmsResponse {
  total: number;
  totalPages: number;
  items: MoviePreview[];
}

export interface Episode {
  seasonNumber: number;
  episodeNumber: number;
  nameRu?: string;
  nameEn?: string;
  synopsis?: string;
  releaseDate?: string;
}

export interface Season {
  number: number;
  episodes: Episode[];
}

export interface SeasonsResponse {
  total: number;
  items: Season[];
}

export interface HDRezkaSearchResult {
  url: string;
  title: string;
  titleOriginal?: string;
  year?: number;
  type?: string;
  poster?: string;
}

export interface HDRezkaTranslation {
  id: number;
  title: string;
  isCamrip?: boolean;
  isAds?: boolean;
  isDirector?: boolean;
}

export interface HDRezkaStream {
  qualities: Record<string, string>;
  subtitles?: { lang: string; url: string }[];
  translations: HDRezkaTranslation[];
  defaultTranslation?: number;
}

export interface MovieStreamResponse {
  streams?: HDRezkaStream;
  error?: string;
}

export function getMoviePosterUrl(url: string | undefined): string {
  if (!url) return 'https://placehold.co/300x450/1e293b/8b5cf6?text=No+Image';
  return url;
}

export function formatMovieDuration(minutes: number | undefined): string {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}ч ${mins}м`;
  }
  return `${mins}м`;
}

export function getMovieTypeLabel(type: string): string {
  const types: Record<string, string> = {
    FILM: 'Фильм',
    TV_SERIES: 'Сериал',
    TV_SHOW: 'ТВ-шоу',
    MINI_SERIES: 'Мини-сериал',
    VIDEO: 'Видео',
  };
  return types[type] || type;
}
