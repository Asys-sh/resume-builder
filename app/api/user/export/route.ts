import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const userSession = await getServerUser()

    if (!userSession?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userSession.id },
      omit: { password: true },
      include: {
        resumes: {
          include: {
            experiences: true,
            skills: true,
            education: true,
            projects: true,
            certifications: true,
            languages: true,
          },
        },
        coverLetters: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
