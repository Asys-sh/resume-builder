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

validateEnv()

const spaceGrotesk = Space_Grotesk({
	weight: ['400', '500', '700'],
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-display'
})

export const metadata: Metadata = {
	title: 'RoboResume - AI-Powered Resume Builder',
	description: 'Create ATS-friendly resumes in under 7 minutes with AI assistance'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const user = await getUserData()
	return (
		<html lang="en">
			<head>
				<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
			</head>
			<body className={`${spaceGrotesk.className} font-display antialiased`}>
				<JotaiProvider initialUser={user}>
					<main className="min-h-screen">{children}</main>
				</JotaiProvider>
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
