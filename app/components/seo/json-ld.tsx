export function WebsiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LuWatch',
    alternateName: ['LuWatch Online Cinema', 'ЛуВотч'],
    url: 'https://watch.lubax.net',
    description:
      'Смотрите фильмы, сериалы и аниме онлайн бесплатно в HD качестве',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://watch.lubax.net/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'ru-RU',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LuWatch',
    url: 'https://watch.lubax.net',
    logo: 'https://watch.lubax.net/logo.png',
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface MovieJsonLdProps {
  name: string;
  description?: string;
  image?: string;
  datePublished?: string;
  director?: string;
  genre?: string[];
  aggregateRating?: {
    ratingValue: number;
    ratingCount: number;
  };
}

export function MovieJsonLd({
  name,
  description,
  image,
  datePublished,
  director,
  genre,
  aggregateRating,
}: MovieJsonLdProps) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name,
    description,
    image,
    datePublished,
    director: director
      ? {
          '@type': 'Person',
          name: director,
        }
      : undefined,
    genre,
  };

  if (aggregateRating) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      ratingCount: aggregateRating.ratingCount,
      bestRating: 10,
      worstRating: 1,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface TVSeriesJsonLdProps {
  name: string;
  description?: string;
  image?: string;
  datePublished?: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  genre?: string[];
  aggregateRating?: {
    ratingValue: number;
    ratingCount: number;
  };
}

export function TVSeriesJsonLd({
  name,
  description,
  image,
  datePublished,
  numberOfSeasons,
  numberOfEpisodes,
  genre,
  aggregateRating,
}: TVSeriesJsonLdProps) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name,
    description,
    image,
    datePublished,
    numberOfSeasons,
    numberOfEpisodes,
    genre,
  };

  if (aggregateRating) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      ratingCount: aggregateRating.ratingCount,
      bestRating: 10,
      worstRating: 1,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
