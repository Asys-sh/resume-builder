import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getServerUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const coverLetter = await prisma.coverLetter.findUnique({
            where: { id },
            include: { resume: true }
        })

        if (!coverLetter) {
            return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 })
        }

        if (coverLetter.userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        return NextResponse.json({ coverLetter })
    } catch (error) {
        console.error('Error fetching cover letter:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getServerUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { title, content, jobTitle, companyName, jobDescription, status } = body

        if (title && title.length > 200) {
            return NextResponse.json({ error: 'Title too long (max 200 characters)' }, { status: 400 })
        }
        if (content && content.length > 50000) {
            return NextResponse.json({ error: 'Content too long (max 50000 characters)' }, { status: 400 })
        }
        if (jobDescription && jobDescription.length > 10000) {
            return NextResponse.json({ error: 'Job description too long (max 10000 characters)' }, { status: 400 })
        }

        // Verify ownership
        const existing = await prisma.coverLetter.findUnique({
            where: { id },
            select: { userId: true }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 })
        }

        if (existing.userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const coverLetter = await prisma.coverLetter.update({
            where: { id },
            data: {
                title:          title          ? sanitizeText(title)          : undefined,
                content:        content        ? sanitizeText(content)        : undefined,
                jobTitle:       jobTitle       ? sanitizeText(jobTitle)       : undefined,
                companyName:    companyName    ? sanitizeText(companyName)    : undefined,
                jobDescription: jobDescription ? sanitizeText(jobDescription) : undefined,
                status
            }
        })

        return NextResponse.json({ coverLetter })
    } catch (error) {
        console.error('Error updating cover letter:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getServerUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Verify ownership
        const existing = await prisma.coverLetter.findUnique({
            where: { id },
            select: { userId: true }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 })
        }

        if (existing.userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        await prisma.coverLetter.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting cover letter:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
