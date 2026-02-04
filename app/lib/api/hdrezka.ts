import type { HDRezkaSearchResult, HDRezkaStream } from '@/types/movie';

const API_BASE = '/api/hdrezka';
const TIMEOUT_MS = 10000; // 10 second timeout

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

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

export async function searchHDRezka(title: string, year?: number): Promise<HDRezkaSearchResult[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, year }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch {
    return [];
  }
}

export async function getMovieStream(
  url: string,
  translationId?: number
): Promise<HDRezkaStream | null> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, translationId }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.error) {
      return null;
    }

    return data.streams || null;
  } catch {
    return null;
  }
}

export async function findMovieOnHDRezka(
  nameRu: string,
  nameOriginal?: string,
  year?: number
): Promise<{ url: string; stream: HDRezkaStream } | null> {
  try {
    // Try searching by Russian name first
    let results = await searchHDRezka(nameRu, year);

    // If no results, try original name
    if (results.length === 0 && nameOriginal) {
      results = await searchHDRezka(nameOriginal, year);
    }

    if (results.length === 0) {
      return null;
    }

    // Find best match by year if available
    let bestMatch = results[0];
    if (year) {
      const yearMatch = results.find((r) => r.year === year);
      if (yearMatch) {
        bestMatch = yearMatch;
      }
    }

    // Get stream for the best match
    const stream = await getMovieStream(bestMatch.url);
    if (!stream) {
      return null;
    }

    return { url: bestMatch.url, stream };
  } catch {
    return null;
  }
}
