import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
};

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL is required' },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://api.delivembd.ws/',
        'Origin': 'https://api.delivembd.ws',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch m3u8', status: response.status },
        { status: response.status, headers: corsHeaders }
      );
    }

    const content = await response.text();

    // Parse the m3u8 and rewrite segment URLs to be absolute
    const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
    const rewrittenContent = rewriteM3U8(content, baseUrl);

    return new NextResponse(rewrittenContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('M3U8 proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy m3u8' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Rewrite URLs in m3u8 to go through our proxy
function rewriteM3U8(content: string, baseUrl: string): string {
  const lines = content.split('\n');

  return lines.map(line => {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) return line;

    // Handle comment lines with URIs
    if (trimmed.startsWith('#')) {
      // Handle EXT-X-MEDIA, EXT-X-KEY, EXT-X-MAP with URI
      if (trimmed.includes('URI="')) {
        return trimmed.replace(/URI="([^"]+)"/g, (_, uri) => {
          const absoluteUri = uri.startsWith('http') ? uri : baseUrl + uri;
          // Proxy all files through our proxy
          if (absoluteUri.includes('.m3u8')) {
            return `URI="/api/proxy/m3u8?url=${encodeURIComponent(absoluteUri)}"`;
          }
          // Proxy segments too
          return `URI="/api/proxy/segment?url=${encodeURIComponent(absoluteUri)}"`;
        });
      }
      return line;
    }

    // For segment/playlist URLs on their own lines
    const segmentUrl = trimmed.startsWith('http') ? trimmed : baseUrl + trimmed;

    // Proxy .m3u8 files through our m3u8 proxy
    if (segmentUrl.includes('.m3u8')) {
      return `/api/proxy/m3u8?url=${encodeURIComponent(segmentUrl)}`;
    }

    // Proxy video/audio segments through segment proxy
    if (segmentUrl.includes('.ts') || segmentUrl.includes('.mp4') || segmentUrl.includes('.m4s') || segmentUrl.includes('.aac')) {
      return `/api/proxy/segment?url=${encodeURIComponent(segmentUrl)}`;
    }

    return segmentUrl;
  }).join('\n');
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}
