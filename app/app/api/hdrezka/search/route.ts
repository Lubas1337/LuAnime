import { NextRequest, NextResponse } from 'next/server';
import { searchHDRezka } from '@/lib/hdrezka-parser';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, year } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const results = await searchHDRezka(title);

    // Filter by year if provided
    const filteredResults = year
      ? results.filter((r) => !r.year || r.year === year)
      : results;

    return NextResponse.json({ results: filteredResults });
  } catch (error) {
    console.error('HDRezka search error:', error);
    return NextResponse.json(
      { error: 'Failed to search HDRezka', results: [] },
      { status: 500 }
    );
  }
}
