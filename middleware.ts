import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const token = await getToken({ req });
  if (!token) return NextResponse.redirect(new URL('/registerlogin', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/account/:path*'] };
