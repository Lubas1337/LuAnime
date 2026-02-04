import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';

  // Redirect anime.lubax.net to watch.lubax.net
  if (host.includes('anime.lubax.net')) {
    const pathname = request.nextUrl.pathname;
    const search = request.nextUrl.search;
    const newUrl = `https://watch.lubax.net${pathname}${search}`;
    return NextResponse.redirect(newUrl, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and api
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
