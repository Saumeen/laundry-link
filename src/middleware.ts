import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /protected)
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath =
    path === '/' ||
    path === '/register' ||
    path === '/registerlogin' ||
    path === '/login' ||
    path === '/admin/login' ||
    path === '/privacy-policy' ||
    path === '/terms-and-conditions' ||
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/favicon.ico') ||
    path.startsWith('/pricing') ||
    path.startsWith('/services') ||
    path.startsWith('/schedule') ||
    path.startsWith('/tracking') ||
    path.startsWith('/faq') ||
    path.startsWith('/order-success/') ||
    path.startsWith('/images/') ||
    path.startsWith('/laundry-link-logo.png') ||
    path.startsWith('/laundry-link-main.png');

  // Check if the path is public
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Get the token to check authentication and user type
  const token = await getToken({ req: request });

  // Check for admin routes
  if (path.startsWith('/admin/') && path !== '/admin/login') {
    // Admin routes require admin authentication
    if (!token || token.userType !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // Check for customer routes
  if (path.startsWith('/customer/')) {
    // Customer routes require customer authentication
    if (!token || token.userType !== 'customer') {
      return NextResponse.redirect(new URL('/registerlogin', request.url));
    }
    return NextResponse.next();
  }

  // For other protected routes, check for NextAuth session
  if (!token) {
    // Redirect to login if no valid session
    return NextResponse.redirect(new URL('/registerlogin', request.url));
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
