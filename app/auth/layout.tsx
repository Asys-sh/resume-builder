import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — RoboResume',
  description:
    'Sign in or create a free RoboResume account to start building your AI-powered resume.',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
