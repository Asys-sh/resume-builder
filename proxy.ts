import { getToken } from '@auth/core/jwt'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

const COOKIE_NAME = 'authjs.session-token'

async function isSessionValid(request: NextRequest): Promise<boolean> {
  const cookieVal = request.cookies.get(COOKIE_NAME)?.value
  if (!cookieVal) return false

  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET!,
      cookieName: COOKIE_NAME,
      salt: COOKIE_NAME,
      secureCookie: process.env.NODE_ENV === 'production',
    })
    return !!token
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate-limit auth API endpoints — 10 attempts per 15 minutes per IP.
  // Protects sign-in and sign-up from brute-force and credential-stuffing.
  if (pathname.startsWith('/api/auth/')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown'
    const limited = checkRateLimit(`auth:${ip}`, 10, 15 * 60 * 1_000)
    if (limited) return limited as unknown as NextResponse
  }

  // Pass through all other API routes without auth checks
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const protectedRoutes = ['/dashboard', '/success', '/builder', '/cancel']
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = pathname.startsWith('/auth')

  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next()
  }

  const isAuthenticated = await isSessionValid(request)

  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('login', 'true')
    return NextResponse.redirect(url)
  }

  if (pathname === '/success' && !request.nextUrl.searchParams.has('session_id')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const isRscRequest =
    request.headers.get('rsc') === '1' || request.nextUrl.searchParams.has('_rsc')
  if (isAuthRoute && isAuthenticated && !isRscRequest) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Include /api/auth/* for rate limiting; exclude other API routes and static assets
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
