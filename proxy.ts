import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register'];
const PROTECTED_PREFIXES = ['/api/videos', '/api/upload', '/api/dashboard', '/api/stream', '/upload', '/videos', '/dashboard'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.endsWith('.svg') || pathname.endsWith('.png')) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    || request.cookies.get('token')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    verifyToken(token);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith('/api/')) {
      return Response.json({ error: 'Token invalido' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
};
