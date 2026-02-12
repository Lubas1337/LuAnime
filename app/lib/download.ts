const CONCURRENCY = 10;
const MAX_RETRIES = 3;

function buildFilename(title: string, season?: number, episode?: number, ext = 'ts'): string {
  const clean = title.replace(/[^\w\sа-яА-ЯёЁ-]/g, '').trim().replace(/\s+/g, '_');
  if (season !== undefined && episode !== undefined) {
    const s = String(season).padStart(2, '0');
    const e = String(episode).padStart(2, '0');
    return `${clean}_S${s}E${e}.${ext}`;
  }
  return `${clean}.${ext}`;
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch {
      // retry
    }
    if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
  }
  throw new Error(`Failed after ${retries} retries: ${url}`);
}

async function downloadHLS(
  baseParams: string,
  filename: string,
  onProgress?: (pct: number) => void,
) {
  // 1. Resolve segment count
  const resolveRes = await fetchWithRetry(`/api/download?${baseParams}&resolve=1`);
  const { total } = await resolveRes.json();

  // 2. Download segments in parallel with concurrency limit
  const segments: ArrayBuffer[] = new Array(total);
  let completed = 0;
  let nextIdx = 0;

  async function worker() {
    while (true) {
      const idx = nextIdx++;
      if (idx >= total) break;
      const res = await fetchWithRetry(`/api/download?${baseParams}&seg=${idx}`);
      segments[idx] = await res.arrayBuffer();
      completed++;
      onProgress?.(Math.round((completed / total) * 100));
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker());
  await Promise.all(workers);

  // 3. Concatenate and download
  const blob = new Blob(segments, { type: 'video/mp2t' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function downloadEpisode(params: {
  kinopoiskId?: number;
  season?: number;
  episode?: number;
  audio?: number;
  title: string;
  directUrl?: string;
  onProgress?: (pct: number) => void;
}) {
  const { kinopoiskId, season, episode, audio, title, directUrl, onProgress } = params;

  // Anime: direct URL — just open in new tab (fast, single file)
  if (directUrl) {
    const filename = buildFilename(title, undefined, episode, 'mp4');
    const url = `/api/download?url=${encodeURIComponent(directUrl)}&filename=${encodeURIComponent(filename)}`;
    window.open(url, '_blank');
    return;
  }

  // Movies/series: parallel HLS download
  const filename = buildFilename(title, season, episode);
  const searchParams = new URLSearchParams();
  searchParams.set('kp', String(kinopoiskId));
  if (season !== undefined) searchParams.set('season', String(season));
  if (episode !== undefined) searchParams.set('episode', String(episode));
  if (audio !== undefined) searchParams.set('audio', String(audio));

  downloadHLS(searchParams.toString(), filename, onProgress).catch(err => {
    console.error('Download failed:', err);
  });
}

export async function downloadSeason(
  episodes: Array<{ episodeNumber: number }>,
  params: {
    kinopoiskId: number;
    season: number;
    audio?: number;
    title: string;
  },
  onProgress?: (current: number, total: number) => void,
) {
  const sorted = [...episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);

  for (let i = 0; i < sorted.length; i++) {
    onProgress?.(i + 1, sorted.length);

    downloadEpisode({
      kinopoiskId: params.kinopoiskId,
      season: params.season,
      episode: sorted[i].episodeNumber,
      audio: params.audio,
      title: params.title,
    });

    if (i < sorted.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
