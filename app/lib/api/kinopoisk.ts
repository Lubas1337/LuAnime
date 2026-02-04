import type {
  Movie,
  MoviePreview,
  TopMoviesResponse,
  PremieresResponse,
  SearchMoviesResponse,
  MovieVideosResponse,
  FilmsResponse,
  SeasonsResponse,
} from '@/types/movie';

const API_BASE = '/api/kinopoisk';

class KinopoiskClient {
  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Request failed with status ${response.status}`
      );
    }

    return response.json();
  }

  async getTopMovies(
    type: 'TOP_100_POPULAR_FILMS' | 'TOP_250_BEST_FILMS' | 'TOP_AWAIT_FILMS' = 'TOP_100_POPULAR_FILMS',
    page: number = 1
  ): Promise<TopMoviesResponse> {
    return this.request<TopMoviesResponse>(
      `/v2.2/films/top?type=${type}&page=${page}`
    );
  }

  async getPremieres(year: number, month: string): Promise<PremieresResponse> {
    return this.request<PremieresResponse>(
      `/v2.2/films/premieres?year=${year}&month=${month}`
    );
  }

  async getMovieById(id: number): Promise<Movie> {
    return this.request<Movie>(`/v2.2/films/${id}`);
  }

  async searchMovies(keyword: string, page: number = 1): Promise<SearchMoviesResponse> {
    return this.request<SearchMoviesResponse>(
      `/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(keyword)}&page=${page}`
    );
  }

  async getTrailers(id: number): Promise<MovieVideosResponse> {
    return this.request<MovieVideosResponse>(`/v2.2/films/${id}/videos`);
  }

  async getSimilarMovies(id: number): Promise<{ total: number; items: MoviePreview[] }> {
    return this.request<{ total: number; items: MoviePreview[] }>(
      `/v2.2/films/${id}/similars`
    );
  }

  async getStaff(id: number): Promise<Array<{
    staffId: number;
    nameRu: string;
    nameEn: string;
    professionKey: string;
    professionText: string;
    posterUrl?: string;
  }>> {
    return this.request(`/v1/staff?filmId=${id}`);
  }

  async getSeries(
    page: number = 1,
    order: 'RATING' | 'NUM_VOTE' | 'YEAR' = 'RATING'
  ): Promise<FilmsResponse> {
    return this.request<FilmsResponse>(
      `/v2.2/films?type=TV_SERIES&order=${order}&page=${page}`
    );
  }

  async getMiniSeries(
    page: number = 1,
    order: 'RATING' | 'NUM_VOTE' | 'YEAR' = 'RATING'
  ): Promise<FilmsResponse> {
    return this.request<FilmsResponse>(
      `/v2.2/films?type=MINI_SERIES&order=${order}&page=${page}`
    );
  }

  async getSeriesByGenre(
    genreId: number,
    page: number = 1
  ): Promise<FilmsResponse> {
    return this.request<FilmsResponse>(
      `/v2.2/films?type=TV_SERIES&genres=${genreId}&order=RATING&page=${page}`
    );
  }

  async getSeasons(id: number): Promise<SeasonsResponse> {
    return this.request<SeasonsResponse>(`/v2.2/films/${id}/seasons`);
  }

  async getSeriesCollections(
    collectionType: 'TOP_POPULAR_ALL' | 'TOP_POPULAR_MOVIES' | 'VAMPIRE_THEME' | 'COMICS_THEME',
    page: number = 1
  ): Promise<FilmsResponse> {
    return this.request<FilmsResponse>(
      `/v2.2/films/collections?type=${collectionType}&page=${page}`
    );
  }

  async getFilmsWithFilters(params: {
    type: 'FILM' | 'TV_SERIES' | 'MINI_SERIES' | 'ALL';
    genres?: number;
    countries?: number;
    yearFrom?: number;
    yearTo?: number;
    ratingFrom?: number;
    order?: 'RATING' | 'NUM_VOTE' | 'YEAR';
    page?: number;
  }): Promise<FilmsResponse> {
    const query = new URLSearchParams();
    if (params.type !== 'ALL') {
      query.set('type', params.type);
    }
    if (params.genres) query.set('genres', String(params.genres));
    if (params.countries) query.set('countries', String(params.countries));
    if (params.yearFrom) query.set('yearFrom', String(params.yearFrom));
    if (params.yearTo) query.set('yearTo', String(params.yearTo));
    if (params.ratingFrom) query.set('ratingFrom', String(params.ratingFrom));
    if (params.order) query.set('order', params.order);
    query.set('page', String(params.page || 1));

    return this.request<FilmsResponse>(`/v2.2/films?${query.toString()}`);
  }
}

export const kinopoiskClient = new KinopoiskClient();

export function getCurrentMonth(): string {
  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];
  return months[new Date().getMonth()];
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}
