import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { parseBody } from '@/lib/schemas'
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize'

const JobApplicationUpdateSchema = z.object({
  company: z.string().min(1).max(100).optional(),
  role: z.string().min(1).max(100).optional(),
  status: z.enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']).optional(),
  jobUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(5000).optional(),
  salary: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
  resumeId: z.string().optional(),
  coverLetterId: z.string().optional(),
  appliedAt: z.string().datetime().optional(),
})

async function getOwnedApplication(appId: string, userId: string) {
  const application = await prisma.jobApplication.findUnique({ where: { id: appId, userId } })
  if (!application) {
    return { application: null, error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  }
  return { application, error: null }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { application, error } = await getOwnedApplication(id, user.id)
    if (error) return error

    return NextResponse.json({ application })
  } catch (error) {
    console.error('Error fetching job application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { application, error } = await getOwnedApplication(id, user.id)
    if (error) return error

    const { data: body, error: parseError } = await parseBody(req, JobApplicationUpdateSchema)
    if (parseError) return parseError

    if (body.resumeId) {
      const resume = await prisma.resume.findUnique({ where: { id: body.resumeId, userId: user.id } })
      if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    if (body.coverLetterId) {
      const coverLetter = await prisma.coverLetter.findUnique({ where: { id: body.coverLetterId, userId: user.id } })
      if (!coverLetter) return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 })
    }

    const updated = await prisma.jobApplication.update({
      where: { id: application!.id },
      data: {
        ...(body.company !== undefined && { company: sanitizeText(body.company) }),
        ...(body.role !== undefined && { role: sanitizeText(body.role) }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.jobUrl !== undefined && { jobUrl: sanitizeUrl(body.jobUrl) || null }),
        ...(body.notes !== undefined && { notes: sanitizeText(body.notes) || null }),
        ...(body.salary !== undefined && { salary: sanitizeText(body.salary) || null }),
        ...(body.location !== undefined && { location: sanitizeText(body.location) || null }),
        ...(body.resumeId !== undefined && { resumeId: body.resumeId || null }),
        ...(body.coverLetterId !== undefined && { coverLetterId: body.coverLetterId || null }),
        ...(body.appliedAt !== undefined && { appliedAt: new Date(body.appliedAt) }),
      },
    })

    return NextResponse.json({ application: updated })
  } catch (error) {
    console.error('Error updating job application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { error } = await getOwnedApplication(id, user.id)
    if (error) return error

    await prisma.jobApplication.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting job application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
