import { NextRequest, NextResponse } from 'next/server';

function resolveServerUrl(clientUrl: string): string {
  if (clientUrl === 'built-in') {
    const internalUrl = process.env.TORRSERVER_INTERNAL_URL || 'http://localhost:8090';
    return internalUrl.replace(/\/+$/, '');
  }
  return clientUrl.replace(/\/+$/, '');
}

// Public URL for direct browser access (bypasses Next.js proxy)
function getPublicStreamBase(clientUrl: string): string | null {
  // For built-in: use the public TorrServer domain
  if (clientUrl === 'built-in') {
    const publicUrl = process.env.TORRSERVER_PUBLIC_URL;
    return publicUrl ? publicUrl.replace(/\/+$/, '') : null;
  }
  // For custom URL: browser can reach it directly
  return clientUrl.replace(/\/+$/, '');
}

function buildStreamUrl(
  publicBase: string | null,
  proxyFallback: string,
  hash: string,
  fileId: number,
  filePath: string
): string {
  if (publicBase) {
    // Direct: browser → TorrServer (no proxy, no bandwidth on our server)
    return `${publicBase}/stream/${encodeURIComponent(filePath)}?link=${hash}&index=${fileId}&play`;
  }
  // Fallback: browser → Next.js proxy → TorrServer
  return `${proxyFallback}?hash=${hash}&index=${fileId}&file=${encodeURIComponent(filePath)}`;
}

// POST /api/stremio/torrserver — control requests (add/drop/echo)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serverUrl, action, magnet, hash } = body;

    if (!serverUrl) {
      return NextResponse.json({ error: 'serverUrl is required' }, { status: 400 });
    }

    const baseUrl = resolveServerUrl(serverUrl);

    if (action === 'echo') {
      const res = await fetch(`${baseUrl}/echo`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error('TorrServer not responding');
      const text = await res.text();
      return NextResponse.json({ ok: true, version: text.trim() });
    }

    if (action === 'add') {
      const res = await fetch(`${baseUrl}/torrents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          link: magnet,
          title: body.title || '',
          poster: body.poster || '',
          save_to_db: false,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`TorrServer error: ${res.status} ${text}`);
      }

      const torrent = await res.json();

      const videoExts = /\.(mp4|mkv|avi|mov|wmv|flv|webm|m4v|ts)$/i;
      const files = (torrent.file_stats || [])
        .filter((f: any) => videoExts.test(f.path))
        .sort((a: any, b: any) => (b.length || 0) - (a.length || 0));

      const mainFile = files[0];
      if (!mainFile) {
        return NextResponse.json({ error: 'No video files found in torrent' }, { status: 404 });
      }

      const publicBase = getPublicStreamBase(serverUrl);
      const proxyBase = '/api/stremio/torrserver';

      const streamUrl = buildStreamUrl(publicBase, proxyBase, torrent.hash, mainFile.id, mainFile.path);

      return NextResponse.json({
        hash: torrent.hash,
        streamUrl,
        fileName: mainFile.path,
        fileSize: mainFile.length,
        files: files.map((f: any) => ({
          id: f.id,
          path: f.path,
          size: f.length,
          streamUrl: buildStreamUrl(publicBase, proxyBase, torrent.hash, f.id, f.path),
        })),
      });
    }

    if (action === 'drop' && hash) {
      await fetch(`${baseUrl}/torrents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'drop', hash }),
        signal: AbortSignal.timeout(5000),
      }).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'TorrServer request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/stremio/torrserver?hash=...&index=...&file=... — fallback stream proxy
// Used when TORRSERVER_PUBLIC_URL is not set (e.g. local dev)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const hash = searchParams.get('hash');
  const index = searchParams.get('index');
  const file = searchParams.get('file');

  if (!hash || !index) {
    return NextResponse.json({ error: 'hash and index are required' }, { status: 400 });
  }

  const internalUrl = process.env.TORRSERVER_INTERNAL_URL?.replace(/\/+$/, '') || 'http://torrserver:8090';
  const tsStreamUrl = `${internalUrl}/stream/${encodeURIComponent(file || 'video')}?link=${hash}&index=${index}&play`;

  try {
    const headers: Record<string, string> = {};
    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    const upstream = await fetch(tsStreamUrl, { headers });

    const responseHeaders = new Headers();
    const contentType = upstream.headers.get('content-type');
    const contentLength = upstream.headers.get('content-length');
    const contentRange = upstream.headers.get('content-range');
    const acceptRanges = upstream.headers.get('accept-ranges');

    if (contentType) responseHeaders.set('Content-Type', contentType);
    if (contentLength) responseHeaders.set('Content-Length', contentLength);
    if (contentRange) responseHeaders.set('Content-Range', contentRange);
    if (acceptRanges) responseHeaders.set('Accept-Ranges', acceptRanges);
    else responseHeaders.set('Accept-Ranges', 'bytes');

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stream proxy failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
