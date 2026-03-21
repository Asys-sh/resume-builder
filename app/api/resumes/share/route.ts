import { type NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { ResumeShareSchema, parseBody } from '@/lib/schemas'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: body, error } = await parseBody(req, ResumeShareSchema)
    if (error) return error

    // Verify ownership
    const resume = await prisma.resume.findUnique({
      where: { id: body.resumeId, userId: user.id },
      select: { id: true, isPublic: true, publicSlug: true },
    })

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    let publicSlug = resume.publicSlug

    if (body.isPublic) {
      // Generate slug if we don't have one yet
      if (!publicSlug) {
        // Retry up to 3 times on unique collision
        for (let attempt = 0; attempt < 3; attempt++) {
          const candidate = nanoid(10)
          const existing = await prisma.resume.findUnique({
            where: { publicSlug: candidate },
            select: { id: true },
          })
          if (!existing) {
            publicSlug = candidate
            break
          }
        }
        if (!publicSlug) {
          return NextResponse.json(
            { error: 'Failed to generate unique link. Please try again.' },
            { status: 500 },
          )
        }
      }
    } else {
      // Revoke: clear the slug so old links immediately 404
      publicSlug = null
    }

    await prisma.resume.update({
      where: { id: resume.id },
      data: {
        isPublic: body.isPublic,
        publicSlug,
        hideContactInfo: body.hideContactInfo ?? true,
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
    const shareUrl = publicSlug ? `${baseUrl}/r/${publicSlug}` : null

    return NextResponse.json({ publicSlug, shareUrl })
  } catch (error) {
    console.error('Error updating share settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
