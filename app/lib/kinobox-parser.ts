// Kinobox parser - gets direct video URLs from various balancers

const KINOBOX_API = 'https://fbphdplay.top/api/players';
const COLLAPS_API = 'https://api.delivembd.ws/embed/kp/';

interface KinoboxPlayer {
  type: string;
  iframeUrl: string | null;
  translations: Array<{
    id: number | null;
    name: string | null;
    quality: string | null;
    iframeUrl: string | null;
  }>;
}

interface KinoboxResponse {
  data: KinoboxPlayer[];
}

interface VideoStream {
  url: string;
  quality: string;
  translation: string;
  source: string;
}

interface Translation {
  id: number | string | null;
  name: string;
  quality: string;
  source: string;
}

interface CollapsEpisode {
  episode: string;
  hls: string;
  dash?: string;
  title?: string;
  audio?: {
    names: string[];
    order: number[];
  };
}

interface CollapsSeason {
  season: number;
  episodes: CollapsEpisode[];
}

interface CollapsData {
  source?: {
    hls: string;
    audio?: {
      names: string[];
      order: number[];
    };
  };
  playlist?: {
    seasons: CollapsSeason[];
  };
  title?: string;
}

// Convert m3u8 URL to proxy URL for CORS bypass
function getProxiedUrl(url: string): string {
  return `/api/proxy/m3u8?url=${encodeURIComponent(url)}`;
}

async function fetchWithTimeout(url: string, options?: RequestInit, timeout = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Clean and decode HLS URL from escaped characters
function cleanStreamUrl(url: string): string {
  return url
    .replace(/\\u0026/g, '&')
    .replace(/\\u003d/g, '=')
    .replace(/\\\//g, '/')
    .replace(/\\"/g, '"')
    .replace(/\\/g, '');
}

// Parse makePlayer({...}) from Collaps HTML response
function parseCollapsData(html: string): CollapsData | null {
  try {
    // Remove newlines for easier matching
    const cleanHtml = html.replace(/\n/g, '');

    // Find makePlayer({...});
    const match = cleanHtml.match(/makePlayer\(\{([\s\S]*?)\}\);/);
    if (!match) return null;

    // Use Function constructor to safely evaluate the object
    // eslint-disable-next-line no-new-func
    const data = new Function('return ({' + match[1] + '})')();
    return data as CollapsData;
  } catch (error) {
    console.error('Failed to parse Collaps data:', error);
    return null;
  }
}

// Fetch Collaps page and parse data
async function fetchCollapsData(
  kinopoiskId: number,
  audioIndex?: number,
  season?: number,
  episode?: number
): Promise<{ data: CollapsData | null; html: string }> {
  try {
    let url = `${COLLAPS_API}${kinopoiskId}`;
    const params: string[] = [];

    if (audioIndex !== undefined) params.push(`audio=${audioIndex}`);
    if (season !== undefined) params.push(`season=${season}`);
    if (episode !== undefined) params.push(`episode=${episode}`);

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://flcksbr.xyz/',
      },
    });

    if (!response.ok) {
      return { data: null, html: '' };
    }

    const html = await response.text();
    const data = parseCollapsData(html);

    return { data, html };
  } catch (error) {
    console.error('Failed to fetch Collaps data:', error);
    return { data: null, html: '' };
  }
}

