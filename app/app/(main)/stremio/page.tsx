'use client';

import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ContentSearch } from '@/components/stremio/content-search';
import { AddonManager } from '@/components/stremio/addon-manager';
import { useStremioStore } from '@/lib/store/stremio-store';

export default function StremioPage() {
  const { addons } = useStremioStore();
  const [addonDialogOpen, setAddonDialogOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stremio</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Поиск и просмотр контента через Stremio аддоны
          </p>
        </div>
        <Dialog open={addonDialogOpen} onOpenChange={setAddonDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Аддоны</span>
              {addons.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {addons.length}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Управление аддонами</DialogTitle>
            </DialogHeader>
            <AddonManager />
          </DialogContent>
        </Dialog>
      </div>

      {addons.filter((a) => a.isEnabled).length === 0 && (
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
          <Settings2 className="h-8 w-8 mx-auto text-primary mb-3" />
          <p className="font-medium">Добавьте аддон для начала</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Аддоны предоставляют ссылки на видео контент
          </p>
          <Button onClick={() => setAddonDialogOpen(true)}>
            Настроить аддоны
          </Button>
        </div>
      )}

      <ContentSearch />
    </div>
  );
}
