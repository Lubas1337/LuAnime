'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StremioPlayer } from '@/components/stremio/stremio-player';
import { StreamList } from '@/components/stremio/stream-list';
import { useStremioStore } from '@/lib/store/stremio-store';
import { resolveAllStreams, buildSeriesId } from '@/lib/api/stremio';
import type { StreamSource, StremioContentType } from '@/types/stremio';

function WatchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getEnabledAddons } = useStremioStore();

  const imdbId = searchParams.get('imdb') || '';
  const type = (searchParams.get('type') || 'movie') as StremioContentType;
  const title = searchParams.get('title') || '';
  const poster = searchParams.get('poster') || '';

  const [season, setSeason] = useState(searchParams.get('season') || '1');
  const [episode, setEpisode] = useState(searchParams.get('episode') || '1');

  const [sources, setSources] = useState<StreamSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAddons, setLoadingAddons] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<StreamSource | null>(null);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  const loadStreams = useCallback(async () => {
    const addons = getEnabledAddons();
    if (addons.length === 0 || !imdbId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setSources([]);
    setSelectedSource(null);
    setFailedUrls(new Set());
    setLoadingAddons(addons.map((a) => a.id));

    const id =
      type === 'series'
        ? buildSeriesId(imdbId, parseInt(season), parseInt(episode))
        : imdbId;

    const allSources = await resolveAllStreams(addons, type, id, (addonId, newSources) => {
      setSources((prev) => {
        const merged = [...prev, ...newSources];
        return merged;
      });
      setLoadingAddons((prev) => prev.filter((id) => id !== addonId));
    });

    setSources(allSources);
    setLoadingAddons([]);
    setLoading(false);
  }, [getEnabledAddons, imdbId, type, season, episode]);

  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  const handleStreamError = () => {
    if (!selectedSource) return;
    setFailedUrls((prev) => new Set([...prev, selectedSource.url]));

    // Auto-fallback to next stream
    const available = sources.filter((s) => !failedUrls.has(s.url) && s.url !== selectedSource.url);
    if (available.length > 0) {
      setSelectedSource(available[0]);
    } else {
      setSelectedSource(null);
    }
  };

  const handleEpisodeChange = () => {
    loadStreams();
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/stremio')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg font-bold truncate">{title || 'Просмотр'}</h1>
          <p className="text-xs text-muted-foreground">
            {type === 'movie' ? 'Фильм' : 'Сериал'} • {imdbId}
          </p>
        </div>
      </div>

      {/* Series controls */}
      {type === 'series' && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Сезон</label>
            <Input
              type="number"
              min={1}
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-20"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Эпизод</label>
            <Input
              type="number"
              min={1}
              value={episode}
              onChange={(e) => setEpisode(e.target.value)}
              className="w-20"
            />
          </div>
          <Button size="sm" onClick={handleEpisodeChange}>
            Загрузить
          </Button>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const ep = Math.max(1, parseInt(episode) - 1);
                setEpisode(ep.toString());
                setTimeout(loadStreams, 0);
              }}
            >
              Пред.
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEpisode((parseInt(episode) + 1).toString());
                setTimeout(loadStreams, 0);
              }}
            >
              След.
            </Button>
          </div>
        </div>
      )}

      {/* Player + Streams layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StremioPlayer
            source={selectedSource}
            poster={poster}
            title={title}
            onError={handleStreamError}
          />
        </div>
        <div>
          <StreamList
            sources={sources}
            loading={loading}
            loadingAddons={loadingAddons}
            onSelect={setSelectedSource}
            selectedUrl={selectedSource?.url}
          />
        </div>
      </div>
    </div>
  );
}

export default function StremioWatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <WatchContent />
    </Suspense>
  );
}
