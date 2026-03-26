import { type NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { RATE_LIMIT_RESUME_SAVE, RESUMES_PER_PAGE } from '@/lib/constants'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { ResumeBodySchema, parseBody } from '@/lib/schemas'
import { sanitizeResumeData } from '@/lib/sanitize'
import type { ResumeData } from '@/stores/builder'
import type { Certification, Education, Experience, Language, Project, Skill } from '@prisma-generated/client'

/** Minimal interface for Prisma delegate methods used by syncRelated */
interface SyncDelegate {
  findMany(args: { where: Record<string, string>; select: { id: true } }): Promise<{ id: string }[]>
  deleteMany(args: { where: { id: { in: string[] } } }): Promise<unknown>
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>
  create(args: { data: Record<string, unknown> }): Promise<unknown>
}

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
      const skip = (page - 1) * RESUMES_PER_PAGE

      const [resumes, total] = await Promise.all([
        prisma.resume.findMany({
          where: { userId: user.id },
          select: { id: true, title: true, updatedAt: true, template: true, contactInfo: true },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: RESUMES_PER_PAGE,
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
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    // Map `template` → `selectedTemplate` so the builder store key matches
    const { template, ...rest } = resume
    return NextResponse.json({ ...rest, selectedTemplate: template })
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

    const limited = checkRateLimit('resume-create:' + user.id, RATE_LIMIT_RESUME_SAVE.max, RATE_LIMIT_RESUME_SAVE.window)
    if (limited) return limited

    const { data: body, error } = await parseBody(req, ResumeBodySchema)
    if (error) return error

    const { resumeId, title } = body
    const data = body.data ? sanitizeResumeData(body.data as unknown as ResumeData) : null

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
            contactInfo: data.contactInfo as ResumeData['contactInfo'],
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
            contactInfo: data.contactInfo as ResumeData['contactInfo'],
            template: data.selectedTemplate,
          },
        })

    const newResumeId = resume.id

    // Field allowlists per relation — prevents mass assignment
    const pickExperience = (e: Experience) => ({
      company: e.company, role: e.role, startDate: e.startDate,
      endDate: e.endDate, description: e.description, location: e.location,
    })
    const pickSkill = (s: Skill) => ({ name: s.name, level: s.level })
    const pickEducation = (ed: Education) => ({
      school: ed.school, degree: ed.degree, fieldOfStudy: ed.fieldOfStudy,
      startDate: ed.startDate, endDate: ed.endDate, gpa: ed.gpa,
    })
    const pickProject = (p: Project) => ({
      title: p.title, description: p.description, link: p.link,
      technologies: p.technologies, startDate: p.startDate, endDate: p.endDate,
    })
    const pickCertification = (c: Certification) => ({ name: c.name, issuer: c.issuer, date: c.date })
    const pickLanguage = (l: Language) => ({ name: l.name, proficiency: l.proficiency })

    // Helper for Smart Sync — must run inside a transaction (receives tx client)
    const syncRelated = async <T extends { id: string }>(
      model: SyncDelegate, items: T[], foreignKey: string, pick: (item: T) => Record<string, unknown>,
    ) => {
      const existingItems = await model.findMany({
        where: { [foreignKey]: newResumeId },
        select: { id: true },
      })
      const existingIds = new Set(existingItems.map((i) => i.id))
      const incomingIds = new Set(
        items.map((i) => i.id).filter((id) => id && existingIds.has(id)),
      )

      const toDelete = [...existingIds].filter((id) => !incomingIds.has(id))
      if (toDelete.length > 0) {
        await model.deleteMany({ where: { id: { in: toDelete } } })
      }

      for (const item of items) {
        const fields = pick(item)
        if (item.id && existingIds.has(item.id)) {
          await model.update({ where: { id: item.id }, data: fields })
        } else {
          await model.create({ data: { ...fields, [foreignKey]: newResumeId } })
        }
      }
    }

    // Execute all syncs in a single transaction — if any step fails the
    // entire operation rolls back, preventing partial/corrupt resume state.
    await prisma.$transaction(async (tx) => {
      await Promise.all([
        syncRelated(tx.experience, data.experiences, 'resumeId', pickExperience),
        syncRelated(tx.education, data.education, 'resumeId', pickEducation),
        syncRelated(tx.skill, data.skills, 'resumeId', pickSkill),
        syncRelated(tx.project, data.projects, 'resumeId', pickProject),
        syncRelated(tx.certification, data.certifications, 'resumeId', pickCertification),
        syncRelated(tx.language, data.languages, 'resumeId', pickLanguage),
      ])
    })

    return NextResponse.json({ success: true, resumeId: newResumeId })
  } catch (error) {
    console.error('Error saving resume:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
