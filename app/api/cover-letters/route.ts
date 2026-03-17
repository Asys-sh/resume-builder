import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const user = await getServerUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const coverLetters = await prisma.coverLetter.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' }
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

        const body = await request.json()
        const { title, content, jobTitle, companyName, jobDescription, resumeId, status } = body

        // Basic input length limits
        if (title && title.length > 200) {
            return NextResponse.json({ error: 'Title too long (max 200 characters)' }, { status: 400 })
        }
        if (content && content.length > 50000) {
            return NextResponse.json({ error: 'Content too long (max 50000 characters)' }, { status: 400 })
        }
        if (jobDescription && jobDescription.length > 10000) {
            return NextResponse.json({ error: 'Job description too long (max 10000 characters)' }, { status: 400 })
        }

        const coverLetter = await prisma.coverLetter.create({
            data: {
                userId: user.id,
                title: title || 'Untitled Cover Letter',
                content: content || '',
                jobTitle,
                companyName,
                jobDescription,
                resumeId,
                status: status || 'draft'
            }
        })

        return NextResponse.json({ coverLetter })
    } catch (error) {
        console.error('Error creating cover letter:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
