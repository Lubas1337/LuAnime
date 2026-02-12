'use client';

import { useState } from 'react';
import { Play, Grid, List, ChevronDown, Volume2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { downloadEpisode, downloadSeason } from '@/lib/download';
import type { Season, Episode } from '@/types/movie';

interface Translation {
  id: string | number | null;
  name: string;
  quality: string;
  source: string;
}

interface SeasonEpisodeListProps {
  seasons: Season[];
  translations: Translation[];
  currentSeason: number;
  currentEpisode: number | null;
  currentTranslation: Translation | null;
  onSeasonSelect: (seasonNumber: number) => void;
  onEpisodeSelect: (episode: Episode) => void;
  onTranslationSelect: (translation: Translation) => void;
  kinopoiskId: number;
  audioIndex: number;
  seriesTitle: string;
}

export function SeasonEpisodeList({
  seasons,
  translations,
  currentSeason,
  currentEpisode,
  currentTranslation,
  onSeasonSelect,
  onEpisodeSelect,
  onTranslationSelect,
  kinopoiskId,
  audioIndex,
  seriesTitle,
}: SeasonEpisodeListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [downloadingEp, setDownloadingEp] = useState<number | null>(null);
  const [downloadEpProgress, setDownloadEpProgress] = useState(0);
  const [downloadingSeason, setDownloadingSeason] = useState(false);
  const [seasonProgress, setSeasonProgress] = useState('');

  // Sort seasons by number
  const sortedSeasons = [...seasons].sort((a, b) => a.number - b.number);

  const selectedSeason = sortedSeasons.find(s => s.number === currentSeason);
  // Sort episodes by episode number
  const episodes = [...(selectedSeason?.episodes || [])].sort(
    (a, b) => a.episodeNumber - b.episodeNumber
  );

  const handleDownloadEpisode = (e: React.MouseEvent, episode: Episode) => {
    e.stopPropagation();
    if (downloadingEp !== null) return;
    setDownloadingEp(episode.episodeNumber);
    setDownloadEpProgress(0);
    const result = downloadEpisode({
      kinopoiskId,
      season: currentSeason,
      episode: episode.episodeNumber,
      audio: audioIndex,
      title: seriesTitle,
      onProgress: (pct) => setDownloadEpProgress(pct),
    });
    result?.finally(() => {
      setDownloadingEp(null);
      setDownloadEpProgress(0);
    });
    if (!result) {
      setTimeout(() => setDownloadingEp(null), 3000);
    }
  };

  const handleDownloadSeason = async () => {
    setDownloadingSeason(true);
    await downloadSeason(
      episodes,
      {
        kinopoiskId,
        season: currentSeason,
        audio: audioIndex,
        title: seriesTitle,
      },
      (current, total, episodePct) => {
        const pct = episodePct !== undefined ? ` (${episodePct}%)` : '';
        setSeasonProgress(`${current}/${total}${pct}`);
      },
    );
    setDownloadingSeason(false);
    setSeasonProgress('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-lg font-semibold text-foreground">
          Серии ({episodes.length})
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Download season button */}
          {episodes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleDownloadSeason}
              disabled={downloadingSeason}
            >
              {downloadingSeason ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {seasonProgress}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Скачать сезон
                </>
              )}
            </Button>
          )}

          {/* Translation/Audio selector */}
          {translations.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Volume2 className="h-4 w-4" />
                  {currentTranslation?.name || 'Выбрать озвучку'}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
                {translations.map((translation) => (
                  <DropdownMenuItem
                    key={translation.id ?? translation.name}
                    onClick={() => onTranslationSelect(translation)}
                    className={currentTranslation?.name === translation.name ? 'bg-primary/20' : ''}
                  >
                    <div className="flex flex-col">
                      <span>{translation.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {translation.quality} • {translation.source}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

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
              <div key={`${episode.seasonNumber}-${episode.episodeNumber}`} className="relative group">
                <button
                  onClick={() => onEpisodeSelect(episode)}
                  style={{ animationDelay: `${Math.min(index * 20, 300)}ms` }}
                  className={`episode-btn flex items-center justify-center w-full h-10 rounded-lg text-sm font-medium animate-fade-in-up ${
                    currentEpisode === episode.episodeNumber
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                      : 'bg-secondary hover:bg-primary/20 hover:text-primary text-foreground'
                  }`}
                >
                  {episode.episodeNumber}
                </button>
                {downloadingEp === episode.episodeNumber ? (
                  <div className="absolute -top-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md text-[9px] font-bold">
                    {downloadEpProgress}%
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleDownloadEpisode(e, episode)}
                    className="absolute -top-1 -right-1 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
                    title="Скачать серию"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {episodes.map((episode, index) => (
              <div
                key={`${episode.seasonNumber}-${episode.episodeNumber}`}
                className={`flex items-center gap-3 w-full p-3 transition-all duration-200 hover:bg-primary/10 animate-fade-in ${
                  currentEpisode === episode.episodeNumber ? 'bg-primary/15 border-l-2 border-primary' : ''
                }`}
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
              >
                <button
                  onClick={() => onEpisodeSelect(episode)}
                  className="flex items-center gap-3 flex-1 text-left hover:pl-2 transition-all duration-200"
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

                {downloadingEp === episode.episodeNumber ? (
                  <span className="text-xs font-medium text-primary min-w-[3ch] text-right">
                    {downloadEpProgress}%
                  </span>
                ) : (
                  <button
                    onClick={(e) => handleDownloadEpisode(e, episode)}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                    title="Скачать серию"
                  >
                    <Download className="h-4 w-4" />
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
