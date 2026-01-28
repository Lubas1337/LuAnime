import { NextRequest, NextResponse } from 'next/server';

const ANIXART_API_BASE = 'https://api.anixart.tv';

const ANIXART_HEADERS = {
  'User-Agent':
    'AnixartApp/8.0-22050323 (Android 7.1.2; SDK 25; x86; samsung SM-N975F; ru)',
  'Content-Type': 'application/json',
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const endpoint = '/' + path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${ANIXART_API_BASE}${endpoint}${searchParams ? `?${searchParams}` : ''}`;

  const headers: HeadersInit = { ...ANIXART_HEADERS };

  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const text = await response.text();

    if (!text) {
      return NextResponse.json({ code: 0, types: [], episodes: [], content: [] }, { status: 200 });
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: response.status });
    } catch {
      return NextResponse.json({ code: 0, types: [], episodes: [], content: [], raw: text }, { status: 200 });
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from API', code: -1 },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const endpoint = '/' + path.join('/');
  const url = `${ANIXART_API_BASE}${endpoint}`;

  const headers: HeadersInit = { ...ANIXART_HEADERS };

  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  try {
    const body = await request.json().catch(() => ({}));

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const text = await response.text();

    if (!text) {
      return NextResponse.json({ code: 0, content: [] }, { status: 200 });
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: response.status });
    } catch {
      return NextResponse.json({ code: 0, content: [], raw: text }, { status: 200 });
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from API', code: -1 },
      { status: 500 }
    );
  }
}
