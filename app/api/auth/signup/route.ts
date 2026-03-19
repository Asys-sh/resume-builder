import { hash } from '@node-rs/argon2'
import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, name, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'MissingFields', message: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'WeakPassword', message: 'Password must be at least 8 characters' }, { status: 400 })
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: 'WeakPassword', message: 'Password must contain at least one uppercase letter' }, { status: 400 })
    }
    if (!/[a-z]/.test(password)) {
      return NextResponse.json({ error: 'WeakPassword', message: 'Password must contain at least one lowercase letter' }, { status: 400 })
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'WeakPassword', message: 'Password must contain at least one number' }, { status: 400 })
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json({ error: 'WeakPassword', message: 'Password must contain at least one special character' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'InvalidEmail', message: 'Please enter a valid email address' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'UserExists', message: 'An account with this email already exists' }, { status: 409 })
    }

    const hashedPassword = await hash(password)

    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
      },
    })

    await prisma.password.create({
      data: {
        userId: user.id,
        email,
        hash: hashedPassword,
      },
    })

    // Create verification token and send email
    const token = nanoid(48)
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })

    await sendVerificationEmail({ email, token, name: name || undefined })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'InternalError', message: 'An unexpected error occurred' }, { status: 500 })
  }
}
