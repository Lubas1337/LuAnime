// HDRezka parser implementation
// Handles search and stream extraction

const REZKA_MIRRORS = [
  'https://hdrezka.ag',
  'https://rezka.ag',
  'https://hdrezka.me',
  'https://hdrezka.co',
];

interface SearchResult {
  url: string;
  title: string;
  year?: number;
}

interface StreamResult {
  qualities: Record<string, string>;
  translations: Array<{ id: number; title: string }>;
  defaultTranslation?: number;
}

async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 2
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...options?.headers,
        },
      });
      if (response.ok) return response;
    } catch (e) {
      if (i === retries - 1) throw e;
    }
  }
  throw new Error('All retries failed');
}

export async function searchHDRezka(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  for (const mirror of REZKA_MIRRORS) {
    try {
      const response = await fetchWithRetry(
        `${mirror}/engine/ajax/search.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `q=${encodeURIComponent(query)}`,
        }
      );

      const html = await response.text();

      // Parse search results from HTML
      const liRegex = /<li>[^]*?<a href="([^"]+)"[^>]*>[^]*?<span class="enty">([^<]+)<\/span>[^]*?<\/li>/g;
      let match;

      while ((match = liRegex.exec(html)) !== null) {
        const url = match[1];
        const fullTitle = match[2].trim();

        // Extract year from title if present (e.g., "Movie Title (2023)")
        const yearMatch = fullTitle.match(/\((\d{4})\)/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;
        const title = fullTitle.replace(/\s*\(\d{4}\)\s*/, '').trim();

        results.push({ url, title, year });
      }

      if (results.length > 0) break;
    } catch (e) {
      console.error(`Search failed on ${mirror}:`, e);
      continue;
    }
  }

  return results;
}

export async function parseMoviePage(url: string): Promise<{
  id: string;
  translations: Array<{ id: number; title: string }>;
} | null> {
  try {
    const response = await fetchWithRetry(url);
    const html = await response.text();

    // Extract movie ID
    const idMatch = html.match(/data-post_id="(\d+)"/);
    if (!idMatch) return null;
    const id = idMatch[1];

    // Extract translations
    const translations: Array<{ id: number; title: string }> = [];
    const transRegex = /<li[^>]*data-translator_id="(\d+)"[^>]*title="([^"]+)"/g;
    let match;

    while ((match = transRegex.exec(html)) !== null) {
      translations.push({
        id: parseInt(match[1], 10),
        title: match[2],
      });
    }

    // If no translations found, try alternative pattern
    if (translations.length === 0) {
      const altRegex = /<li[^>]*class="b-translator__item[^"]*"[^>]*data-translator_id="(\d+)"[^>]*>([^<]+)/g;
      while ((match = altRegex.exec(html)) !== null) {
        translations.push({
          id: parseInt(match[1], 10),
          title: match[2].trim(),
        });
      }
    }

    return { id, translations };
  } catch (e) {
    console.error('Failed to parse movie page:', e);
    return null;
  }
}

// Decode the obfuscated stream URL
function decodeStreamUrl(encoded: string): string {
  const trashList = ['@', '#', '!', '^', '$'];

  let decoded = encoded.replace('#h', '').split('//_//').join('');

  // Generate all 2-char and 3-char combinations
  const combos: string[] = [];
  for (const a of trashList) {
    for (const b of trashList) {
      combos.push(a + b);
      for (const c of trashList) {
        combos.push(a + b + c);
      }
    }
  }

  // Remove encoded trash strings
  for (const combo of combos) {
    const encodedCombo = Buffer.from(combo).toString('base64');
    decoded = decoded.split(encodedCombo).join('');
  }

  // Ensure proper padding
  while (decoded.length % 4 !== 0) {
    decoded += '=';
  }

  try {
    return Buffer.from(decoded, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

// Parse quality URLs from decoded text
function parseQualities(text: string): Record<string, string> {
  const qualities: Record<string, string> = {};

  const parts = text.split(',');
  for (const part of parts) {
    const qualityMatch = part.match(/\[(\d+p)[^\]]*\]/);
    const urlMatch = part.match(/(https?:\/\/[^\s,]+\.mp4)/);

    if (qualityMatch && urlMatch) {
      qualities[qualityMatch[1]] = urlMatch[1];
    }
  }

  return qualities;
}

export async function getMovieStream(
  pageUrl: string,
  movieId: string,
  translationId: number
): Promise<StreamResult | null> {
  try {
    // Determine the base URL from the page URL
    const urlObj = new URL(pageUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

    const response = await fetchWithRetry(
      `${baseUrl}/ajax/get_cdn_series/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: `id=${movieId}&translator_id=${translationId}&action=get_movie`,
      }
    );

    const data = await response.json();

    if (!data.url) {
      return null;
    }

    const decodedUrl = decodeStreamUrl(data.url);
    const qualities = parseQualities(decodedUrl);

    // Get translations (we need to parse the page again or pass them)
    const pageData = await parseMoviePage(pageUrl);

    return {
      qualities,
      translations: pageData?.translations || [],
      defaultTranslation: translationId,
    };
  } catch (e) {
    console.error('Failed to get movie stream:', e);
    return null;
  }
}
