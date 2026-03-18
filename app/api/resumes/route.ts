import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerUser } from '@/lib/auth-helper'
import { ResumeData } from '@/stores/builder'


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
            select: { id: true }
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

        if (!resumeId) {
            return NextResponse.json({ error: 'Missing resume ID' }, { status: 400 })
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

        const body = await req.json()
        const { resumeId, data, title } = body as { resumeId?: string; data: ResumeData; title?: string }

        if (!data) {
            return NextResponse.json({ error: 'Missing resume data' }, { status: 400 })
        }

        // Basic input length limits to prevent oversized payloads
        if (title && title.length > 200) {
            return NextResponse.json({ error: 'Title too long (max 200 characters)' }, { status: 400 })
        }
        if (data.summary && data.summary.length > 5000) {
            return NextResponse.json({ error: 'Summary too long (max 5000 characters)' }, { status: 400 })
        }

        const resume = resumeId ?
            // Update existing resume
            await prisma.resume.update({
                where: {
                    id: resumeId,
                    userId: user.id
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
                        connect:
                            { id: user.id }
                    },
                    title: title || data.contactInfo.fullName || 'Untitled Resume',
                    summary: data.summary,
                    contactInfo: data.contactInfo as any,
                    template: data.selectedTemplate,
                },
            })

        const newResumeId = resume.id

        // Helper for Smart Sync
        const syncRelated = async (
            model: any,
            items: any[],
            foreignKey: string
        ) => {
            // 1. Get existing IDs
            const existingItems = await model.findMany({
                where: { [foreignKey]: newResumeId },
                select: { id: true },
            })
            const existingIds = new Set(existingItems.map((i: any) => i.id))
            const incomingIds = new Set(items.map((i) => i.id).filter((id: string) => id && existingIds.has(id)))

            // 2. Delete missing
            const toDelete = [...existingIds].filter((id) => !incomingIds.has(id))
            if (toDelete.length > 0) {
                await model.deleteMany({
                    where: { id: { in: toDelete } },
                })
            }

            // 3. Update or Create
            for (const item of items) {
                const { id, ...rest } = item
                // If ID exists in DB, update. Otherwise create.
                // Note: We use the ID from the client if it matches an existing record,
                // otherwise we let Prisma generate a new CUID (or use the client's UUID if we want, but safer to let DB handle or ensure it's valid).
                // For simplicity, if it's a new item (not in existingIds), we create it.

                if (id && existingIds.has(id)) {
                    await model.update({
                        where: { id },
                        data: rest,
                    })
                } else {
                    await model.create({
                        data: {
                            ...rest,
                            [foreignKey]: newResumeId,
                        },
                    })
                }
            }
        }

        // Execute Syncs
        await Promise.all([
            syncRelated(prisma.experience, data.experiences, 'resumeId'),
            syncRelated(prisma.education, data.education, 'resumeId'),
            syncRelated(prisma.skill, data.skills, 'resumeId'),
            syncRelated(prisma.project, data.projects, 'resumeId'),
            syncRelated(prisma.certification, data.certifications, 'resumeId'),
            syncRelated(prisma.language, data.languages, 'resumeId'),
        ])

        return NextResponse.json({ success: true, resumeId: newResumeId })
    } catch (error) {
        console.error('Error saving resume:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
