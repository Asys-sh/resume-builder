import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { tryConsumeAICredit, handleTrialExpiry } from '@/lib/subscription'
import { openai } from '@/lib/openai'
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
				email: true,
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

		await handleTrialExpiry(user.id, user)

		const allowed = await tryConsumeAICredit(user.id)
		if (!allowed) {
			return NextResponse.json({
				error: 'SubscriptionRequired',
				message: 'You have reached your AI assist limit.'
			}, { status: 403 })
		}

		const body = await request.json()
		const { resumeId, jobDescription, jobTitle, companyName } = body

		if (!jobDescription) {
			return NextResponse.json({ error: 'Missing job description' }, { status: 400 })
		}

		if (jobDescription.length > 10000) {
			return NextResponse.json({ error: 'Job description too long' }, { status: 400 })
		}

		// If a resumeId is provided, enrich the prompt with the user's resume data
		let resumeContext = ''
		if (resumeId) {
			const resume = await prisma.resume.findUnique({
				where: { id: resumeId, userId: user.id },
				include: { experiences: true, skills: true, education: true, projects: true }
			})
			if (resume) {
				resumeContext = buildResumeContext({
					userName: user.name,
					summary: resume.summary,
					experiences: resume.experiences,
					skills: resume.skills,
					education: resume.education,
					projects: resume.projects
				})
			}
		}

		const prompt = buildCoverLetterPrompt({
			jobTitle,
			companyName,
			jobDescription,
			resumeContext
		})

		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.7,
			max_tokens: 1000
		})

		const generatedContent = completion.choices[0]?.message?.content ?? ''

		return NextResponse.json({ content: generatedContent })
	} catch (error) {
		console.error('Error generating cover letter:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
