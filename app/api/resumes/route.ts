import { type NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { ResumeBodySchema, parseBody } from '@/lib/schemas'
import { sanitizeResumeData } from '@/lib/sanitize'

export async function DELETE(req: NextRequest) {
  try {
    const reqUrl = req.url
    const url = new URL(reqUrl)
    const resumeId = url.searchParams.get('resumeId')
    const user = await getServerUser()

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!resumeId) {
      return NextResponse.json({ error: 'Missing resume ID' }, { status: 400 })
    }

    const existing = await prisma.resume.findUnique({
      where: { id: resumeId, userId: user.id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    await prisma.resume.delete({ where: { id: resumeId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting resume:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reqUrl = req.url
    const url = new URL(reqUrl)
    const resumeId = url.searchParams.get('resumeId')

    // No resumeId = paginated list mode
    if (!resumeId) {
      const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
      const limit = 12
      const skip = (page - 1) * limit

      const [resumes, total] = await Promise.all([
        prisma.resume.findMany({
          where: { userId: user.id },
          select: { id: true, title: true, updatedAt: true, template: true, contactInfo: true },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.resume.count({ where: { userId: user.id } }),
      ])

      return NextResponse.json({ resumes, total, hasMore: skip + resumes.length < total })
    }

    const resume = await prisma.resume.findUnique({
      where: {
        id: resumeId,
        userId: user.id,
      },
    })

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    return NextResponse.json(resume)
  } catch (error) {
    console.error('Error fetching resume:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: body, error } = await parseBody(req, ResumeBodySchema)
    if (error) return error

    const { resumeId, title } = body
    const data = body.data ? sanitizeResumeData(body.data as any) : null

    if (!data) {
      return NextResponse.json({ error: 'Missing resume data' }, { status: 400 })
    }

    const resume = resumeId
      ? // Update existing resume
        await prisma.resume.update({
          where: {
            id: resumeId,
            userId: user.id,
          },
          data: {
            title: title || undefined,
            summary: data.summary,
            contactInfo: data.contactInfo as any,
            template: data.selectedTemplate,
          },
        })
      : // Create new resume
        await prisma.resume.create({
          data: {
            user: {
              connect: { id: user.id },
            },
            title: title || data.contactInfo.fullName || 'Untitled Resume',
            summary: data.summary,
            contactInfo: data.contactInfo as any,
            template: data.selectedTemplate,
          },
        })

    const newResumeId = resume.id

    // Helper for Smart Sync — must run inside a transaction (receives tx client)
    const syncRelated = async (model: any, items: any[], foreignKey: string) => {
      const existingItems = await model.findMany({
        where: { [foreignKey]: newResumeId },
        select: { id: true },
      })
      const existingIds = new Set(existingItems.map((i: any) => i.id))
      const incomingIds = new Set(
        items.map((i) => i.id).filter((id: string) => id && existingIds.has(id)),
      )

      const toDelete = [...existingIds].filter((id) => !incomingIds.has(id))
      if (toDelete.length > 0) {
        await model.deleteMany({ where: { id: { in: toDelete } } })
      }

      for (const item of items) {
        const { id, ...rest } = item
        if (id && existingIds.has(id)) {
          await model.update({ where: { id }, data: rest })
        } else {
          await model.create({ data: { ...rest, [foreignKey]: newResumeId } })
        }
      }
    }

    // Execute all syncs in a single transaction — if any step fails the
    // entire operation rolls back, preventing partial/corrupt resume state.
    await prisma.$transaction(async (tx) => {
      await Promise.all([
        syncRelated(tx.experience, data.experiences, 'resumeId'),
        syncRelated(tx.education, data.education, 'resumeId'),
        syncRelated(tx.skill, data.skills, 'resumeId'),
        syncRelated(tx.project, data.projects, 'resumeId'),
        syncRelated(tx.certification, data.certifications, 'resumeId'),
        syncRelated(tx.language, data.languages, 'resumeId'),
      ])
    })

    return NextResponse.json({ success: true, resumeId: newResumeId })
  } catch (error) {
    console.error('Error saving resume:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
