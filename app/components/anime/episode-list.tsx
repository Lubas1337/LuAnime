'use client';

import { useState } from 'react';
import { Play, Grid, List, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { downloadEpisode } from '@/lib/download';
import type { Episode, Translation } from '@/types/anime';

interface EpisodeListProps {
  episodes: Episode[];
  translations: Translation[];
  currentEpisode: number | null;
  currentTranslation: Translation | null;
  onEpisodeSelect: (episode: Episode) => void;
  onTranslationSelect: (translation: Translation) => void;
  animeTitle: string;
}

export function EpisodeList({
  episodes,
  translations,
  currentEpisode,
  currentTranslation,
  onEpisodeSelect,
  onTranslationSelect,
  animeTitle,
}: EpisodeListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [downloadingEp, setDownloadingEp] = useState<number | null>(null);

  const handleDownloadEpisode = (e: React.MouseEvent, episode: Episode) => {
    e.stopPropagation();

    // Try to get a direct video URL from sources or embed_url
    const directUrl = episode.sources?.[0]?.url || episode.embed_url;
    if (!directUrl) return;

    setDownloadingEp(episode.number);
    downloadEpisode({
      directUrl,
      title: animeTitle,
      episode: episode.number,
    });
    setTimeout(() => setDownloadingEp(null), 3000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Серии ({episodes.length})
        </h3>

        <div className="flex items-center gap-2">
          {translations.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {currentTranslation?.title || 'Выбрать озвучку'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
                {translations.map((translation) => (
                  <DropdownMenuItem
                    key={translation.id}
                    onClick={() => onTranslationSelect(translation)}
                    className={
                      currentTranslation?.id === translation.id
                        ? 'bg-primary/20'
                        : ''
                    }
                  >
                    <div className="flex flex-col">
                      <span>{translation.title}</span>
                      {translation.type_name && (
                        <span className="text-xs text-muted-foreground">
                          {translation.type_name}
                          {translation.episodes_count
                            ? ` • ${translation.episodes_count} серий`
                            : ''}
                        </span>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

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

      <div className="max-h-[250px] overflow-y-auto rounded-xl border border-border bg-card/50 backdrop-blur-sm">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 p-4">
            {episodes.map((episode, index) => (
              <div key={episode.id} className="relative group">
                <button
                  onClick={() => onEpisodeSelect(episode)}
                  style={{ animationDelay: `${Math.min(index * 20, 300)}ms` }}
                  className={`episode-btn flex items-center justify-center w-full h-10 rounded-lg text-sm font-medium animate-fade-in-up ${
                    currentEpisode === episode.number
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                      : 'bg-secondary hover:bg-primary/20 hover:text-primary text-foreground'
                  }`}
                >
                  {episode.number}
                </button>
                {(episode.sources?.[0]?.url || episode.embed_url) && (
                  <button
                    onClick={(e) => handleDownloadEpisode(e, episode)}
                    className="absolute -top-1 -right-1 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
                    title="Скачать серию"
                  >
                    {downloadingEp === episode.number ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {episodes.map((episode, index) => (
              <div
                key={episode.id}
                className={`flex items-center gap-3 w-full p-3 transition-all duration-200 hover:bg-primary/10 animate-fade-in ${
                  currentEpisode === episode.number ? 'bg-primary/15 border-l-2 border-primary' : ''
                }`}
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
              >
                <button
                  onClick={() => onEpisodeSelect(episode)}
                  className="flex items-center gap-3 flex-1 text-left hover:pl-2 transition-all duration-200"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all duration-200 ${
                      currentEpisode === episode.number
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-110'
                        : 'bg-secondary text-foreground group-hover:bg-primary/20'
                    }`}
                  >
                    {currentEpisode === episode.number ? (
                      <Play className="h-3 w-3 fill-current animate-pulse" />
                    ) : (
                      <span>{episode.number}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      currentEpisode === episode.number ? 'text-primary' : 'text-foreground'
                    }`}>
                      Серия {episode.number}
                    </p>
                    {episode.name && episode.name !== `Серия ${episode.number}` && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {episode.name}
                      </p>
                    )}
                  </div>

                  {episode.updated_at && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(episode.updated_at * 1000).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </button>

                {(episode.sources?.[0]?.url || episode.embed_url) && (
                  <button
                    onClick={(e) => handleDownloadEpisode(e, episode)}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                    title="Скачать серию"
                  >
                    {downloadingEp === episode.number ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
