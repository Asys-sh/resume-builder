import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
	try {
		const { token, email } = await request.json()

		if (!token || !email) {
			return NextResponse.json({ error: 'Token and email are required' }, { status: 400 })
		}

		const verificationToken = await prisma.verificationToken.findUnique({
			where: { token }
		})

		if (!verificationToken) {
			return NextResponse.json({ error: 'Invalid or expired verification link' }, { status: 400 })
		}

		if (verificationToken.identifier !== email) {
			return NextResponse.json({ error: 'Invalid verification link' }, { status: 400 })
		}

		if (verificationToken.expires < new Date()) {
			await prisma.verificationToken.delete({ where: { token } })
			return NextResponse.json({ error: 'Verification link has expired. Please request a new one.' }, { status: 400 })
		}

		// Mark email as verified and delete the token
		await prisma.$transaction([
			prisma.user.update({
				where: { email },
				data: { emailVerified: new Date() }
			}),
			prisma.verificationToken.delete({ where: { token } })
		])

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Verify email error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
