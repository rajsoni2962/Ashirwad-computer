import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionTokenEdge } from './lib/auth-edge';

// Public static assets and files that never require authentication
const PUBLIC_FILE = /\.(.*)$/;

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Allow static Next.js assets, favicons, brand images, and public uploads
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/brand') ||
    pathname.startsWith('/uploads') ||
    pathname === '/favicon.ico' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Allow public auth API routes
  if (
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout' ||
    pathname === '/api/auth/me'
  ) {
    return NextResponse.next();
  }

  // Extract session token from cookie or Authorization header
  let token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  const payload = token ? await verifySessionTokenEdge(token) : null;
  const isAuthenticated = Boolean(payload && payload.userId);

  // 3. If accessing the login page
  if (pathname === '/login') {
    if (isAuthenticated) {
      // Already logged in, redirect to dashboard or requested URL
      const redirectParam = request.nextUrl.searchParams.get('redirect') || '/dashboard';
      return NextResponse.redirect(new URL(redirectParam, request.url));
    }
    return NextResponse.next();
  }

  // 4. Public website and inquiries
  if (pathname === '/' || pathname === '/api/contact') {
    return NextResponse.next();
  }

  // Allow read-only public GET requests for product catalog, serial lookup, and settings
  if (
    request.method.toUpperCase() === 'GET' &&
    (pathname === '/api/products' ||
      pathname === '/api/serial-numbers' ||
      pathname === '/api/settings')
  ) {
    return NextResponse.next();
  }

  // 5. Protect API mutation endpoints (POST, PUT, DELETE, PATCH)
  if (pathname.startsWith('/api/')) {
    const method = request.method.toUpperCase();
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

    if (isMutation && !isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Authentication required to perform this action.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // 6. Protect all ERP application management and billing pages
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
