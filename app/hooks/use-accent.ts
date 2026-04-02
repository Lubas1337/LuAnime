import { useCallback, useSyncExternalStore } from 'react';

export const ACCENTS = [
  { name: 'violet', label: 'Violet', color: 'oklch(0.556 0.222 293)' },
  { name: 'blue', label: 'Blue', color: 'oklch(0.55 0.15 250)' },
  { name: 'green', label: 'Green', color: 'oklch(0.55 0.16 155)' },
  { name: 'orange', label: 'Orange', color: 'oklch(0.60 0.16 50)' },
  { name: 'rose', label: 'Rose', color: 'oklch(0.55 0.20 10)' },
] as const;

export type AccentName = (typeof ACCENTS)[number]['name'];

const ACCENT_KEY = 'luwatch-accent';
const DEFAULT_ACCENT: AccentName = 'violet';

let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): AccentName {
  if (typeof window === 'undefined') return DEFAULT_ACCENT;
  return (localStorage.getItem(ACCENT_KEY) as AccentName) || DEFAULT_ACCENT;
}

function getServerSnapshot(): AccentName {
  return DEFAULT_ACCENT;
}

export function useAccent() {
  const accent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setAccent = useCallback((name: AccentName) => {
    localStorage.setItem(ACCENT_KEY, name);
    if (name === 'violet') {
      document.documentElement.removeAttribute('data-accent');
    } else {
      document.documentElement.setAttribute('data-accent', name);
    }
    listeners.forEach((l) => l());
  }, []);

  return { accent, setAccent };
}
