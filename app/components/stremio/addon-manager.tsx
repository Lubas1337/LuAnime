'use client';

import { useState } from 'react';
import { Plus, Trash2, Power, Loader2, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStremioStore } from '@/lib/store/stremio-store';
import { fetchManifest } from '@/lib/api/stremio';

interface PresetAddon {
  name: string;
  url: string;
  description: string;
  tag?: string;
}

const PRESET_ADDONS: PresetAddon[] = [
  {
    name: 'Torrentio',
    url: 'https://torrentio.strem.fun',
    description: 'Торренты из множества трекеров. Без Debrid — magnet-ссылки, с Debrid — прямое воспроизведение.',
    tag: 'Популярный',
  },
  {
    name: 'CometStream',
    url: 'https://comet.elfhosted.com',
    description: 'Требуется Debrid-сервис. Настройте на сайте аддона и вставьте персональный URL.',
    tag: 'Debrid',
  },
  {
    name: 'MediaFusion',
    url: 'https://mediafusion.elfhosted.com',
    description: 'Торренты и debrid. Настройте на сайте аддона для прямых стримов.',
  },
  {
    name: 'Streaming Catalogs',
    url: 'https://7a82163c306e-stremio-netflix-catalog-addon.baby-beamup.club',
    description: 'Каталоги Netflix, Disney+, Prime Video. Только информация, не стримы.',
    tag: 'Каталоги',
  },
  {
    name: 'OpenSubtitles v3',
    url: 'https://opensubtitles-v3.strem.io',
    description: 'Субтитры из OpenSubtitles на многих языках.',
    tag: 'Субтитры',
  },
  {
    name: 'Cinemeta',
    url: 'https://v3-cinemeta.strem.io',
    description: 'Официальный каталог Stremio с метаданными фильмов и сериалов.',
    tag: 'Каталог',
  },
];

export function AddonManager() {
  const { addons, addAddon, removeAddon, toggleAddon } = useStremioStore();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleAdd = async (addonUrl?: string) => {
    const targetUrl = addonUrl || url.trim();
    if (!targetUrl) return;

    if (addonUrl) {
      setLoadingPreset(addonUrl);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const manifest = await fetchManifest(targetUrl);
      addAddon(targetUrl, manifest);
      if (!addonUrl) setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить аддон');
    } finally {
      setLoading(false);
      setLoadingPreset(null);
    }
  };

  const installedIds = new Set(addons.map((a) => a.transportUrl));

  const availablePresets = PRESET_ADDONS.filter(
    (p) => !installedIds.has(p.url.replace(/\/+$/, ''))
  );

  return (
    <div className="space-y-4 overflow-hidden">
      {/* Manual URL input */}
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL аддона"
          className="flex-1 min-w-0"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          disabled={loading}
        />
        <Button onClick={() => handleAdd()} disabled={loading || !url.trim()}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Добавить</span>
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* Preset addons */}
      {availablePresets.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Популярные аддоны
          </p>
          <div className="space-y-1.5">
            {availablePresets.map((preset) => (
              <div
                key={preset.url}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-border hover:border-primary/40 transition-colors overflow-hidden"
              >
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{preset.name}</p>
                    {preset.tag && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                        {preset.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{preset.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAdd(preset.url)}
                  disabled={loadingPreset === preset.url}
                  className="shrink-0"
                >
                  {loadingPreset === preset.url ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Installed addons */}
      {addons.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Установленные
          </p>
          <div className="space-y-2">
            {addons.map((addon) => (
              <div
                key={addon.id}
                className={`flex items-center gap-3 p-3 rounded-lg border overflow-hidden transition-colors ${
                  addon.isEnabled
                    ? 'border-border bg-card'
                    : 'border-border/50 bg-card/50 opacity-60'
                }`}
              >
                {addon.logo && (
                  <img
                    src={addon.logo}
                    alt=""
                    className="h-8 w-8 rounded object-contain shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="font-medium text-sm truncate">{addon.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {addon.description || addon.transportUrl}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={addon.transportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => toggleAddon(addon.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      addon.isEnabled
                        ? 'text-green-400 hover:bg-green-400/10'
                        : 'text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeAddon(addon.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {addons.length === 0 && availablePresets.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Все пресеты установлены</p>
        </div>
      )}
    </div>
  );
}
