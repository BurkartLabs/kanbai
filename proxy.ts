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

  if (hasCookie && isLogin) {
    return NextResponse.redirect(new URL('/manage', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/manage/:path*'],
};
