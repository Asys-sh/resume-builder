import { type NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { openai } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { AI_MAX_TOKENS_IMPROVE, RATE_LIMIT_AI_IMPROVE } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rate-limit'
import { AIImproveSchema, parseBody } from '@/lib/schemas'
import { handleTrialExpiry, tryConsumeAICredit } from '@/lib/subscription'
import { sanitizeText } from '@/lib/sanitize'
import { buildResumeContext, buildResumeImprovementPrompt } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const userSession = await getServerUser()
    if (!userSession?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = checkRateLimit(`ai:${userSession.id}`, RATE_LIMIT_AI_IMPROVE.max, RATE_LIMIT_AI_IMPROVE.window)
    if (rateLimitResponse) return rateLimitResponse

    const user = await prisma.user.findUnique({
      where: { id: userSession.id },
      select: {
        id: true,
        subscriptionStatus: true,
        usageCount: true,
        usageLimit: true,
        billingPeriodEnd: true,
        name: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await handleTrialExpiry(user.id, user)

    const allowed = await tryConsumeAICredit(user.id)
    if (!allowed) {
      return NextResponse.json(
        {
          error: 'SubscriptionRequired',
          message:
            'You have reached your AI assist limit. Please upgrade to Pro for unlimited access.',
          usageCount: user.usageCount,
          usageLimit: user.usageLimit,
          subscriptionStatus: user.subscriptionStatus,
        },
        { status: 403 },
      )
    }

    const { data, error } = await parseBody(request, AIImproveSchema)
    if (error) return error

    const { resumeId } = data
    const jobDescription = sanitizeText(data.jobDescription)

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId, userId: user.id },
      include: {
        experiences: true,
        skills: true,
        education: true,
        projects: true,
      },
    })

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    const resumeContext = buildResumeContext({
      userName: user.name,
      summary: resume.summary,
      experiences: resume.experiences,
      skills: resume.skills,
      education: resume.education,
      projects: resume.projects,
    })

    const prompt = buildResumeImprovementPrompt({
      userName: user.name,
      jobDescription,
      resumeContext,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: AI_MAX_TOKENS_IMPROVE,
    })

    const suggestions = completion.choices[0]?.message?.content ?? ''
    if (!suggestions) {
      return NextResponse.json(
        { error: 'AI returned an empty response. Please try again.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
