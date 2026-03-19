import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const email = req.nextUrl.searchParams.get('email')
  const base = req.nextUrl.origin

  if (!token || !email) {
    return NextResponse.redirect(`${base}/verify-email?error=MissingParams`)
  }

  try {
    const record = await prisma.verificationToken.findFirst({
      where: { identifier: email, token },
    })

    if (!record || record.expires < new Date()) {
      return NextResponse.redirect(`${base}/verify-email?error=InvalidOrExpired`)
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.redirect(`${base}/verify-email?error=UserNotFound`)
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } },
      }),
    ])

    return NextResponse.redirect(`${base}/verify-email?verified=1`)
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(`${base}/verify-email?error=InternalError`)
  }
}
