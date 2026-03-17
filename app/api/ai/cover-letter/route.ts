import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { canUseAIFeatures, incrementUsage } from '@/lib/subscription'
import { AI } from '@robojs/ai'
import { buildResumeContext, buildCoverLetterPrompt } from '@/lib/utils'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
    try {
        const userSession = await getServerUser()
        if (!userSession?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 20 AI requests per hour per user
        const rateLimitResponse = checkRateLimit(`ai-cover-letter:${userSession.id}`, 20, 60 * 60 * 1000)
        if (rateLimitResponse) return rateLimitResponse

        const user = await prisma.user.findUnique({
            where: { id: userSession.id },
            select: {
                id: true,
                subscriptionStatus: true,
                usageCount: true,
                usageLimit: true,
                billingPeriodEnd: true,
                name: true
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (!canUseAIFeatures(user)) {
            return NextResponse.json({
                error: 'SubscriptionRequired',
                message: 'You have reached your AI assist limit.'
            }, { status: 403 })
        }

        const body = await request.json()
        const { resumeId, jobDescription, jobTitle, companyName } = body

        if (!resumeId || !jobDescription) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const resume = await prisma.resume.findUnique({
            where: { id: resumeId, userId: user.id },
            include: {
                experiences: true,
                skills: true,
                education: true,
                projects: true
            }
        })

        if (!resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
        }

        // Build context from resume data
        const resumeContext = buildResumeContext({
            userName: user.name,
            summary: resume.summary,
            experiences: resume.experiences,
            skills: resume.skills,
            education: resume.education,
            projects: resume.projects
        })

        // Generate cover letter using AI
        const prompt = buildCoverLetterPrompt({
            jobTitle,
            companyName,
            jobDescription,
            resumeContext
        })

        const response = await AI.chatSync([
            {
                role: 'user',
                content: prompt
            }
        ], {})

        // Extract content from response - ChatReply has a text property
        const generatedContent = response.text || ''

        // Increment usage
        await incrementUsage(user.id)

        return NextResponse.json({ content: generatedContent })
    } catch (error) {
        console.error('Error generating cover letter:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
