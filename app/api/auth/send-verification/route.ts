import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import { nanoid } from 'nanoid'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST() {
	try {
		const userSession = await getServerUser()

		if (!userSession?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// 5 verification emails per hour per user
		const rateLimitResponse = checkRateLimit(`send-verification:${userSession.id}`, 5, 60 * 60 * 1000)
		if (rateLimitResponse) return rateLimitResponse

		const user = await prisma.user.findUnique({
			where: { userId: userSession.id },
			select: { email: true, name: true, emailVerified: true }
		})

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 })
		}

		if (user.emailVerified) {
			return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
		}

		const token = nanoid(40)
		const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

		// Upsert: delete existing token for this email then create new one
		await prisma.verificationToken.deleteMany({
			where: { identifier: user.email }
		})

		await prisma.verificationToken.create({
			data: {
				identifier: user.email,
				token,
				expires
			}
		})

		const result = await sendVerificationEmail({
			email: user.email,
			token,
			name: user.name ?? undefined
		})

		if (!result.success) {
			return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Send verification error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
