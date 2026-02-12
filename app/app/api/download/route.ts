import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COLLAPS_API = 'https://api.delivembd.ws/embed/kp/';

function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, '_');
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

const CDN_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://api.delivembd.ws/',
  'Origin': 'https://api.delivembd.ws',
};

function cleanStreamUrl(url: string): string {
  return url
    .replace(/\\u0026/g, '&')
    .replace(/\\u003d/g, '=')
    .replace(/\\\//g, '/')
    .replace(/\\"/g, '"')
    .replace(/\\/g, '');
}

interface CollapsData {
  source?: {
    hls: string;
    audio?: { names: string[]; order: number[] };
  };
  playlist?: {
    seasons: Array<{
      season: number;
      episodes: Array<{
        episode: string;
        hls: string;
        audio?: { names: string[]; order: number[] };
      }>;
    }>;
  };
}

function parseCollapsData(html: string): CollapsData | null {
  try {
    const cleanHtml = html.replace(/\n/g, '');
    const startMarker = 'makePlayer({';
    const startIdx = cleanHtml.indexOf(startMarker);
    if (startIdx === -1) return null;

    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    let endIdx = -1;

    for (let i = startIdx + startMarker.length - 1; i < cleanHtml.length; i++) {
      const char = cleanHtml[i];
      const prevChar = i > 0 ? cleanHtml[i - 1] : '';

      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (!inString) {
        if (char === '{') braceCount++;
        else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIdx = i;
            break;
          }
        }
      }
    }

    if (endIdx === -1) return null;

    const objectStr = cleanHtml.substring(startIdx + 'makePlayer('.length, endIdx + 1);
    // eslint-disable-next-line no-new-func
    const data = new Function('return (' + objectStr + ')')();
    return data as CollapsData;
  } catch {
    return null;
  }
}

async function fetchCollapsHlsUrl(
  kinopoiskId: number,
  audioIndex?: number,
  season?: number,
  episode?: number
): Promise<string | null> {
  const params: string[] = [];
  if (audioIndex !== undefined) params.push(`audio=${audioIndex}`);
  if (season !== undefined) params.push(`season=${season}`);
  if (episode !== undefined) params.push(`episode=${episode}`);

  let url = `${COLLAPS_API}${kinopoiskId}`;
  if (params.length > 0) url += '?' + params.join('&');

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://flcksbr.xyz/',
    },
  });

  if (!response.ok) return null;

  const html = await response.text();
  const data = parseCollapsData(html);
  if (!data) return null;

  // Movie
  if (data.source?.hls) {
    return cleanStreamUrl(data.source.hls);
  }

  // Series episode
  if (data.playlist?.seasons && season !== undefined && episode !== undefined) {
    const seasonData = data.playlist.seasons.find(s => s.season === season);
    const episodeData = seasonData?.episodes.find(e => parseInt(e.episode) === episode);
    if (episodeData?.hls) {
      return cleanStreamUrl(episodeData.hls);
    }
  }

  return null;
}

async function getBestVariantUrl(masterUrl: string): Promise<string> {
  const res = await fetch(masterUrl, { headers: CDN_HEADERS });
  if (!res.ok) throw new Error(`Failed to fetch master M3U8: ${res.status}`);

  const content = await res.text();
  const baseUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1);

  let bestBandwidth = 0;
  let bestUrl = '';

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXT-X-STREAM-INF:')) {
      const bwMatch = line.match(/BANDWIDTH=(\d+)/);
      const bandwidth = bwMatch ? parseInt(bwMatch[1]) : 0;

      // Next non-empty, non-comment line is the URL
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (next && !next.startsWith('#')) {
          if (bandwidth > bestBandwidth) {
            bestBandwidth = bandwidth;
            bestUrl = next.startsWith('http') ? next : baseUrl + next;
          }
          break;
        }
      }
    }
  }

  // If no variant found, it might be a direct playlist
  if (!bestUrl) return masterUrl;
  return bestUrl;
}

