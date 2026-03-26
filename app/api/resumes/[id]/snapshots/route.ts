import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerUser } from '@/lib/auth-helper'
import {
  RATE_LIMIT_SNAPSHOT_CREATE,
  SNAPSHOT_LABEL_MAX_LENGTH,
  SNAPSHOT_MAX_PER_RESUME,
} from '@/lib/constants'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { parseBody } from '@/lib/schemas'
import { sanitizeText } from '@/lib/sanitize'

const SnapshotCreateSchema = z.object({
  label: z.string().max(SNAPSHOT_LABEL_MAX_LENGTH).optional(),
})

async function getOwnedResume(resumeId: string, userId: string) {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId, userId },
    select: { id: true },
  })
  if (!resume) {
    return { resume: null, error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  }
  return { resume, error: null }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { error } = await getOwnedResume(id, user.id)
    if (error) return error

    const snapshots = await prisma.resumeSnapshot.findMany({
      where: { resumeId: id },
      select: { id: true, label: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(snapshots)
  } catch (error) {
    console.error('Error listing snapshots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { error: ownershipError } = await getOwnedResume(id, user.id)
    if (ownershipError) return ownershipError

    const limited = checkRateLimit('snapshot-create:' + user.id, RATE_LIMIT_SNAPSHOT_CREATE.max, RATE_LIMIT_SNAPSHOT_CREATE.window)
    if (limited) return limited

    const { data: body, error: parseError } = await parseBody(req, SnapshotCreateSchema)
    if (parseError) return parseError

    // Fetch full resume with all relations
    const resume = await prisma.resume.findUnique({
      where: { id, userId: user.id },
      include: {
        experiences: true,
        skills: true,
        education: true,
        projects: true,
        certifications: true,
        languages: true,
      },
    })

    if (!resume) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Strip internal fields — only store resume content
    const snapshotData = {
      title: resume.title,
      summary: resume.summary,
      template: resume.template,
      contactInfo: resume.contactInfo,
      tailoredFor: resume.tailoredFor,
      experiences: resume.experiences.map(({ company, role, startDate, endDate, description, location }) => ({ company, role, startDate, endDate, description, location })),
      skills: resume.skills.map(({ name, level }) => ({ name, level })),
      education: resume.education.map(({ school, degree, fieldOfStudy, startDate, endDate, gpa }) => ({ school, degree, fieldOfStudy, startDate, endDate, gpa })),
      projects: resume.projects.map(({ title, description, link, technologies, startDate, endDate }) => ({ title, description, link, technologies, startDate, endDate })),
      certifications: resume.certifications.map(({ name, issuer, date }) => ({ name, issuer, date })),
      languages: resume.languages.map(({ name, proficiency }) => ({ name, proficiency })),
    }

    const snapshot = await prisma.$transaction(async (tx) => {
      const count = await tx.resumeSnapshot.count({ where: { resumeId: id } })
      if (count >= SNAPSHOT_MAX_PER_RESUME) {
        const oldest = await tx.resumeSnapshot.findFirst({
          where: { resumeId: id },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        })
        if (oldest) await tx.resumeSnapshot.delete({ where: { id: oldest.id } })
      }

      return tx.resumeSnapshot.create({
        data: {
          resumeId: id,
          data: snapshotData,
          label: body.label ? sanitizeText(body.label) : null,
        },
      })
    })

    return NextResponse.json(
      { id: snapshot.id, label: snapshot.label, createdAt: snapshot.createdAt },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error creating snapshot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
