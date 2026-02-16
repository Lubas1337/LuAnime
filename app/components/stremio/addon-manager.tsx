'use client';

import { useState } from 'react';
import { Plus, Trash2, Power, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStremioStore } from '@/lib/store/stremio-store';
import { fetchManifest } from '@/lib/api/stremio';

export function AddonManager() {
  const { addons, addAddon, removeAddon, toggleAddon } = useStremioStore();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError('');

    try {
      const manifest = await fetchManifest(url.trim());
      addAddon(url.trim(), manifest);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить аддон');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL аддона (например, https://torrentio.strem.fun)"
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          disabled={loading}
        />
        <Button onClick={handleAdd} disabled={loading || !url.trim()}>
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

      {addons.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Нет добавленных аддонов</p>
          <p className="text-sm mt-1">Добавьте URL аддона Stremio для начала работы</p>
        </div>
      ) : (
        <div className="space-y-2">
          {addons.map((addon) => (
            <div
              key={addon.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                addon.isEnabled
                  ? 'border-border bg-card'
                  : 'border-border/50 bg-card/50 opacity-60'
              }`}
            >
              {addon.logo && (
                <img
                  src={addon.logo}
                  alt=""
                  className="h-8 w-8 rounded object-contain"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{addon.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {addon.description || addon.transportUrl}
                </p>
              </div>
              <div className="flex items-center gap-1">
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
      )}
    </div>
  );
}
