function buildFilename(title: string, season?: number, episode?: number, ext = 'mp4'): string {
  const clean = title.replace(/[^\w\sа-яА-ЯёЁ-]/g, '').trim().replace(/\s+/g, '_');
  if (season !== undefined && episode !== undefined) {
    const s = String(season).padStart(2, '0');
    const e = String(episode).padStart(2, '0');
    return `${clean}_S${s}E${e}.${ext}`;
  }
  return `${clean}.${ext}`;
}

export function downloadEpisode(params: {
  kinopoiskId?: number;
  season?: number;
  episode?: number;
  audio?: number;
  title: string;
  // For anime direct URL download
  directUrl?: string;
}) {
  const { kinopoiskId, season, episode, audio, title, directUrl } = params;

  const filename = directUrl
    ? buildFilename(title, undefined, episode, 'mp4')
    : buildFilename(title, season, episode);

  let url: string;
  if (directUrl) {
    url = `/api/download?url=${encodeURIComponent(directUrl)}&filename=${encodeURIComponent(filename)}`;
  } else {
    const searchParams = new URLSearchParams();
    searchParams.set('kp', String(kinopoiskId));
    if (season !== undefined) searchParams.set('season', String(season));
    if (episode !== undefined) searchParams.set('episode', String(episode));
    if (audio !== undefined) searchParams.set('audio', String(audio));
    searchParams.set('filename', filename);
    url = `/api/download?${searchParams.toString()}`;
  }

  // Open in new tab to trigger download
  window.open(url, '_blank');
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

    // Delay between downloads to avoid overwhelming the server
    if (i < sorted.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
