import { hash } from '@node-rs/argon2'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ message: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters' }, { status: 400 })
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json({ message: 'Password must contain uppercase, lowercase, number, and special character' }, { status: 400 })
    }

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })

    if (!resetToken || resetToken.used || resetToken.expires < new Date()) {
      return NextResponse.json({ message: 'This reset link is invalid or has expired' }, { status: 400 })
    }

    const hashedPassword = await hash(password)

    await prisma.$transaction([
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      prisma.password.update({
        where: { email: resetToken.email },
        data: { hash: hashedPassword },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password reset confirm error:', error)
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 })
  }
}
