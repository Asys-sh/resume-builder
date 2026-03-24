import { type NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
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

    const limited = checkRateLimit('resume-duplicate:' + user.id, 10, 3_600_000)
    if (limited) return limited

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

      // Deep-copy relations with explicit field allowlists
      await Promise.all([
        ...source.experiences.map((e) =>
          tx.experience.create({ data: {
            resumeId: created.id, company: e.company, role: e.role,
            startDate: e.startDate, endDate: e.endDate,
            description: e.description, location: e.location,
          } }),
        ),
        ...source.skills.map((s) =>
          tx.skill.create({ data: {
            resumeId: created.id, name: s.name, level: s.level,
          } }),
        ),
        ...source.education.map((ed) =>
          tx.education.create({ data: {
            resumeId: created.id, school: ed.school, degree: ed.degree,
            fieldOfStudy: ed.fieldOfStudy, startDate: ed.startDate,
            endDate: ed.endDate, gpa: ed.gpa,
          } }),
        ),
        ...source.projects.map((p) =>
          tx.project.create({ data: {
            resumeId: created.id, title: p.title, description: p.description,
            link: p.link, technologies: p.technologies,
            startDate: p.startDate, endDate: p.endDate,
          } }),
        ),
        ...source.certifications.map((c) =>
          tx.certification.create({ data: {
            resumeId: created.id, name: c.name, issuer: c.issuer, date: c.date,
          } }),
        ),
        ...source.languages.map((l) =>
          tx.language.create({ data: {
            resumeId: created.id, name: l.name, proficiency: l.proficiency,
          } }),
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
