import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import { getSession } from '@robojs/auth/client'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { JotaiProvider } from '@/components/JotaiProvider'
import { getUserData } from '@/lib/auth-helper'
import { validateEnv } from '@/lib/env'
import { Toaster } from 'sonner'
import CookieBanner from '@/components/CookieBanner'

validateEnv()

const spaceGrotesk = Space_Grotesk({
	weight: ['400', '500', '700'],
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-display'
})

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://resume.dev'

export const metadata: Metadata = {
	title: 'RoboResume - AI-Powered Resume Builder',
	description: 'Create ATS-friendly resumes in under 7 minutes with AI assistance. Free to start, no credit card required.',
	metadataBase: new URL(baseUrl),
	openGraph: {
		title: 'RoboResume - AI-Powered Resume Builder',
		description: 'Create ATS-friendly resumes in under 7 minutes with AI assistance. Free to start.',
		url: baseUrl,
		siteName: 'RoboResume',
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'RoboResume - AI-Powered Resume Builder',
		description: 'Create ATS-friendly resumes in under 7 minutes with AI assistance. Free to start.',
	}
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const user = await getUserData()
	return (
		<html lang="en">
			<head>
				<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
			</head>
			<body className={`${spaceGrotesk.className} font-display antialiased`}>
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:font-semibold"
				>
					Skip to content
				</a>
				<JotaiProvider initialUser={user}>
					<main id="main-content" className="min-h-screen">{children}</main>
				</JotaiProvider>
				<CookieBanner />
			<Toaster
					position="bottom-right"
					richColors
					closeButton
					toastOptions={{
						style: { fontFamily: 'var(--font-display)' },
						duration: 4000
					}}
				/>
			</body>
		</html>
	)
}
