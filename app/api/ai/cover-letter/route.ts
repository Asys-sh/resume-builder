import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { openai } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { AICoverLetterSchema, parseBody } from '@/lib/schemas'
import { sanitizeText } from '@/lib/sanitize'
import { handleTrialExpiry, tryConsumeAICredit } from '@/lib/subscription'
import { buildCoverLetterPrompt, buildResumeContext } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const userSession = await getServerUser()
    if (!userSession?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 20 AI requests per hour per user
    const rateLimitResponse = checkRateLimit(
      `ai-cover-letter:${userSession.id}`,
      20,
      60 * 60 * 1000,
    )
    if (rateLimitResponse) return rateLimitResponse

    const user = await prisma.user.findUnique({
      where: { id: userSession.id },
      select: {
        id: true,
        email: true,
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
          message: 'You have reached your AI assist limit.',
        },
        { status: 403 },
      )
    }

    const { data: body, error } = await parseBody(request, AICoverLetterSchema)
    if (error) return error

    const resumeId = sanitizeText(body.resumeId)
    const jobDescription = sanitizeText(body.jobDescription)!
    const jobTitle = sanitizeText(body.jobTitle)
    const companyName = sanitizeText(body.companyName)

    // If a resumeId is provided, enrich the prompt with the user's resume data
    let resumeContext = ''
    if (resumeId) {
      const resume = await prisma.resume.findUnique({
        where: { id: resumeId, userId: user.id },
        include: { experiences: true, skills: true, education: true, projects: true },
      })
      if (resume) {
        resumeContext = buildResumeContext({
          userName: user.name,
          summary: resume.summary,
          experiences: resume.experiences,
          skills: resume.skills,
          education: resume.education,
          projects: resume.projects,
        })
      }
    }

    const prompt = buildCoverLetterPrompt({
      jobTitle,
      companyName,
      jobDescription,
      resumeContext,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const generatedContent = completion.choices[0]?.message?.content ?? ''
    if (!generatedContent) {
      return NextResponse.json(
        { error: 'AI returned an empty response. Please try again.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ content: generatedContent })
  } catch (error) {
    console.error('Error generating cover letter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
