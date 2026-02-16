import type {
  StremioManifest,
  StremioStream,
  StreamSource,
  TMDBSearchResult,
  StremioContentType,
  StremioAddon,
} from '@/types/stremio';

export async function fetchManifest(url: string): Promise<StremioManifest> {
  const res = await fetch(`/api/stremio/manifest?url=${encodeURIComponent(url)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch manifest');
  }
  return res.json();
}

export async function fetchStreams(
  addonUrl: string,
  type: StremioContentType,
  id: string
): Promise<StremioStream[]> {
  const res = await fetch(
    `/api/stremio/stream?addon=${encodeURIComponent(addonUrl)}&type=${type}&id=${encodeURIComponent(id)}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.streams || [];
}

export async function searchContent(
  query: string,
  type?: string
): Promise<TMDBSearchResult[]> {
  const params = new URLSearchParams({ query });
  if (type) params.set('type', type);
  const res = await fetch(`/api/stremio/search?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

export async function getExternalIds(
  tmdbId: number,
  mediaType: string
): Promise<{ imdbId: string | null; tvdbId: number | null }> {
  const res = await fetch('/api/stremio/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tmdbId, mediaType }),
  });
  if (!res.ok) return { imdbId: null, tvdbId: null };
  return res.json();
}

// Parse quality from stream name/title
function parseQuality(stream: StremioStream): string {
  const text = `${stream.name || ''} ${stream.title || ''}`;
  if (/2160p|4k|uhd/i.test(text)) return '4K';
  if (/1080p|full\s*hd/i.test(text)) return '1080p';
  if (/720p|hd/i.test(text)) return '720p';
  if (/480p/i.test(text)) return '480p';
  if (/360p/i.test(text)) return '360p';
  return 'Unknown';
}

// Parse file size from stream title or behaviorHints
function parseSize(stream: StremioStream): { display: string; bytes: number } {
  if (stream.behaviorHints?.videoSize) {
    const bytes = stream.behaviorHints.videoSize;
    return { display: formatBytes(bytes), bytes };
  }

  const text = stream.title || '';
  const match = text.match(/([\d.]+)\s*(GB|MB|TB)/i);
  if (match) {
    const num = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const multiplier = unit === 'TB' ? 1e12 : unit === 'GB' ? 1e9 : 1e6;
    const bytes = num * multiplier;
    return { display: `${num} ${unit}`, bytes };
  }

  return { display: '', bytes: 0 };
}

function formatBytes(bytes: number): string {
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(1)} TB`;
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${bytes} B`;
}

// Parse stream name (addon name is usually the first line)
function parseStreamAddonName(stream: StremioStream): string {
  const name = stream.name || '';
  const firstLine = name.split('\n')[0];
  return firstLine || 'Unknown';
}

export function parseStreamsToSources(
  streams: StremioStream[],
  addon: StremioAddon
): StreamSource[] {
  return streams
    .filter((s) => s.url)
    .map((s) => {
      const size = parseSize(s);
      return {
        addonId: addon.id,
        addonName: addon.name,
        name: parseStreamAddonName(s),
        title: s.title,
        quality: parseQuality(s),
        size: size.display,
        sizeBytes: size.bytes,
        url: s.url!,
        filename: s.behaviorHints?.filename,
        subtitles: s.subtitles,
      };
    });
}

// Quality sort order (higher = better)
const qualityOrder: Record<string, number> = {
  '4K': 5,
  '1080p': 4,
  '720p': 3,
  '480p': 2,
  '360p': 1,
  'Unknown': 0,
};

export function sortSources(
  sources: StreamSource[],
  sortBy: 'quality' | 'size' = 'quality'
): StreamSource[] {
  return [...sources].sort((a, b) => {
    if (sortBy === 'quality') {
      const qa = qualityOrder[a.quality] || 0;
      const qb = qualityOrder[b.quality] || 0;
      if (qb !== qa) return qb - qa;
      return b.sizeBytes - a.sizeBytes;
    }
    return b.sizeBytes - a.sizeBytes;
  });
}

// Resolve streams from all enabled addons in parallel
export async function resolveAllStreams(
  addons: StremioAddon[],
  type: StremioContentType,
  id: string,
  onAddonStreams?: (addonId: string, sources: StreamSource[]) => void
): Promise<StreamSource[]> {
  const allSources: StreamSource[] = [];

  const promises = addons.map(async (addon) => {
    try {
      const streams = await fetchStreams(addon.transportUrl, type, id);
      const sources = parseStreamsToSources(streams, addon);
      allSources.push(...sources);
      onAddonStreams?.(addon.id, sources);
    } catch {
      // Silently skip failed addons
    }
  });

  await Promise.allSettled(promises);
  return sortSources(allSources);
}

// Build Stremio stream ID for series
export function buildSeriesId(
  imdbId: string,
  season: number,
  episode: number
): string {
  return `${imdbId}:${season}:${episode}`;
}
