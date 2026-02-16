import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 15;

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) {
      return NextResponse.json({ error: 'url parameter is required' }, { status: 400 });
    }

    const manifestUrl = url.replace(/\/+$/, '').replace(/\/manifest\.json$/, '') + '/manifest.json';

    const response = await fetch(manifestUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Addon returned ${response.status}` },
        { status: 502 }
      );
    }

    const manifest = await response.json();

    if (!manifest.id || !manifest.name) {
      return NextResponse.json(
        { error: 'Invalid manifest: missing id or name' },
        { status: 422 }
      );
    }

    return NextResponse.json(manifest);
  } catch (error) {
    console.error('Stremio manifest error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addon manifest' },
      { status: 500 }
    );
  }
}
