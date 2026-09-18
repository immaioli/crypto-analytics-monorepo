import createMiddleware from 'next-intl/middleware';
import { locales } from '@/i18n';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Rewrite short '/en' to '/en-US' to support tests using '/en'
  if (pathname === '/en' || pathname === '/en/') {
    const url = req.nextUrl.clone();
    url.pathname = '/en-US';
    return NextResponse.redirect(url);
  }
  // Fallback to next-intl middleware for proper locale handling
  return createMiddleware({ locales, defaultLocale: 'en-US', localePrefix: 'always', localeDetection: false })(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};