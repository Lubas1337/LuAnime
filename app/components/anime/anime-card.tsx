'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Anime } from '@/types/anime';
import { getImageUrl } from '@/types/anime';

interface AnimeCardProps {
  anime: Anime;
  variant?: 'default' | 'compact' | 'wide';
}

function getStatusLabel(status?: { id: number; name: string }): string {
  return status?.name || '';
}

function getStatusColor(status?: { id: number; name: string }): string {
  if (!status) return '';
  const name = status.name?.toLowerCase() || '';
  if (name.includes('онгоинг') || name.includes('выход')) {
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  }
  if (name.includes('вышел') || name.includes('завершен')) {
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
  if (name.includes('анонс')) {
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  }
  return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

export function AnimeCard({ anime, variant = 'default' }: AnimeCardProps) {
  const imageUrl = anime.image || getImageUrl(anime.poster);
  const rating = anime.grade;

  if (variant === 'wide') {
    return <WideAnimeCard anime={anime} />;
  }

  if (variant === 'compact') {
    return <CompactAnimeCard anime={anime} />;
  }

  return (
    <Link
      href={`/anime/${anime.id}`}
      className="anime-card group block overflow-hidden rounded-xl bg-card border border-transparent hover:border-primary/20"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-t-xl">
        <Image
          src={imageUrl}
          alt={anime.title_ru}
          fill
          className="card-image object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          unoptimized
        />

        <div className="card-overlay absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-primary/30">
            <Play className="h-6 w-6 fill-current ml-0.5" />
          </div>
        </div>

        {anime.status && (
          <Badge
            className={`absolute top-2 left-2 border ${getStatusColor(anime.status)}`}
          >
            {getStatusLabel(anime.status)}
          </Badge>
        )}

        {rating !== undefined && rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium text-white">
              {rating.toFixed(1)}
            </span>
          </div>
        )}

        {anime.episodes_released !== undefined && anime.episodes_total !== undefined && (
          <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm">
            <span className="text-xs font-medium text-white">
              {anime.episodes_released}/{anime.episodes_total || '?'}
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          {anime.title_ru}
        </h3>
        {anime.year && (
          <p className="mt-1 text-xs text-muted-foreground">{anime.year}</p>
        )}
      </div>
    </Link>
  );
}

function CompactAnimeCard({ anime }: { anime: Anime }) {
  const imageUrl = anime.image || getImageUrl(anime.poster);
  const rating = anime.grade;

  return (
    <Link
      href={`/anime/${anime.id}`}
      className="anime-card group flex gap-3 rounded-lg bg-card p-2 transition-colors hover:bg-secondary"
    >
      <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded">
        <Image
          src={imageUrl}
          alt={anime.title_ru}
          fill
          className="object-cover"
          sizes="56px"
          unoptimized
        />
      </div>

      <div className="flex min-w-0 flex-col justify-center">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          {anime.title_ru}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {rating !== undefined && rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {rating.toFixed(1)}
            </span>
          )}
          {anime.year && <span>{anime.year}</span>}
        </div>
      </div>
    </Link>
  );
}

function WideAnimeCard({ anime }: { anime: Anime }) {
  const imageUrl = anime.image || getImageUrl(anime.poster);
  const rating = anime.grade;

  return (
    <Link
      href={`/anime/${anime.id}`}
      className="anime-card group flex gap-4 rounded-lg bg-card overflow-hidden"
    >
      <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden">
        <Image
          src={imageUrl}
          alt={anime.title_ru}
          fill
          className="object-cover"
          sizes="96px"
          unoptimized
        />
      </div>

      <div className="flex flex-col justify-center py-3 pr-4">
        <h3 className="line-clamp-2 text-base font-medium text-foreground group-hover:text-primary transition-colors">
          {anime.title_ru}
        </h3>
        {anime.title_original && (
          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
            {anime.title_original}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {anime.status && (
            <Badge
              variant="outline"
              className={`text-xs ${getStatusColor(anime.status)}`}
            >
              {getStatusLabel(anime.status)}
            </Badge>
          )}
          {rating !== undefined && rating > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {rating.toFixed(1)}
            </span>
          )}
          {anime.year && (
            <span className="text-xs text-muted-foreground">{anime.year}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
