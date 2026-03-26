import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { RATE_LIMIT_PASSWORD_RESET_REQUEST } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limited = checkRateLimit('password-reset-request:' + ip, RATE_LIMIT_PASSWORD_RESET_REQUEST.max, RATE_LIMIT_PASSWORD_RESET_REQUEST.window)
    if (limited) return limited

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Always return 200 to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Invalidate any existing unused tokens for this email
    await prisma.passwordResetToken.updateMany({
      where: { email, used: false },
      data: { used: true },
    })

    const token = nanoid(48)
    const expires = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    await prisma.passwordResetToken.create({
      data: { email, token, expires },
    })

    await sendPasswordResetEmail({ email, token, name: user.name || undefined })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
