import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const addon = params.get('addon');
    const type = params.get('type');
    const id = params.get('id');

    if (!addon || !type || !id) {
      return NextResponse.json(
        { error: 'addon, type, and id parameters are required' },
        { status: 400 }
      );
    }

    const baseUrl = addon.replace(/\/+$/, '');
    const streamUrl = `${baseUrl}/stream/${type}/${id}.json`;

    const response = await fetch(streamUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Addon returned ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const streams = (data.streams || []).filter(
      (s: { url?: string; infoHash?: string }) => s.url || s.infoHash
    );

    return NextResponse.json({ streams });
  } catch (error) {
    console.error('Stremio stream error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streams' },
      { status: 500 }
    );
  }
}
