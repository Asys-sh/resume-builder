import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUserData } from '@/lib/auth-helper'

export const metadata: Metadata = {
  title: 'Resume Builder — Landed',
  description: 'Build your professional resume step-by-step with AI-powered suggestions.',
}

export default async function BuilderLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserData()

  if (user && !user.emailVerified) {
    redirect('/verify-email?pending=1')
  }

  return <>{children}</>
}
