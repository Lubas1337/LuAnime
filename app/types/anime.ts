export interface Anime {
  id: number;
  title_ru: string;
  title_original?: string;
  title_en?: string;
  description?: string;
  poster: string;
  image?: string;
  screenshots?: string[];
  screenshot_images?: string[];
  year?: string;
  grade?: number;
  rating?: number;
  votes?: number;
  vote_count?: number;
  status?: AnimeStatusObj;
  episodes_total?: number;
  episodes_released?: number;
  duration?: number;
  genres?: string;
  country?: string;
  season?: number;
  broadcast?: number;
  category?: { id: number; name: string };
  related?: RelatedAnime[];
  related_releases?: RelatedAnime[];
  is_favorite?: boolean;
}

export interface AnimeStatusObj {
  id: number;
  name: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface RelatedAnime {
  id: number;
  title_ru: string;
  poster: string;
  image?: string;
  relation_type?: string;
}

export type AnimeStatus = 'ongoing' | 'released' | 'announced' | 'paused' | 'cancelled';

export interface Episode {
  id: number;
  number: number;
  name?: string;
  title?: string;
  sources?: VideoSource[];
  embed_url?: string;
  created_at?: string;
  updated_at?: number;
}

export interface VideoSource {
  url: string;
  quality: string;
  translation_id?: number;
  translation_title?: string;
}

export interface Translation {
  id: number;
  title: string;
  type?: string;
  type_name?: string;
  episodes_count?: number;
}

export interface ScheduleAnime {
  id: number;
  title_ru: string;
  poster: string;
  image?: string;
  episodes_released?: number;
}

export interface ScheduleResponse {
  code: number;
  monday: ScheduleAnime[];
  tuesday: ScheduleAnime[];
  wednesday: ScheduleAnime[];
  thursday: ScheduleAnime[];
  friday: ScheduleAnime[];
  saturday: ScheduleAnime[];
  sunday: ScheduleAnime[];
}

export interface DiscoverItem {
  id: number;
  title: string;
  description: string;
  image: string;
  type: number;
  action: string;
}

export interface SearchFilters {
  query?: string;
  genres?: number[];
  status?: AnimeStatus;
  year?: number;
  sort?: 'popular' | 'rating' | 'newest';
}

export interface PaginatedResponse<T> {
  code: number;
  content: T[];
  total_count: number;
  total_page_count: number;
  current_page: number;
}

export function getImageUrl(posterOrImage: string | undefined): string {
  if (!posterOrImage) return 'https://placehold.co/300x450/1e293b/8b5cf6?text=No+Image';
  if (posterOrImage.startsWith('http')) return posterOrImage;
  return `https://s.anixmirai.com/posters/${posterOrImage}.jpg`;
}
