export interface StremioManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  logo?: string;
  types?: string[];
  resources?: (string | { name: string; types?: string[]; idPrefixes?: string[] })[];
  idPrefixes?: string[];
  catalogs?: { type: string; id: string; name?: string }[];
}

export interface StremioAddon {
  id: string;
  name: string;
  version: string;
  description?: string;
  logo?: string;
  url: string;
  transportUrl: string;
  isEnabled: boolean;
  manifest: StremioManifest;
}

export interface StremioBehaviorHints {
  videoSize?: number;
  filename?: string;
  bingeGroup?: string;
  notWebReady?: boolean;
}

export interface StremioStream {
  name?: string;
  title?: string;
  description?: string;
  url?: string;
  infoHash?: string;
  fileIdx?: number;
  externalUrl?: string;
  behaviorHints?: StremioBehaviorHints;
  subtitles?: StremioSubtitle[];
}

export interface StremioSubtitle {
  id: string;
  url: string;
  lang: string;
  label?: string;
}

export interface StremioStreamResponse {
  streams: StremioStream[];
}

export interface StreamSource {
  addonId: string;
  addonName: string;
  name?: string;
  title?: string;
  quality: string;
  size: string;
  sizeBytes: number;
  url: string;
  infoHash?: string;
  isTorrent: boolean;
  filename?: string;
  subtitles?: StremioSubtitle[];
}

export interface TMDBSearchResult {
  id: number | string;
  title: string;
  originalTitle?: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  mediaType: 'movie' | 'tv';
  releaseDate?: string;
  voteAverage?: number;
  imdbId?: string;
  genreIds?: number[];
}

export interface TMDBExternalIds {
  imdb_id?: string;
  tvdb_id?: number;
}

export type StremioContentType = 'movie' | 'series';
