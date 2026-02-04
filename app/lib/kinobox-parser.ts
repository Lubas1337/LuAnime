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

// Convert m3u8 URL to proxy URL for CORS bypass
function getProxiedUrl(url: string): string {
  // Use our proxy endpoint to bypass CORS
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

// Parse Collaps embed directly (most reliable method)
async function parseCollapsDirectly(
  kinopoiskId: number,
  season?: number,
  episode?: number
): Promise<VideoStream[]> {
  const streams: VideoStream[] = [];

  try {
    // Build URL with optional season/episode parameters
    let url = `${COLLAPS_API}${kinopoiskId}`;
    if (season && episode) {
      url += `?season=${season}&episode=${episode}`;
    }

    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://flcksbr.xyz/',
        },
      }
    );

    if (!response.ok) return streams;

    const html = await response.text();

    // Extract HLS URL from the makePlayer options (format: hls: "url")
    const hlsMatch = html.match(/hls:\s*["']([^"']+)["']/);
    if (hlsMatch) {
      const hlsUrl = cleanStreamUrl(hlsMatch[1]);

      // Try to extract translation info
      const translationMatch = html.match(/audios:\s*\[([^\]]*)\]/);
      let translation = 'Дублированный';
      if (translationMatch) {
        const nameMatch = translationMatch[1].match(/name:\s*["']([^"']+)["']/);
        if (nameMatch) translation = nameMatch[1];
      }

      streams.push({
        url: getProxiedUrl(hlsUrl),
        quality: 'auto',
        translation,
        source: 'Collaps',
      });
    }

    // Also look for direct m3u8 URLs in the page
    const m3u8Matches = html.matchAll(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/g);
    for (const match of m3u8Matches) {
      const url = cleanStreamUrl(match[0]);
      const proxiedUrl = getProxiedUrl(url);
      // Avoid duplicates
      if (!streams.some(s => s.url === proxiedUrl)) {
        streams.push({
          url: proxiedUrl,
          quality: 'auto',
          translation: 'Дублированный',
          source: 'Collaps',
        });
      }
    }
  } catch (error) {
    console.error('Failed to parse Collaps directly:', error);
  }

  return streams;
}

// Get list of available players from Kinobox
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

    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://flcksbr.xyz/',
        },
      }
    );

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

// Parse Collaps/Variyt embed to get direct stream URL
async function parseCollapsStream(iframeUrl: string): Promise<VideoStream | null> {
  try {
    const response = await fetchWithTimeout(iframeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://flcksbr.xyz/',
      },
    });

    const html = await response.text();

    // Try to extract HLS URL from makePlayer options first
    const hlsMatch = html.match(/hls:\s*["']([^"']+)["']/);
    if (hlsMatch) {
      const hlsUrl = cleanStreamUrl(hlsMatch[1]);
      return {
        url: hlsUrl.includes('.m3u8') ? getProxiedUrl(hlsUrl) : hlsUrl,
        quality: 'auto',
        translation: 'Дублированный',
        source: 'Collaps',
      };
    }

    // Fallback: Find m3u8 or mp4 URL directly in the page
    const m3u8Match = html.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/);
    const mp4Match = html.match(/https?:\/\/[^"'\s\\]+\.mp4[^"'\s\\]*/);

    const url = m3u8Match?.[0] || mp4Match?.[0];
    if (!url) return null;

    const cleanedUrl = cleanStreamUrl(url);
    return {
      url: cleanedUrl.includes('.m3u8') ? getProxiedUrl(cleanedUrl) : cleanedUrl,
      quality: 'auto',
      translation: 'Дублированный',
      source: 'Collaps',
    };
  } catch (error) {
    console.error('Failed to parse Collaps stream:', error);
    return null;
  }
}

