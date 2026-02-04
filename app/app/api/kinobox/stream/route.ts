import { NextRequest, NextResponse } from 'next/server';
import { getMovieStream, getMoviePlayers, getAvailableTranslations, parseTranslationStream } from '@/lib/kinobox-parser';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kinopoiskId = searchParams.get('kp');
    const translationUrl = searchParams.get('translation');
    const seasonParam = searchParams.get('season');
    const episodeParam = searchParams.get('episode');

    if (!kinopoiskId) {
      return NextResponse.json(
        { error: 'kinopoiskId is required' },
        { status: 400 }
      );
    }

    const id = parseInt(kinopoiskId, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid kinopoiskId' },
        { status: 400 }
      );
    }

    // Parse season and episode if provided
    const season = seasonParam ? parseInt(seasonParam, 10) : undefined;
    const episode = episodeParam ? parseInt(episodeParam, 10) : undefined;

    // If specific translation URL provided, parse just that
    if (translationUrl) {
      const stream = await parseTranslationStream(translationUrl);
      return NextResponse.json({
        stream,
      });
    }

    // Try to get direct streams first (with season/episode for series)
    const streams = await getMovieStream(id, season, episode);

    // Also get iframe players as fallback
    const players = await getMoviePlayers(id);

    // Get available translations for selection
    const translations = await getAvailableTranslations(id);

    return NextResponse.json({
      streams,
      players,
      translations,
    });
  } catch (error) {
    console.error('Kinobox stream error:', error);
    return NextResponse.json(
      { error: 'Failed to get stream' },
      { status: 500 }
    );
  }
}
