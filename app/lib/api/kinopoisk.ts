import type {
  Movie,
  MoviePreview,
  TopMoviesResponse,
  PremieresResponse,
  SearchMoviesResponse,
  MovieVideosResponse,
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
