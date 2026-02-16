'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StremioAddon, StremioManifest } from '@/types/stremio';

interface StremioState {
  addons: StremioAddon[];
  addAddon: (url: string, manifest: StremioManifest) => void;
  removeAddon: (id: string) => void;
  toggleAddon: (id: string) => void;
  getEnabledAddons: () => StremioAddon[];
}

function normalizeUrl(url: string): string {
  return url.replace(/\/manifest\.json$/, '').replace(/\/+$/, '');
}

export const useStremioStore = create<StremioState>()(
  persist(
    (set, get) => ({
      addons: [],

      addAddon: (url, manifest) => {
        const transportUrl = normalizeUrl(url);
        set((state) => {
          if (state.addons.some((a) => a.id === manifest.id)) {
            return state;
          }
          const addon: StremioAddon = {
            id: manifest.id,
            name: manifest.name,
            version: manifest.version,
            description: manifest.description,
            logo: manifest.logo,
            url: transportUrl,
            transportUrl,
            isEnabled: true,
            manifest,
          };
          return { addons: [...state.addons, addon] };
        });
      },

      removeAddon: (id) =>
        set((state) => ({
          addons: state.addons.filter((a) => a.id !== id),
        })),

      toggleAddon: (id) =>
        set((state) => ({
          addons: state.addons.map((a) =>
            a.id === id ? { ...a, isEnabled: !a.isEnabled } : a
          ),
        })),

      getEnabledAddons: () => get().addons.filter((a) => a.isEnabled),
    }),
    {
      name: 'stremio-addons-storage',
    }
  )
);
