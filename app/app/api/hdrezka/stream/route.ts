import { NextRequest, NextResponse } from 'next/server';
import { parseMoviePage, getMovieStream } from '@/lib/hdrezka-parser';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, translationId } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Parse the movie page to get ID and translations
    const pageData = await parseMoviePage(url);

    if (!pageData) {
      return NextResponse.json(
        { error: 'Failed to parse movie page' },
        { status: 404 }
      );
    }

    // Get the stream using the specified translation or default to first one
    const selectedTranslation = translationId || pageData.translations[0]?.id;

    if (!selectedTranslation) {
      return NextResponse.json(
        { error: 'No translations available' },
        { status: 404 }
      );
    }

    const streamData = await getMovieStream(url, pageData.id, selectedTranslation);

    if (!streamData || Object.keys(streamData.qualities).length === 0) {
      return NextResponse.json(
        { error: 'Failed to get video stream' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      streams: {
        qualities: streamData.qualities,
        translations: pageData.translations,
        defaultTranslation: selectedTranslation,
      },
    });
  } catch (error) {
    console.error('HDRezka stream error:', error);
    return NextResponse.json(
      { error: 'Failed to get stream from HDRezka' },
      { status: 500 }
    );
  }
}