async function getSegmentUrls(playlistUrl: string): Promise<string[]> {
  const res = await fetch(playlistUrl, { headers: CDN_HEADERS });
  if (!res.ok) throw new Error(`Failed to fetch playlist: ${res.status}`);

  const content = await res.text();
  const baseUrl = playlistUrl.substring(0, playlistUrl.lastIndexOf('/') + 1);
  const segments: string[] = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    segments.push(trimmed.startsWith('http') ? trimmed : baseUrl + trimmed);
  }

  return segments;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Mode 1: Direct URL download (anime)
  const directUrl = searchParams.get('url');
  if (directUrl) {
    const filename = searchParams.get('filename') || 'video.mp4';
    try {
      const response = await fetch(directUrl, { headers: CDN_HEADERS });
      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch video' }, { status: response.status });
      }

      const headers: Record<string, string> = {
        'Content-Disposition': contentDisposition(filename),
        'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
      };

      const contentLength = response.headers.get('Content-Length');
      if (contentLength) headers['Content-Length'] = contentLength;

      return new NextResponse(response.body, { headers });
    } catch (error) {
      console.error('Direct download error:', error);
      return NextResponse.json({ error: 'Download failed' }, { status: 500 });
    }
  }

  // Mode 2: HLS download (movies/series)
  const kp = searchParams.get('kp');
  if (!kp) {
    return NextResponse.json({ error: 'Missing kp or url parameter' }, { status: 400 });
  }

  const season = searchParams.get('season');
  const episode = searchParams.get('episode');
  const audio = searchParams.get('audio');
  const filename = searchParams.get('filename') || 'video.mp4';

  try {

    const hlsUrl = await fetchCollapsHlsUrl(
      parseInt(kp),
      audio ? parseInt(audio) : undefined,
      season ? parseInt(season) : undefined,
      episode ? parseInt(episode) : undefined,
    );

    if (!hlsUrl) {
      return NextResponse.json({ error: 'Could not resolve HLS URL' }, { status: 404 });
    }

    const variantUrl = await getBestVariantUrl(hlsUrl);

    const segmentUrls = await getSegmentUrls(variantUrl);

    if (segmentUrls.length === 0) {
      return NextResponse.json({ error: 'No segments found' }, { status: 404 });
    }

    // Remux TS segments to MP4 via ffmpeg
    const mp4Filename = filename.replace(/\.ts$/, '.mp4');
    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0',
      '-c', 'copy',
      '-f', 'mp4',
      '-movflags', 'frag_keyframe+empty_moov',
      'pipe:1',
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    // Feed segments with sliding window of concurrent fetches
    const PREFETCH = 8;
    (async () => {
      try {
        async function fetchBuf(url: string): Promise<ArrayBuffer | null> {
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              if (attempt > 0) await new Promise(r => setTimeout(r, 500 * attempt));
              const res = await fetch(url, { headers: CDN_HEADERS });
              if (res.ok) return res.arrayBuffer();
            } catch { /* retry */ }
          }
          return null;
        }

        // Pre-start fetches for first batch
        const pending: Array<Promise<ArrayBuffer | null>> = [];
        let nextIdx = 0;
        while (nextIdx < segmentUrls.length && pending.length < PREFETCH) {
          pending.push(fetchBuf(segmentUrls[nextIdx++]));
        }

        // Consume in order, refill queue
        while (pending.length > 0) {
          const buf = await pending.shift()!;
          // Refill
          if (nextIdx < segmentUrls.length) {
            pending.push(fetchBuf(segmentUrls[nextIdx++]));
          }
          if (!buf) continue;
          const canWrite = ffmpeg.stdin.write(Buffer.from(buf));
          if (!canWrite) await new Promise(r => ffmpeg.stdin.once('drain', r));
        }
      } catch (err) {
        console.error('Segment feed error:', err);
      } finally {
        ffmpeg.stdin.end();
      }
    })();

    let stderrLog = '';
    ffmpeg.stderr.on('data', (chunk: Buffer) => { stderrLog += chunk.toString(); });
    ffmpeg.on('close', (code: number) => {
      if (code !== 0) console.error('ffmpeg exited with code', code, stderrLog.slice(-500));
    });

    // Convert Node stream to web ReadableStream manually for Bun compatibility
    const stream = new ReadableStream({
      start(controller) {
        ffmpeg.stdout.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        ffmpeg.stdout.on('end', () => {
          controller.close();
        });
        ffmpeg.stdout.on('error', (err) => {
          console.error('ffmpeg stdout error:', err);
          controller.error(err);
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Disposition': contentDisposition(mp4Filename),
        'Content-Type': 'video/mp4',
      },
    });
  } catch (error) {
    console.error('HLS download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
