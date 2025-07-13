import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /protected)
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || 
    path === '/register' || 
    path === '/registerlogin' || 
    path === '/login' || 
    path === '/admin/login' ||
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/favicon.ico') ||
    path.startsWith('/pricing') ||
    path.startsWith('/services') ||
    path.startsWith('/schedule') ||
    path.startsWith('/tracking') ||
    path.startsWith('/faq')

  // Check if the path is public
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check for admin routes
  if (path.startsWith('/admin/') && path !== '/admin/login') {
    // For admin routes, we'll let the individual pages handle authentication
    // since we're using NextAuth for admin auth
    return NextResponse.next()
  }

  // For customer routes, let the individual pages handle authentication
  // since we use NextAuth for customer authentication
  if (path.startsWith('/customer/')) {
    return NextResponse.next()
  }

  // For other protected routes, check for NextAuth session
  const token = await getToken({ req: request })

  if (!token) {
    // Redirect to login if no valid session
    return NextResponse.redirect(new URL('/registerlogin', request.url))
  }

  return NextResponse.next()
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
} 