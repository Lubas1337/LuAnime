'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Anime } from '@/types/anime';

interface FavoriteItem {
  animeId: number;
  addedAt: string;
  anime?: Anime;
}

interface FavoritesState {
  favorites: FavoriteItem[];
  addFavorite: (animeId: number, anime?: Anime) => void;
  removeFavorite: (animeId: number) => void;
  isFavorite: (animeId: number) => boolean;
  getFavoriteAnime: () => Anime[];
  setFavoriteAnime: (animeId: number, anime: Anime) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (animeId, anime) =>
        set((state) => {
          if (state.favorites.some((f) => f.animeId === animeId)) {
            return state;
          }
          return {
            favorites: [
              ...state.favorites,
              {
                animeId,
                addedAt: new Date().toISOString(),
                anime,
              },
            ],
          };
        }),

      removeFavorite: (animeId) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.animeId !== animeId),
        })),

      isFavorite: (animeId) => get().favorites.some((f) => f.animeId === animeId),

      getFavoriteAnime: () =>
        get()
          .favorites.filter((f) => f.anime)
          .map((f) => f.anime as Anime),

      setFavoriteAnime: (animeId, anime) =>
        set((state) => ({
          favorites: state.favorites.map((f) =>
            f.animeId === animeId ? { ...f, anime } : f
          ),
        })),
    }),
    {
      name: 'favorites-storage',
    }
  )
);
