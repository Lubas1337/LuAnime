'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Heart } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SearchAutocomplete } from '@/components/search/search-autocomplete';

const navLinks = [
  { href: '/', label: 'Главная' },
  { href: '/search', label: 'Каталог' },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30">
              <span className="text-lg font-bold text-primary-foreground">L</span>
            </div>
            <span className="text-xl font-bold text-foreground transition-colors duration-300 group-hover:text-primary">LuAnime</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg hover:bg-primary/10 ${
                  pathname === link.href
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <SearchAutocomplete className="hidden md:block" />

          <Link
            href="/profile"
            className={`relative p-2 rounded-lg transition-all duration-200 hover:bg-primary/10 ${
              pathname === '/profile'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Heart className={`h-5 w-5 ${pathname === '/profile' ? 'fill-primary' : ''}`} />
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg animate-fade-in-down">
          <div className="container mx-auto p-4 space-y-4">
            <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
              <SearchAutocomplete
                className="w-full [&_input]:w-full"
                onSelect={() => setMobileMenuOpen(false)}
              />
            </div>

            <nav className="flex flex-col gap-2">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 animate-fade-in-up ${
                    pathname === link.href
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-1'
                  }`}
                  style={{ animationDelay: `${100 + index * 50}ms` }}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 animate-fade-in-up flex items-center gap-2 ${
                  pathname === '/profile'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-1'
                }`}
                style={{ animationDelay: '200ms' }}
              >
                <Heart className="h-4 w-4" />
                Избранное
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
