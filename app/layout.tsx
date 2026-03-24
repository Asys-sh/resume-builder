import type { Metadata } from 'next'
import { Roboto_Flex } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import CookieBanner from '@/components/CookieBanner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { JotaiProvider } from '@/components/JotaiProvider'
import { getUserData } from '@/lib/auth-helper'
import '@/lib/env' // validates env vars on server startup — throws if invalid

const robotoFlex = Roboto_Flex({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://resume.asys.sh'

export const metadata: Metadata = {
  title: 'RoboResume - AI-Powered Resume Builder',
  description:
    'Create ATS-friendly resumes in under 7 minutes with AI assistance. Free to start, no credit card required.',
  metadataBase: new URL(baseUrl),
  openGraph: {
    title: 'RoboResume - AI-Powered Resume Builder',
    description:
      'Create ATS-friendly resumes in under 7 minutes with AI assistance. Free to start.',
    url: baseUrl,
    siteName: 'RoboResume',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RoboResume - AI-Powered Resume Builder',
    description:
      'Create ATS-friendly resumes in under 7 minutes with AI assistance. Free to start.',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserData()
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>
      <body className={`${robotoFlex.className} font-display antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:font-semibold"
        >
          Skip to content
        </a>
        <JotaiProvider initialUser={user}>
          <ErrorBoundary>
            <main id="main-content" className="min-h-screen">
              {children}
            </main>
          </ErrorBoundary>
        </JotaiProvider>
        <CookieBanner />
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
              fontWeight: 500,
              padding: '14px 18px',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
            },
            duration: 3500,
          }}
        />
      </body>
    </html>
  )
}
