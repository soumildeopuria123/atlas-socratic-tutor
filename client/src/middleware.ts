import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'atlas_token';
const AUTH_PAGES = new Set(['/login', '/signup']);

/**
 * Edge gate. It checks for the httpOnly session cookie and bounces unauthenticated
 * visitors before any protected page ships HTML. Signature and expiry are
 * re-verified by the API on every request, so a forged cookie grants nothing
 * beyond a rendered shell.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (AUTH_PAGES.has(pathname)) {
    // Signed-in visitors skip the portal; signed-out visitors must be allowed
    // through, otherwise the gate redirects to itself in a loop.
    return hasSession
      ? NextResponse.redirect(new URL('/', request.url))
      : NextResponse.next();
  }

  if (!hasSession) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/chat/:path*', '/assessment/:path*', '/srs/:path*', '/login', '/signup'],
};
