import { NextRequest, NextResponse } from 'next/server';
import { getMovieStream, getMoviePlayers, getAvailableTranslations } from '@/lib/kinobox-parser';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kinopoiskId = searchParams.get('kp');
    const seasonParam = searchParams.get('season');
    const episodeParam = searchParams.get('episode');
    const audioParam = searchParams.get('audio');

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

    // Parse parameters
    const season = seasonParam ? parseInt(seasonParam, 10) : undefined;
    const episode = episodeParam ? parseInt(episodeParam, 10) : undefined;
    const audio = audioParam ? parseInt(audioParam, 10) : undefined;

    // Get direct streams with audio parameter
    const streams = await getMovieStream(id, season, episode, audio);

    // Get iframe players as fallback
    const players = await getMoviePlayers(id, season, episode);

    // Get available translations for selection
    const translations = await getAvailableTranslations(id, season, episode);

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
