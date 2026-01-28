import { apiClient } from './client';
import type {
  Anime,
  ScheduleAnime,
  ScheduleResponse,
  DiscoverItem,
  PaginatedResponse,
  Translation,
  Episode,
} from '@/types/anime';

interface AnimeResponse {
  code: number;
  release: Anime;
}

interface TranslationsResponse {
  code: number;
  types: Translation[];
}

interface EpisodesResponse {
  code: number;
  episodes: Episode[];
}

interface DiscoverResponse {
  code: number;
  content: DiscoverItem[];
}

export async function getAnimeById(id: number): Promise<Anime> {
  const response = await apiClient.get<AnimeResponse>(`/release/${id}`);
  return response.release;
}

export async function getRandomAnime(): Promise<Anime> {
  const response = await apiClient.get<AnimeResponse>('/release/random');
  return response.release;
}

export async function getSchedule(): Promise<ScheduleAnime[][]> {
  const response = await apiClient.get<ScheduleResponse>('/schedule');

  return [
    response.monday || [],
    response.tuesday || [],
    response.wednesday || [],
    response.thursday || [],
    response.friday || [],
    response.saturday || [],
    response.sunday || [],
  ];
}

export async function getDiscoverItems(): Promise<DiscoverItem[]> {
  const response = await apiClient.post<DiscoverResponse>('/discover/interesting', { page: 0 });
  return response.content || [];
}

export async function getAnimeByIds(ids: number[]): Promise<Anime[]> {
  const results = await Promise.all(
    ids.slice(0, 10).map(async (id) => {
      try {
        return await getAnimeById(id);
      } catch {
        return null;
      }
    })
  );
  return results.filter((a): a is Anime => a !== null);
}

// Types (voiceovers) response: /episode/{releaseId}
interface VoiceoversResponse {
  code: number;
  types: Array<{
    id: number;
    name: string;
    icon?: string;
    episodes_count: number;
    is_sub: boolean;
  }>;
}

// Sources (players) response: /episode/{releaseId}/{typeId}
interface SourcesResponse {
  code: number;
  sources: Array<{
    id: number;
    name: string;
    type: {
      id: number;
      name: string;
      icon?: string;
    };
    episodes_count: number;
  }>;
}

// Episodes response: /episode/{releaseId}/{typeId}/{sourceId}
interface EpisodesResponse {
  code: number;
  episodes: Array<{
    position: number;
    name: string;
    url: string;
    iframe: boolean;
  }>;
}

// Store selected source for each voiceover
let cachedSources: Map<string, { sourceId: number; episodesCount: number }> = new Map();

export async function getVoiceovers(animeId: number): Promise<Translation[]> {
  try {
    const response = await apiClient.get<VoiceoversResponse>(
      `/episode/${animeId}`
    );

    if (!response.types || response.types.length === 0) {
      return [];
    }

    return response.types.map((type) => ({
      id: type.id,
      title: type.name,
      type_name: type.is_sub ? 'Субтитры' : 'Озвучка',
      episodes_count: type.episodes_count,
    }));
  } catch {
    return [];
  }
}

export async function getSources(animeId: number, typeId: number): Promise<{ id: number; name: string; episodesCount: number }[]> {
  try {
    const response = await apiClient.get<SourcesResponse>(
      `/episode/${animeId}/${typeId}`
    );

    if (!response.sources || response.sources.length === 0) {
      return [];
    }

    return response.sources.map((source) => ({
      id: source.id,
      name: source.name,
      episodesCount: source.episodes_count,
    }));
  } catch {
    return [];
  }
}

export async function getTranslations(animeId: number): Promise<Translation[]> {
  // This now returns voiceovers
  return getVoiceovers(animeId);
}

export async function getEpisodes(
  animeId: number,
  typeId: number,
  episodesCount?: number
): Promise<Episode[]> {
  try {
    // First get sources for this voiceover type
    const sources = await getSources(animeId, typeId);

    if (sources.length === 0) {
      return [];
    }

    // Use first available source (usually Kodik)
    const source = sources[0];
    const cacheKey = `${animeId}-${typeId}`;
    cachedSources.set(cacheKey, { sourceId: source.id, episodesCount: source.episodesCount });

    // Get actual episodes
    const response = await apiClient.get<EpisodesResponse>(
      `/episode/${animeId}/${typeId}/${source.id}`
    );

    if (!response.episodes || response.episodes.length === 0) {
      return [];
    }

    return response.episodes.map((ep) => ({
      id: ep.position,
      number: ep.position,
      name: ep.name,
      embed_url: ep.iframe ? ep.url : undefined,
      sources: ep.iframe ? undefined : [{ url: ep.url, quality: 'auto' }],
    }));
  } catch {
    return [];
  }
}

export async function getEpisodeUrl(
  animeId: number,
  episodeNumber: number,
  typeId: number
): Promise<{ url: string; iframe: boolean } | null> {
  try {
    const cacheKey = `${animeId}-${typeId}`;
    const cached = cachedSources.get(cacheKey);

    if (!cached) {
      // Need to get source first
      const sources = await getSources(animeId, typeId);
      if (sources.length === 0) return null;
      cachedSources.set(cacheKey, { sourceId: sources[0].id, episodesCount: sources[0].episodesCount });
    }

    const sourceId = cachedSources.get(cacheKey)!.sourceId;

    const response = await apiClient.get<EpisodesResponse>(
      `/episode/${animeId}/${typeId}/${sourceId}`
    );

    if (response.episodes && response.episodes.length > 0) {
      const ep = response.episodes.find(e => e.position === episodeNumber);
      if (ep) {
        return { url: ep.url, iframe: ep.iframe };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function addToFavorites(
  animeId: number,
  token: string
): Promise<void> {
  await apiClient.get(`/favorite/add/${animeId}`, { token });
}

export async function removeFromFavorites(
  animeId: number,
  token: string
): Promise<void> {
  await apiClient.get(`/favorite/delete/${animeId}`, { token });
}

export async function getFavorites(
  token: string,
  page: number = 0
): Promise<Anime[]> {
  const response = await apiClient.get<PaginatedResponse<Anime>>(
    `/favorite/${page}`,
    { token }
  );
  return response.content || [];
}

export async function searchAnime(
  query: string,
  page: number = 0
): Promise<Anime[]> {
  const response = await apiClient.post<{ content: Anime[] }>(
    `/search/releases/${page}`,
    { query }
  );
  return response.content || [];
}
