// Kinopoisk genre IDs
export const MOVIE_GENRES = [
  { id: 1, name: 'Триллер' },
  { id: 2, name: 'Драма' },
  { id: 3, name: 'Криминал' },
  { id: 4, name: 'Мелодрама' },
  { id: 5, name: 'Детектив' },
  { id: 6, name: 'Фантастика' },
  { id: 7, name: 'Приключения' },
  { id: 8, name: 'Биография' },
  { id: 9, name: 'Фильм-нуар' },
  { id: 10, name: 'Вестерн' },
  { id: 11, name: 'Боевик' },
  { id: 12, name: 'Фэнтези' },
  { id: 13, name: 'Комедия' },
  { id: 14, name: 'Военный' },
  { id: 15, name: 'История' },
  { id: 16, name: 'Музыка' },
  { id: 17, name: 'Ужасы' },
  { id: 18, name: 'Мультфильм' },
  { id: 19, name: 'Семейный' },
  { id: 20, name: 'Мюзикл' },
  { id: 21, name: 'Спорт' },
  { id: 22, name: 'Документальный' },
  { id: 23, name: 'Короткометражка' },
  { id: 24, name: 'Аниме' },
];

export const ANIME_GENRES = [
  { id: 1, name: 'Экшен' },
  { id: 2, name: 'Приключения' },
  { id: 3, name: 'Комедия' },
  { id: 4, name: 'Драма' },
  { id: 5, name: 'Фэнтези' },
  { id: 6, name: 'Романтика' },
  { id: 7, name: 'Школа' },
  { id: 8, name: 'Сёнен' },
  { id: 9, name: 'Меха' },
  { id: 10, name: 'Психология' },
  { id: 11, name: 'Сверхъестественное' },
  { id: 12, name: 'Ужасы' },
  { id: 13, name: 'Спорт' },
  { id: 14, name: 'Музыка' },
  { id: 15, name: 'Повседневность' },
];

export const COUNTRIES = [
  { id: 1, name: 'США' },
  { id: 2, name: 'Швейцария' },
  { id: 3, name: 'Франция' },
  { id: 5, name: 'Великобритания' },
  { id: 6, name: 'Испания' },
  { id: 7, name: 'Италия' },
  { id: 8, name: 'Германия' },
  { id: 9, name: 'Россия' },
  { id: 21, name: 'Корея Южная' },
  { id: 49, name: 'Япония' },
];

export const SORT_OPTIONS = {
  anime: [
    { value: 'popular', label: 'По популярности' },
    { value: 'rating', label: 'По рейтингу' },
    { value: 'newest', label: 'Новинки' },
  ],
  movies: [
    { value: 'NUM_VOTE', label: 'По популярности' },
    { value: 'RATING', label: 'По рейтингу' },
    { value: 'YEAR', label: 'По году' },
  ],
  series: [
    { value: 'NUM_VOTE', label: 'По популярности' },
    { value: 'RATING', label: 'По рейтингу' },
    { value: 'YEAR', label: 'По году' },
  ],
} as const;

export const ANIME_STATUS = [
  { value: 'ongoing', label: 'Онгоинг' },
  { value: 'released', label: 'Вышел' },
  { value: 'announced', label: 'Анонс' },
];

export const RATING_OPTIONS = [
  { value: 0, label: 'Любой' },
  { value: 7, label: '7+' },
  { value: 8, label: '8+' },
  { value: 9, label: '9+' },
];

// Years from 1990 to current year
export const YEARS = Array.from(
  { length: new Date().getFullYear() - 1989 },
  (_, i) => new Date().getFullYear() - i
);

export type CatalogCategory = 'anime' | 'movies' | 'series';
export type SortOption = typeof SORT_OPTIONS[CatalogCategory][number]['value'];
