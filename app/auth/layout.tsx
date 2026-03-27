import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — Landed',
  description:
    'Sign in or create a free Landed account to start building your AI-powered resume.',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
