'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Episode, VideoSource, Translation } from '@/types/anime';

interface WatchHistoryEntry {
  episode: number;
  progress: number;
  title?: string;
  poster?: string;
  lastWatched?: string;
}

interface PlayerState {
  currentAnimeId: number | null;
  currentEpisode: Episode | null;
  currentSource: VideoSource | null;
  currentTranslation: Translation | null;
  translations: Translation[];
  episodes: Episode[];
  isPlaying: boolean;
  progress: number;
  volume: number;
  playbackRate: number;
  quality: string;
  watchHistory: Record<string, WatchHistoryEntry>;
  episodeTimes: Record<string, number>; // "animeId-episode" -> currentTime in seconds

  setAnime: (animeId: number) => void;
  setEpisode: (episode: Episode) => void;
  setSource: (source: VideoSource) => void;
  setTranslation: (translation: Translation) => void;
  setTranslations: (translations: Translation[]) => void;
  setEpisodes: (episodes: Episode[]) => void;
  setIsPlaying: (playing: boolean) => void;
  setProgress: (progress: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  setQuality: (quality: string) => void;
  saveProgress: (animeId: number, episode: number, progress: number, title?: string, poster?: string) => void;
  getProgress: (animeId: number) => WatchHistoryEntry | null;
  saveEpisodeTime: (animeId: number, episode: number, time: number) => void;
  getEpisodeTime: (animeId: number, episode: number) => number | null;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentAnimeId: null,
      currentEpisode: null,
      currentSource: null,
      currentTranslation: null,
      translations: [],
      episodes: [],
      isPlaying: false,
      progress: 0,
      volume: 1,
      playbackRate: 1,
      quality: 'auto',
      watchHistory: {},
      episodeTimes: {},

      setAnime: (animeId) => set({ currentAnimeId: animeId }),
      setEpisode: (episode) => set({ currentEpisode: episode, progress: 0 }),
      setSource: (source) => set({ currentSource: source }),
      setTranslation: (translation) => set({ currentTranslation: translation }),
      setTranslations: (translations) => set({ translations }),
      setEpisodes: (episodes) => set({ episodes }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setProgress: (progress) => set({ progress }),
      setVolume: (volume) => set({ volume }),
      setPlaybackRate: (rate) => set({ playbackRate: rate }),
      setQuality: (quality) => set({ quality }),

      saveProgress: (animeId, episode, progress, title, poster) => {
        set((state) => ({
          watchHistory: {
            ...state.watchHistory,
            [animeId.toString()]: {
              ...state.watchHistory[animeId.toString()],
              episode,
              progress,
              ...(title && { title }),
              ...(poster && { poster }),
              lastWatched: new Date().toISOString(),
            },
          },
        }));
      },

      getProgress: (animeId) => {
        const { watchHistory } = get();
        return watchHistory[animeId.toString()] || null;
      },

      saveEpisodeTime: (animeId, episode, time) => {
        set((state) => ({
          episodeTimes: {
            ...state.episodeTimes,
            [`${animeId}-${episode}`]: time,
          },
        }));
      },

      getEpisodeTime: (animeId, episode) => {
        const { episodeTimes } = get();
        return episodeTimes[`${animeId}-${episode}`] ?? null;
      },
    }),
    {
      name: 'player-storage',
      partialize: (state) => ({
        volume: state.volume,
        playbackRate: state.playbackRate,
        quality: state.quality,
        watchHistory: state.watchHistory,
        episodeTimes: state.episodeTimes,
      }),
    }
  )
);
