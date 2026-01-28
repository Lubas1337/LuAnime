import { AnimeCard } from './anime-card';
import type { Anime } from '@/types/anime';

interface AnimeGridProps {
  anime: Anime[];
  columns?: 2 | 3 | 4 | 5 | 6;
}

export function AnimeGrid({ anime, columns = 5 }: AnimeGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {anime.map((item, index) => (
        <div
          key={item.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
        >
          <AnimeCard anime={item} />
        </div>
      ))}
    </div>
  );
}
