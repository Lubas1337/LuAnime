'use client';

import { useState } from 'react';
import { Play, ArrowUpDown, HardDrive, Wifi, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { sortSources } from '@/lib/api/stremio';
import type { StreamSource } from '@/types/stremio';

const qualityColors: Record<string, string> = {
  '4K': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  '1080p': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  '720p': 'bg-green-500/20 text-green-300 border-green-500/30',
  '480p': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  '360p': 'bg-red-500/20 text-red-300 border-red-500/30',
};

interface StreamListProps {
  sources: StreamSource[];
  loading: boolean;
  loadingAddons?: string[];
  onSelect: (source: StreamSource) => void;
  selectedUrl?: string;
}

export function StreamList({
  sources,
  loading,
  loadingAddons = [],
  onSelect,
  selectedUrl,
}: StreamListProps) {
  const [sortBy, setSortBy] = useState<'quality' | 'size'>('quality');

  const sorted = sortSources(sources, sortBy);

  const toggleSort = () => {
    setSortBy((prev) => (prev === 'quality' ? 'size' : 'quality'));
  };

  if (loading && sources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Загрузка стримов...</p>
      </div>
    );
  }

  if (!loading && sources.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Wifi className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Стримы не найдены</p>
        <p className="text-sm mt-1">Проверьте подключённые аддоны</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sources.length} стрим{sources.length === 1 ? '' : sources.length < 5 ? 'а' : 'ов'}
          {loadingAddons.length > 0 && (
            <span className="ml-2">
              <Loader2 className="inline h-3 w-3 animate-spin" /> загрузка...
            </span>
          )}
        </p>
        <Button variant="ghost" size="sm" onClick={toggleSort} className="text-xs">
          <ArrowUpDown className="h-3 w-3 mr-1" />
          {sortBy === 'quality' ? 'По качеству' : 'По размеру'}
        </Button>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {sorted.map((source, i) => (
          <button
            key={`${source.addonId}-${source.url}-${i}`}
            onClick={() => onSelect(source)}
            className={`w-full text-left p-3 rounded-lg border transition-all hover:border-primary/50 ${
              selectedUrl === source.url
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:bg-card/80'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Play className={`h-4 w-4 ${selectedUrl === source.url ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={qualityColors[source.quality] || 'bg-secondary text-secondary-foreground'}
                  >
                    {source.quality}
                  </Badge>
                  {source.size && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <HardDrive className="h-3 w-3" />
                      {source.size}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {source.addonName}
                  </span>
                </div>
                {source.title && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 break-all">
                    {source.title}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
