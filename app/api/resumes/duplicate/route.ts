import { type NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { sanitizeText } from '@/lib/sanitize'
import { z } from 'zod'
import { parseBody } from '@/lib/schemas'

const DuplicateResumeSchema = z.object({
  resumeId:   z.string().min(1),
  tailoredFor: z.string().max(200).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: body, error } = await parseBody(req, DuplicateResumeSchema)
    if (error) return error

    // Fetch source resume — ownership verified via userId in where clause
    const source = await prisma.resume.findUnique({
      where: { id: body.resumeId, userId: user.id },
      include: {
        experiences:    true,
        skills:         true,
        education:      true,
        projects:       true,
        certifications: true,
        languages:      true,
      },
    })

    if (!source) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    // Keep hierarchy flat: if source is itself a child, point new resume to the grandparent
    const newParentId = source.parentResumeId ?? source.id

    const tailoredFor = body.tailoredFor ? sanitizeText(body.tailoredFor) : null

    // Deep-copy inside a transaction
    const newResume = await prisma.$transaction(async (tx) => {
      const created = await tx.resume.create({
        data: {
          user:           { connect: { id: user.id } },
          parent:         { connect: { id: newParentId } },
          title:          `${source.title} — ${tailoredFor || 'Tailored'}`,
          summary:        source.summary,
          contactInfo:    source.contactInfo ?? {},
          template:       source.template,
          tailoredFor,
          isPublic:        false,
          publicSlug:      null,
          hideContactInfo: false,
        },
      })

      // Deep-copy relations (strip id and resumeId so new records are created)
      await Promise.all([
        ...source.experiences.map(({ id: _id, resumeId: _rid, ...rest }) =>
          tx.experience.create({ data: { ...rest, resumeId: created.id } }),
        ),
        ...source.skills.map(({ id: _id, resumeId: _rid, ...rest }) =>
          tx.skill.create({ data: { ...rest, resumeId: created.id } }),
        ),
        ...source.education.map(({ id: _id, resumeId: _rid, ...rest }) =>
          tx.education.create({ data: { ...rest, resumeId: created.id } }),
        ),
        ...source.projects.map(({ id: _id, resumeId: _rid, ...rest }) =>
          tx.project.create({ data: { ...rest, resumeId: created.id } }),
        ),
        ...source.certifications.map(({ id: _id, resumeId: _rid, ...rest }) =>
          tx.certification.create({ data: { ...rest, resumeId: created.id } }),
        ),
        ...source.languages.map(({ id: _id, resumeId: _rid, ...rest }) =>
          tx.language.create({ data: { ...rest, resumeId: created.id } }),
        ),
      ])

      return created
    })

    return NextResponse.json({ resumeId: newResume.id }, { status: 201 })
  } catch (error) {
    console.error('Error duplicating resume:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
