import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { openai } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { AIAssistSchema, parseBody } from '@/lib/schemas'
import { sanitizeText } from '@/lib/sanitize'
import { handleTrialExpiry, tryConsumeAICredit } from '@/lib/subscription'

export async function POST(request: Request) {
  try {
    const userSession = await getServerUser()
    if (!userSession?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = checkRateLimit(`ai-assist:${userSession.id}`, 20, 60 * 60 * 1000)
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
          message:
            'You have reached your AI assist limit. Please upgrade to Pro for unlimited access.',
        },
        { status: 403 },
      )
    }

    const { data: raw, error } = await parseBody(request, AIAssistSchema)
    if (error) return error

    const type = sanitizeText(raw.type)
    const role = sanitizeText(raw.role)
    const company = sanitizeText(raw.company)
    const currentContent = sanitizeText(raw.currentContent)
    const skills: string[] = raw.skills
      .map((s: string) => sanitizeText(s))
      .filter(Boolean) as string[]

    let prompt = ''

    if (type === 'summary') {
      const skillsLine = skills?.length ? `Key skills: ${skills.join(', ')}.` : ''
      const improveLine = currentContent?.trim()
        ? `Improve and rewrite this existing summary: "${currentContent}"`
        : 'Write a professional summary from scratch.'
      prompt = `${improveLine} ${skillsLine} Requirements: 3-4 sentences, first-person voice, professional tone, highlight strengths and value. Return only the summary text, no labels or quotes.`
    } else if (type === 'description') {
      const context = [role && `Role: ${role}`, company && `Company: ${company}`]
        .filter(Boolean)
        .join(', ')
      const improveLine = currentContent?.trim()
        ? `Improve these job description bullet points: "${currentContent}"`
        : `Write job description bullet points for this role.`
      prompt = `${improveLine} ${context}. Requirements: 3-4 bullet points using • character, strong action verbs, quantify achievements where possible, concise and impactful. Return only the bullet points, no extra text.`
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 400,
    })

    const result = completion.choices[0]?.message?.content ?? ''
    if (!result) {
      return NextResponse.json(
        { error: 'AI returned an empty response. Please try again.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error('AI assist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
