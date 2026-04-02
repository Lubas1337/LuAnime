'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useEffect } from 'react';

const ACCENT_KEY = 'luwatch-accent';

function AccentInitializer() {
  useEffect(() => {
    const accent = localStorage.getItem(ACCENT_KEY);
    if (accent && accent !== 'violet') {
      document.documentElement.setAttribute('data-accent', accent);
    }
  }, []);
  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AccentInitializer />
      {children}
    </NextThemesProvider>
  );
}
