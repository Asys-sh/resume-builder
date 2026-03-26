import { signIn, signOut } from 'next-auth/react'

export async function handleSignIn(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await signIn('credentials', {
    email,
    password,
    redirect: false,
  })

  if (res?.error) {
    return { ok: false, error: 'CredentialsSignin' }
  }

  return { ok: true }
}

export async function handleGoogleSignIn(callbackUrl = '/dashboard'): Promise<void> {
  await signIn('google', { callbackUrl })
}

export async function handleSignOut(): Promise<void> {
  await signOut({ callbackUrl: '/' })
}
