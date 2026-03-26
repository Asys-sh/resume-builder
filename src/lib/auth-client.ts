/**
 * Client-side auth helpers that work without SessionProvider.
 * next-auth/react's signIn/signOut require SessionProvider for CSRF tokens.
 * These helpers fetch the CSRF token directly from the API.
 */

async function getCsrfToken(): Promise<string> {
  const res = await fetch('/api/auth/csrf')
  const data = await res.json()
  return data.csrfToken
}

export async function handleSignIn(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const csrfToken = await getCsrfToken()

  const res = await fetch('/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      json: 'true',
    }),
    redirect: 'follow',
  })

  if (res.ok) {
    // Check if auth.js returned an error via URL params (redirect to error page)
    const url = new URL(res.url)
    if (url.searchParams.get('error')) {
      return { ok: false, error: 'CredentialsSignin' }
    }
    return { ok: true }
  }

  return { ok: false, error: 'CredentialsSignin' }
}

export async function handleGoogleSignIn(callbackUrl = '/dashboard'): Promise<void> {
  const { signIn } = await import('next-auth/react')
  await signIn('google', { callbackUrl })
}

export async function handleSignOut(): Promise<void> {
  const { signOut } = await import('next-auth/react')
  await signOut({ callbackUrl: '/' })
}
