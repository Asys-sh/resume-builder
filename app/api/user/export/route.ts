import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { RATE_LIMIT_USER_EXPORT } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET() {
  try {
    const userSession = await getServerUser()

    if (!userSession?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = checkRateLimit('export:' + userSession.id, RATE_LIMIT_USER_EXPORT.max, RATE_LIMIT_USER_EXPORT.window)
    if (limited) return limited

    const user = await prisma.user.findUnique({
      where: { id: userSession.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        subscriptionStatus: true,
        usageCount: true,
        usageLimit: true,
        resumes: {
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            title: true,
            summary: true,
            contactInfo: true,
            template: true,
            parentResumeId: true,
            tailoredFor: true,
            isPublic: true,
            publicSlug: true,
            hideContactInfo: true,
            viewCount: true,
            experiences: {
              select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                company: true,
                role: true,
                startDate: true,
                endDate: true,
                description: true,
                location: true,
              },
            },
            skills: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
            education: {
              select: {
                id: true,
                school: true,
                degree: true,
                fieldOfStudy: true,
                startDate: true,
                endDate: true,
                gpa: true,
              },
            },
            projects: {
              select: {
                id: true,
                title: true,
                description: true,
                link: true,
                technologies: true,
                startDate: true,
                endDate: true,
              },
            },
            certifications: {
              select: {
                id: true,
                name: true,
                issuer: true,
                date: true,
              },
            },
            languages: {
              select: {
                id: true,
                name: true,
                proficiency: true,
              },
            },
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
