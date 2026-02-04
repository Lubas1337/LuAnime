import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LuWatch - Смотреть фильмы, сериалы и аниме онлайн',
  description:
    'Смотрите фильмы, сериалы и аниме онлайн бесплатно в HD качестве. Большой каталог с озвучкой.',
  keywords: ['фильмы', 'сериалы', 'аниме', 'смотреть онлайн', 'кино'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
