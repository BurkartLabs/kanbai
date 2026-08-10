import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


const SESSION_COOKIE = 'kanbai_session';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = pathname === '/manage/login';

  if (!hasCookie && !isLogin) {
    const url = new URL('/manage/login', request.url);
    url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }

  // Deliberately do NOT redirect /manage/login → /manage when a cookie is
  // present: the proxy runs on the edge and can't verify the session against
  // MariaDB. If the cookie is stale, verifySession() on /manage would bounce
  // back to /manage/login, and this branch would bounce it right back — a
  // classic redirect loop. The login page's optionalSession() check handles
  // the "already signed in" case with a real DB lookup.
  return NextResponse.next();
}

export const config = {
  matcher: ['/manage/:path*'],
};
