import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range, Accept-Encoding',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type',
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
    // Forward Range header if present
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://api.delivembd.ws/',
      'Origin': 'https://api.delivembd.ws',
    };

    const rangeHeader = request.headers.get('Range');
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    const response = await fetch(url, { headers });

    if (!response.ok && response.status !== 206) {
      console.error('Segment fetch failed:', response.status, response.statusText);
      return new NextResponse(null, {
        status: response.status,
        headers: corsHeaders,
      });
    }

    // Stream the response instead of buffering
    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': response.headers.get('Content-Type') || 'video/mp2t',
      'Cache-Control': 'public, max-age=3600',
    };

    // Forward content headers
    const contentRange = response.headers.get('Content-Range');
    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange;
    }

    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }

    // Stream the body directly
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Segment proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy segment' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}
