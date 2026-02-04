import { NextRequest, NextResponse } from 'next/server';

const KINOPOISK_API = 'https://kinopoiskapiunofficial.tech/api';
const API_KEY = process.env.KINOPOISK_API_KEY || '802234be-4435-4b68-83ad-b694cdd07415';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const params = await context.params;
    const path = params.path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${KINOPOISK_API}/${path}${searchParams ? `?${searchParams}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Kinopoisk API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Kinopoisk proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Kinopoisk API' },
      { status: 500 }
    );
  }
}
