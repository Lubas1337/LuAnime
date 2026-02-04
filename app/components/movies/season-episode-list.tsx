'use client';

import { useState } from 'react';
import { Play, Grid, List, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Season, Episode } from '@/types/movie';

interface SeasonEpisodeListProps {
  seasons: Season[];
  currentSeason: number;
  currentEpisode: number | null;
  onSeasonSelect: (seasonNumber: number) => void;
  onEpisodeSelect: (episode: Episode) => void;
}

export function SeasonEpisodeList({
  seasons,
  currentSeason,
  currentEpisode,
  onSeasonSelect,
  onEpisodeSelect,
}: SeasonEpisodeListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sort seasons by number
  const sortedSeasons = [...seasons].sort((a, b) => a.number - b.number);

  const selectedSeason = sortedSeasons.find(s => s.number === currentSeason);
  // Sort episodes by episode number
  const episodes = [...(selectedSeason?.episodes || [])].sort(
    (a, b) => a.episodeNumber - b.episodeNumber
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-lg font-semibold text-foreground">
          Серии ({episodes.length})
        </h3>

        <div className="flex items-center gap-2">
          {/* Season selector */}
          {sortedSeasons.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Сезон {currentSeason}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
                {sortedSeasons.map((season) => (
                  <DropdownMenuItem
                    key={season.number}
                    onClick={() => onSeasonSelect(season.number)}
                    className={currentSeason === season.number ? 'bg-primary/20' : ''}
                  >
                    <div className="flex flex-col">
                      <span>Сезон {season.number}</span>
                      <span className="text-xs text-muted-foreground">
                        {season.episodes.length} серий
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* View mode toggle */}
          <div className="flex rounded-lg bg-secondary p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-h-[300px] overflow-y-auto rounded-xl border border-border bg-card/50 backdrop-blur-sm">
        {episodes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Серии недоступны
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 p-4">
            {episodes.map((episode, index) => (
              <button
                key={`${episode.seasonNumber}-${episode.episodeNumber}`}
                onClick={() => onEpisodeSelect(episode)}
                style={{ animationDelay: `${Math.min(index * 20, 300)}ms` }}
                className={`episode-btn flex items-center justify-center h-10 rounded-lg text-sm font-medium animate-fade-in-up ${
                  currentEpisode === episode.episodeNumber
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                    : 'bg-secondary hover:bg-primary/20 hover:text-primary text-foreground'
                }`}
              >
                {episode.episodeNumber}
              </button>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {episodes.map((episode, index) => (
              <button
                key={`${episode.seasonNumber}-${episode.episodeNumber}`}
                onClick={() => onEpisodeSelect(episode)}
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                className={`flex items-center gap-3 w-full p-3 text-left transition-all duration-200 hover:bg-primary/10 hover:pl-5 animate-fade-in ${
                  currentEpisode === episode.episodeNumber ? 'bg-primary/15 border-l-2 border-primary' : ''
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all duration-200 ${
                    currentEpisode === episode.episodeNumber
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-110'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  {currentEpisode === episode.episodeNumber ? (
                    <Play className="h-3 w-3 fill-current animate-pulse" />
                  ) : (
                    <span>{episode.episodeNumber}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium transition-colors duration-200 ${
                    currentEpisode === episode.episodeNumber ? 'text-primary' : 'text-foreground'
                  }`}>
                    Серия {episode.episodeNumber}
                    {episode.nameRu && ` — ${episode.nameRu}`}
                  </p>
                  {episode.synopsis && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {episode.synopsis}
                    </p>
                  )}
                </div>

                {episode.releaseDate && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(episode.releaseDate).toLocaleDateString('ru-RU')}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
