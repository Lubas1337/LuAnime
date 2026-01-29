import type { VideoSource } from '@/types/anime';

interface KodikVideoResult {
  quality: string;
  url: string;
  type: string;
}

interface KodikParseResponse {
  links?: KodikVideoResult[];
  error?: string;
}

/**
 * Parses a Kodik embed URL to extract direct video URLs.
 * Calls the server-side API route which handles the actual parsing
 * (to avoid CORS issues from the browser).
 */
export async function parseKodikUrl(
  embedUrl: string
): Promise<VideoSource[]> {
  try {
    const response = await fetch('/api/kodik/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: embedUrl }),
    });

    if (!response.ok) {
      return [];
    }

    const data: KodikParseResponse = await response.json();

    if (!data.links || data.links.length === 0) {
      return [];
    }

    return data.links.map((link) => ({
      url: link.url,
      quality: link.quality,
    }));
  } catch {
    return [];
  }
}
