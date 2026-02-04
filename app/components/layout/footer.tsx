import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">L</span>
              </div>
              <span className="text-xl font-bold text-foreground">LuWatch</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Смотрите фильмы, сериалы и аниме онлайн бесплатно
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Навигация</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Главная
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Каталог
                </Link>
              </li>
              <li>
                <Link
                  href="/search?status=ongoing"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Онгоинги
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Жанры</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/search?genre=action"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Экшен
                </Link>
              </li>
              <li>
                <Link
                  href="/search?genre=romance"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Романтика
                </Link>
              </li>
              <li>
                <Link
                  href="/search?genre=comedy"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Комедия
                </Link>
              </li>
              <li>
                <Link
                  href="/search?genre=fantasy"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Фэнтези
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Ещё</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/profile"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Избранное
                </Link>
              </li>
              <li>
                <Link
                  href="/profile?tab=history"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  История
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} LuWatch. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
