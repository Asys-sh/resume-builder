import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { parseBody } from '@/lib/schemas'
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize'

const JobApplicationCreateSchema = z.object({
  company: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  status: z.enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']).optional(),
  jobUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(5000).optional(),
  salary: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
  resumeId: z.string().optional(),
  coverLetterId: z.string().optional(),
  appliedAt: z.string().datetime().optional(),
})

export async function GET() {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const applications = await prisma.jobApplication.findMany({
      where: { userId: user.id },
      orderBy: { appliedAt: 'desc' },
      include: {
        resume: { select: { id: true, title: true } },
        coverLetter: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Error fetching job applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = checkRateLimit('job-applications:' + user.id, 20, 60 * 60 * 1000)
    if (limited) return limited

    const { data: body, error } = await parseBody(req, JobApplicationCreateSchema)
    if (error) return error

    if (body.resumeId) {
      const resume = await prisma.resume.findUnique({ where: { id: body.resumeId, userId: user.id } })
      if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    if (body.coverLetterId) {
      const coverLetter = await prisma.coverLetter.findUnique({ where: { id: body.coverLetterId, userId: user.id } })
      if (!coverLetter) return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 })
    }

    const application = await prisma.jobApplication.create({
      data: {
        userId: user.id,
        company: sanitizeText(body.company),
        role: sanitizeText(body.role),
        status: body.status ?? 'APPLIED',
        jobUrl: sanitizeUrl(body.jobUrl) || null,
        notes: sanitizeText(body.notes ?? null) || null,
        salary: sanitizeText(body.salary ?? null) || null,
        location: sanitizeText(body.location ?? null) || null,
        resumeId: body.resumeId || null,
        coverLetterId: body.coverLetterId || null,
        appliedAt: body.appliedAt ? new Date(body.appliedAt) : new Date(),
      },
    })

    return NextResponse.json({ application }, { status: 201 })
  } catch (error) {
    console.error('Error creating job application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