// Parse Alloha embed to get video ID and fetch stream URL
async function parseAllohaStream(iframeUrl: string): Promise<VideoStream | null> {
  try {
    const response = await fetchWithTimeout(iframeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://flcksbr.xyz/',
      },
    });

    const html = await response.text();

    // Check for error page
    if (html.includes('Ошибка') || html.includes('контент не найден')) {
      return null;
    }

    // Try to find direct m3u8 URL first
    const m3u8Match = html.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/);
    if (m3u8Match) {
      return {
        url: getProxiedUrl(cleanStreamUrl(m3u8Match[0])),
        quality: 'auto',
        translation: 'Дублированный',
        source: 'Alloha',
      };
    }

    // Try to extract video ID from fileList and fetch stream URL
    const fileListMatch = html.match(/fileList\s*=\s*JSON\.parse\('([^']+)'\)/);
    const tokenMatch = html.match(/token:\s*['"]([^'"]+)['"]/);
    const movieIdMatch = html.match(/movie\s*=\s*\{[^}]*id:\s*['"]([^'"]+)['"]/);

    if (fileListMatch && tokenMatch && movieIdMatch) {
      try {
        const fileList = JSON.parse(fileListMatch[1].replace(/\\'/g, "'"));
        const token = tokenMatch[1];
        const movieId = movieIdMatch[1];

        // Get the active video ID
        const videoId = fileList.active?.id;
        if (videoId) {
          // Try to fetch stream from Alloha API
          const streamUrl = await fetchAllohaStreamUrl(videoId, token, movieId);
          if (streamUrl) {
            return {
              url: streamUrl.includes('.m3u8') ? getProxiedUrl(streamUrl) : streamUrl,
              quality: fileList.active?.quality || 'HD',
              translation: fileList.active?.translation || 'Дублированный',
              source: 'Alloha',
            };
          }
        }
      } catch {
        console.error('Failed to parse Alloha fileList');
      }
    }

    // Fallback: try to find stream URL in JSON data
    const jsonMatch = html.match(/"file"\s*:\s*"([^"]+\.m3u8[^"]*)"/);
    if (jsonMatch) {
      return {
        url: getProxiedUrl(cleanStreamUrl(jsonMatch[1])),
        quality: 'auto',
        translation: 'Дублированный',
        source: 'Alloha',
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to parse Alloha stream:', error);
    return null;
  }
}

// Try to fetch stream URL from Alloha API (this may not work if API is protected)
async function fetchAllohaStreamUrl(videoId: number, token: string, movieId: string): Promise<string | null> {
  try {
    // Try common Alloha API patterns
    const baseUrl = 'https://theatre.stloadi.live';

    // Attempt 1: Direct file endpoint
    const response = await fetchWithTimeout(
      `${baseUrl}/api/file/${videoId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': baseUrl,
          'X-Token': token,
        },
      },
      5000
    );

    if (response.ok) {
      const data = await response.json();
      if (data.url) return cleanStreamUrl(data.url);
      if (data.file) return cleanStreamUrl(data.file);
    }
  } catch {
    // API endpoint not found or protected
  }

  return null;
}

// Get direct video stream for a movie or series episode
export async function getMovieStream(
  kinopoiskId: number,
  season?: number,
  episode?: number
): Promise<VideoStream[]> {
  const streams: VideoStream[] = [];

  // Method 1: Try Collaps direct API first (most reliable, no ads)
  try {
    const collapsStreams = await parseCollapsDirectly(kinopoiskId, season, episode);
    if (collapsStreams.length > 0) {
      streams.push(...collapsStreams);
    }
  } catch (error) {
    console.error('Failed to get Collaps streams:', error);
  }

  // If we already have streams, return them
  if (streams.length > 0) {
    return streams;
  }

  // Method 2: Try Kinobox API for other players
  const players = await getKinoboxPlayers(kinopoiskId, season, episode);

  if (players.length === 0) {
    return streams;
  }

  // Try each player in order of preference
  for (const player of players) {
    if (!player.iframeUrl) continue;

    let stream: VideoStream | null = null;

    try {
      if (player.type === 'Collaps' || player.iframeUrl.includes('variyt') || player.iframeUrl.includes('delivembd')) {
        stream = await parseCollapsStream(player.iframeUrl);
      } else if (player.type === 'Alloha' || player.iframeUrl.includes('alloha') || player.iframeUrl.includes('stloadi')) {
        stream = await parseAllohaStream(player.iframeUrl);
      }

      if (stream) {
        // Update translation from player data if available
        const translation = player.translations?.[0];
        if (translation?.name) {
          stream.translation = translation.name;
        }
        if (translation?.quality) {
          stream.quality = translation.quality;
        }

        // Avoid duplicates
        if (!streams.some(s => s.url === stream!.url)) {
          streams.push(stream);
        }
      }
    } catch (error) {
      console.error(`Failed to parse ${player.type}:`, error);
    }
  }

  return streams;
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

// Get all available translations for a movie
export async function getAvailableTranslations(
  kinopoiskId: number,
  season?: number,
  episode?: number
): Promise<Translation[]> {
  const translations: Translation[] = [];

  // First try to get translations from Collaps API directly
  try {
    let url = `${COLLAPS_API}${kinopoiskId}`;
    if (season && episode) {
      url += `?season=${season}&episode=${episode}`;
    }

    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://flcksbr.xyz/',
      },
    });

    if (response.ok) {
      const html = await response.text();

      // Extract audios array from makePlayer config
      const audiosMatch = html.match(/audios:\s*\[([^\]]+)\]/);
      if (audiosMatch) {
        // Parse each audio object
        const audioRegex = /\{\s*name:\s*["']([^"']+)["'][^}]*id:\s*(\d+)[^}]*\}/g;
        let match;
        while ((match = audioRegex.exec(audiosMatch[1])) !== null) {
          translations.push({
            id: match[2], // Use audio ID
            name: match[1],
            quality: 'HD',
            source: 'Collaps',
          });
        }

        // Also try alternative format: {id: X, name: "Y"}
        if (translations.length === 0) {
          const altRegex = /\{\s*id:\s*(\d+)[^}]*name:\s*["']([^"']+)["'][^}]*\}/g;
          while ((match = altRegex.exec(audiosMatch[1])) !== null) {
            translations.push({
              id: match[1],
              name: match[2],
              quality: 'HD',
              source: 'Collaps',
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to get Collaps translations:', error);
  }

  // Fallback to Kinobox API
  if (translations.length === 0) {
    const players = await getKinoboxPlayers(kinopoiskId, season, episode);

    for (const player of players) {
      if (player.type === 'Collaps' && player.translations) {
        for (const t of player.translations) {
          if (t.name && t.id) {
            translations.push({
              id: String(t.id),
              name: t.name,
              quality: t.quality || 'HD',
              source: 'Collaps',
            });
          }
        }
      }
    }
  }

  // Remove duplicates by name
  const seen = new Set<string>();
  return translations.filter(t => {
    if (seen.has(t.name)) return false;
    seen.add(t.name);
    return true;
  });
}

// Parse a specific translation by audio ID using Collaps API
export async function parseTranslationStream(
  audioId: string,
  kinopoiskId?: number,
  season?: number,
  episode?: number
): Promise<VideoStream | null> {
  console.log('Parsing translation stream for audio:', audioId, 'kp:', kinopoiskId);

  // If audioId looks like a URL (legacy), try to parse it directly
  if (audioId.startsWith('http')) {
    return parseTranslationUrl(audioId);
  }

  // Use Collaps API with audio parameter
  if (!kinopoiskId) {
    console.error('kinopoiskId required for audio-based translation');
    return null;
  }

  try {
    let url = `${COLLAPS_API}${kinopoiskId}?audio=${audioId}`;
    if (season && episode) {
      url += `&season=${season}&episode=${episode}`;
    }

    console.log('Fetching Collaps with audio:', url);

    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://flcksbr.xyz/',
      },
    });

    if (!response.ok) {
      console.error('Collaps fetch failed:', response.status);
      return null;
    }

    const html = await response.text();

    // Extract HLS URL
    const hlsMatch = html.match(/hls:\s*["']([^"']+)["']/);
    if (hlsMatch) {
      const hlsUrl = cleanStreamUrl(hlsMatch[1]);

      // Try to get translation name from audios
      let translation = 'Дублированный';
      const audiosMatch = html.match(/audios:\s*\[([^\]]*)\]/);
      if (audiosMatch) {
        // Find the audio with matching ID to get its name
        const audioRegex = new RegExp(`\\{[^}]*id:\\s*${audioId}[^}]*name:\\s*["']([^"']+)["'][^}]*\\}`);
        const nameMatch = audiosMatch[1].match(audioRegex);
        if (nameMatch) {
          translation = nameMatch[1];
        } else {
          // Try alternative order
          const altRegex = new RegExp(`\\{[^}]*name:\\s*["']([^"']+)["'][^}]*id:\\s*${audioId}[^}]*\\}`);
          const altMatch = audiosMatch[1].match(altRegex);
          if (altMatch) translation = altMatch[1];
        }
      }

      console.log('Found HLS stream for translation:', translation);
      return {
        url: getProxiedUrl(hlsUrl),
        quality: 'auto',
        translation,
        source: 'Collaps',
      };
    }

    // Fallback to direct m3u8 search
    const m3u8Match = html.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/);
    if (m3u8Match) {
      console.log('Found m3u8 URL via fallback');
      return {
        url: getProxiedUrl(cleanStreamUrl(m3u8Match[0])),
        quality: 'auto',
        translation: 'Дублированный',
        source: 'Collaps',
      };
    }

    console.error('No HLS stream found');
    return null;
  } catch (error) {
    console.error('Failed to parse translation stream:', error);
    return null;
  }
}

// Legacy: Parse translation from iframe URL directly
async function parseTranslationUrl(translationUrl: string): Promise<VideoStream | null> {
  try {
    const response = await fetchWithTimeout(translationUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://flcksbr.xyz/',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    const hlsMatch = html.match(/hls:\s*["']([^"']+)["']/);
    if (hlsMatch) {
      return {
        url: getProxiedUrl(cleanStreamUrl(hlsMatch[1])),
        quality: 'auto',
        translation: 'Дублированный',
        source: 'Collaps',
      };
    }

    const m3u8Match = html.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/);
    if (m3u8Match) {
      return {
        url: getProxiedUrl(cleanStreamUrl(m3u8Match[0])),
        quality: 'auto',
        translation: 'Дублированный',
        source: 'Collaps',
      };
    }

    return null;
  } catch {
    return null;
  }
}
