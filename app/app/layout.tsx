import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'cyrillic'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = 'https://watch.lubax.net';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'LuWatch - Смотреть фильмы, сериалы и аниме онлайн бесплатно',
    template: '%s | LuWatch',
  },
  description:
    'Смотрите фильмы, сериалы и аниме онлайн бесплатно в HD качестве. Большой каталог с русской озвучкой. Новинки кино 2024-2025.',
  keywords: [
    'фильмы онлайн',
    'сериалы онлайн',
    'аниме онлайн',
    'смотреть бесплатно',
    'кино онлайн',
    'HD качество',
    'русская озвучка',
    'новинки кино',
    'LuWatch',
  ],
  authors: [{ name: 'LuWatch' }],
  creator: 'LuWatch',
  publisher: 'LuWatch',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: siteUrl,
    siteName: 'LuWatch',
    title: 'LuWatch - Смотреть фильмы, сериалы и аниме онлайн бесплатно',
    description:
      'Смотрите фильмы, сериалы и аниме онлайн бесплатно в HD качестве. Большой каталог с русской озвучкой.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LuWatch - Онлайн кинотеатр',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LuWatch - Смотреть фильмы, сериалы и аниме онлайн',
    description:
      'Смотрите фильмы, сериалы и аниме онлайн бесплатно в HD качестве.',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'your-google-verification-code', // Add your Google Search Console verification
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'entertainment',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#8b5cf6" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
