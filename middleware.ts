import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from '@auth/core/jwt'

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
			secureCookie: false
		})
		return !!token
	} catch {
		return false
	}
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl

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

	const isRscRequest = request.headers.get('rsc') === '1' || request.nextUrl.searchParams.has('_rsc')
	if (isAuthRoute && isAuthenticated && !isRscRequest) {
		return NextResponse.redirect(new URL('/dashboard', request.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: [
		'/((?!api|_next/static|_next/image|favicon.ico).*)'
	]
}