// Get direct video stream for a movie or series episode
export async function getMovieStream(
  kinopoiskId: number,
  season?: number,
  episode?: number,
  audio?: number
): Promise<VideoStream[]> {
  const streams: VideoStream[] = [];

  try {
    const { data } = await fetchCollapsData(kinopoiskId, audio, season, episode);

    if (!data) {
      return streams;
    }

    // For movies - use source.hls
    if (data.source?.hls) {
      const audioNames = data.source.audio?.names || [];
      const firstAudio = audioNames[0] || 'Дублированный';

      streams.push({
        url: getProxiedUrl(cleanStreamUrl(data.source.hls)),
        quality: 'auto',
        translation: firstAudio,
        source: 'Collaps',
      });
    }

    // For series - use playlist.seasons[].episodes[]
    if (data.playlist?.seasons && season !== undefined && episode !== undefined) {
      const seasonData = data.playlist.seasons.find(s => s.season === season);
      if (seasonData) {
        const episodeData = seasonData.episodes.find(e => parseInt(e.episode) === episode);
        if (episodeData?.hls) {
          const audioNames = episodeData.audio?.names || [];
          const firstAudio = audioNames[0] || 'Дублированный';

          streams.push({
            url: getProxiedUrl(cleanStreamUrl(episodeData.hls)),
            quality: 'auto',
            translation: firstAudio,
            source: 'Collaps',
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to get Collaps streams:', error);
  }

  return streams;
}

// Get list of available players from Kinobox (fallback)
export async function getKinoboxPlayers(
  kinopoiskId: number,
  season?: number,
  episode?: number
): Promise<KinoboxPlayer[]> {
  try {
    let url = `${KINOBOX_API}?kinopoisk=${kinopoiskId}`;
    if (season !== undefined && episode !== undefined) {
      url += `&season=${season}&episode=${episode}`;
    }

    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://flcksbr.xyz/',
      },
    });

    if (!response.ok) {
      return [];
    }

    const data: KinoboxResponse = await response.json();
    return data.data?.filter(p => p.iframeUrl) || [];
  } catch (error) {
    console.error('Failed to get Kinobox players:', error);
    return [];
  }
}

// Get all available players with their iframe URLs (for fallback)
export async function getMoviePlayers(
  kinopoiskId: number,
  season?: number,
  episode?: number
): Promise<Array<{
  type: string;
  iframeUrl: string;
  translation: string;
  quality: string;
}>> {
  const players = await getKinoboxPlayers(kinopoiskId, season, episode);

  return players
    .filter(p => p.iframeUrl)
    .map(p => ({
      type: p.type,
      iframeUrl: p.iframeUrl!,
      translation: p.translations?.[0]?.name || 'Неизвестно',
      quality: p.translations?.[0]?.quality || 'HD',
    }));
}

// Get all available translations for a movie or episode
export async function getAvailableTranslations(
  kinopoiskId: number,
  season?: number,
  episode?: number
): Promise<Translation[]> {
  const translations: Translation[] = [];

  try {
    const { data } = await fetchCollapsData(kinopoiskId, undefined, season, episode);

    if (!data) {
      return translations;
    }

    let audioData: { names: string[]; order: number[] } | undefined;

    // For movies - get audio from source
    if (data.source?.audio) {
      audioData = data.source.audio;
    }

    // For series - get audio from first episode or specified episode
    if (data.playlist?.seasons) {
      if (season !== undefined && episode !== undefined) {
        const seasonData = data.playlist.seasons.find(s => s.season === season);
        const episodeData = seasonData?.episodes.find(e => parseInt(e.episode) === episode);
        if (episodeData?.audio) {
          audioData = episodeData.audio;
        }
      } else if (data.playlist.seasons[0]?.episodes[0]?.audio) {
        // Use first episode's audio as reference
        audioData = data.playlist.seasons[0].episodes[0].audio;
      }
    }

    if (audioData?.names) {
      const order = audioData.order || audioData.names.map((_, i) => i);

      for (const idx of order) {
        const name = audioData.names[idx];
        if (name && !name.toLowerCase().includes('delete')) {
          translations.push({
            id: String(idx),
            name: name,
            quality: 'HD',
            source: 'Collaps',
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to get Collaps translations:', error);
  }

  // Remove duplicates by name
  const seen = new Set<string>();
  return translations.filter(t => {
    if (seen.has(t.name)) return false;
    seen.add(t.name);
    return true;
  });
}

// Get stream for specific translation (audio track)
export async function parseTranslationStream(
  audioId: string,
  kinopoiskId?: number,
  season?: number,
  episode?: number
): Promise<VideoStream | null> {
  if (!kinopoiskId) {
    console.error('kinopoiskId required for translation stream');
    return null;
  }

  try {
    const audioIndex = parseInt(audioId, 10);
    const { data } = await fetchCollapsData(kinopoiskId, audioIndex, season, episode);

    if (!data) {
      console.error('No data from Collaps for translation');
      return null;
    }

    let hlsUrl: string | undefined;
    let audioNames: string[] = [];

    // For movies
    if (data.source?.hls) {
      hlsUrl = data.source.hls;
      audioNames = data.source.audio?.names || [];
    }

    // For series
    if (data.playlist?.seasons && season !== undefined && episode !== undefined) {
      const seasonData = data.playlist.seasons.find(s => s.season === season);
      const episodeData = seasonData?.episodes.find(e => parseInt(e.episode) === episode);
      if (episodeData?.hls) {
        hlsUrl = episodeData.hls;
        audioNames = episodeData.audio?.names || [];
      }
    }

    if (hlsUrl) {
      const translationName = audioNames[audioIndex] || 'Дублированный';

      return {
        url: getProxiedUrl(cleanStreamUrl(hlsUrl)),
        quality: 'auto',
        translation: translationName,
        source: 'Collaps',
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to parse translation stream:', error);
    return null;
  }
}
