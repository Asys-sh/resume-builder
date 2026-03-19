import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { CoverLetterCreateSchema, parseBody } from '@/lib/schemas'
import { sanitizeText } from '@/lib/sanitize'

export async function GET() {
  try {
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const coverLetters = await prisma.coverLetter.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ coverLetters })
  } catch (error) {
    console.error('Error fetching cover letters:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await parseBody(request, CoverLetterCreateSchema)
    if (error) return error

    const { title, content, jobTitle, companyName, jobDescription, resumeId, status } = data

    if (resumeId) {
      const resume = await prisma.resume.findUnique({
        where: { id: resumeId, userId: user.id },
        select: { id: true },
      })
      if (!resume) {
        return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
      }
    }

    const coverLetter = await prisma.coverLetter.create({
      data: {
        userId: user.id,
        title: sanitizeText(title) || 'Untitled Cover Letter',
        content: sanitizeText(content) || '',
        jobTitle: sanitizeText(jobTitle),
        companyName: sanitizeText(companyName),
        jobDescription: sanitizeText(jobDescription),
        resumeId,
        status: status || 'draft',
      },
    })

    return NextResponse.json({ coverLetter })
  } catch (error) {
    console.error('Error creating cover letter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
