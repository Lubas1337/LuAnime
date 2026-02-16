import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 15;

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const CINEMETA_BASE = 'https://v3-cinemeta.strem.io';

// --- Cinemeta search ---
async function searchCinemeta(query: string, type?: string) {
  const types = type === 'movie' ? ['movie'] : type === 'tv' ? ['series'] : ['movie', 'series'];

  const fetches = types.map(async (t) => {
    const url = `${CINEMETA_BASE}/catalog/${t}/top/search=${encodeURIComponent(query)}.json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.metas || []).map((item: {
      id: string;
      name: string;
      poster?: string;
      background?: string;
      type: string;
      releaseInfo?: string;
      year?: string;
      imdbRating?: string;
      description?: string;
      genres?: string[];
    }) => ({
      id: item.id, // IMDB ID directly (e.g. "tt1234567")
      title: item.name || '',
      originalTitle: '',
      overview: item.description || '',
      posterPath: item.poster || null,
      backdropPath: item.background || null,
      mediaType: item.type === 'movie' ? 'movie' : 'tv',
      releaseDate: item.releaseInfo || item.year || '',
      voteAverage: item.imdbRating ? parseFloat(item.imdbRating) : 0,
      genreIds: [],
      imdbId: item.id, // Already an IMDB ID
    }));
  });

  const results = await Promise.all(fetches);
  return results.flat().slice(0, 20);
}

// --- TMDB search ---
async function searchTMDB(query: string, type?: string) {
  if (!TMDB_API_KEY) {
    return { results: [], error: 'TMDB API key not configured' };
  }

  const searchType = type === 'movie' ? 'movie' : type === 'tv' ? 'tv' : 'multi';
  const url = `${TMDB_BASE}/search/${searchType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ru-RU&include_adult=false`;

  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) {
    return { results: [], error: `TMDB returned ${response.status}` };
  }

  const data = await response.json();

  const results = (data.results || [])
    .filter((item: { media_type?: string }) => {
      if (searchType === 'multi') {
        return item.media_type === 'movie' || item.media_type === 'tv';
      }
      return true;
    })
    .slice(0, 20)
    .map((item: {
      id: number;
      title?: string;
      name?: string;
      original_title?: string;
      original_name?: string;
      overview?: string;
      poster_path?: string;
      backdrop_path?: string;
      media_type?: string;
      release_date?: string;
      first_air_date?: string;
      vote_average?: number;
      genre_ids?: number[];
    }) => ({
      id: item.id,
      title: item.title || item.name || '',
      originalTitle: item.original_title || item.original_name || '',
      overview: item.overview || '',
      posterPath: item.poster_path
        ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
        : null,
      backdropPath: item.backdrop_path
        ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
        : null,
      mediaType: item.media_type || searchType,
      releaseDate: item.release_date || item.first_air_date || '',
      voteAverage: item.vote_average || 0,
      genreIds: item.genre_ids || [],
    }));

  return { results };
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const query = params.get('query');
    const type = params.get('type');
    const source = params.get('source') || 'cinemeta'; // default to cinemeta (no key needed)

    if (!query) {
      return NextResponse.json({ error: 'query parameter is required' }, { status: 400 });
    }

    if (source === 'cinemeta') {
      const results = await searchCinemeta(query, type || undefined);
      return NextResponse.json({ results, source: 'cinemeta' });
    }

    // TMDB
    const { results, error } = await searchTMDB(query, type || undefined);
    if (error && results.length === 0) {
      return NextResponse.json({ error }, { status: 500 });
    }
    return NextResponse.json({ results, source: 'tmdb' });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}

// Get external IDs (IMDB) for a TMDB item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tmdbId, mediaType } = body;

    if (!tmdbId || !mediaType) {
      return NextResponse.json(
        { error: 'tmdbId and mediaType are required' },
        { status: 400 }
      );
    }

    if (!TMDB_API_KEY) {
      return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 });
    }

    const url = `${TMDB_BASE}/${mediaType}/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `TMDB returned ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      imdbId: data.imdb_id || null,
      tvdbId: data.tvdb_id || null,
    });
  } catch (error) {
    console.error('TMDB external IDs error:', error);
    return NextResponse.json(
      { error: 'Failed to get external IDs' },
      { status: 500 }
    );
  }
}
