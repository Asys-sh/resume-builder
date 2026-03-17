import { getSession } from '@robojs/auth/client'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canUseAIFeatures, incrementUsage } from '@/lib/subscription'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * AI Assist API Route (Placeholder)
 *
 * This route serves as a template for future AI feature implementations.
 * It demonstrates the proper flow for checking subscription permissions
 * and tracking usage.
 *
 * TODO: Implement actual AI logic here (e.g., OpenAI API calls, resume improvements, etc.)
 */
export async function POST(request: NextRequest) {
	try {
		// 1. Get the user session
		const session = await getSession()
		if (!session?.user?.email) {
			return NextResponse.json({ error: 'Unauthorized', message: 'You must be logged in to use AI features' }, { status: 401 })
		}

		// 1b. Rate limit: 30 AI requests per hour per user email
		const rateLimitResponse = checkRateLimit(`ai:${session.user.email}`, 30, 60 * 60 * 1000)
		if (rateLimitResponse) return rateLimitResponse

		// 2. Fetch user data from Prisma including subscription fields
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
			select: {
				id: true, // Use id instead of userId
				subscriptionStatus: true,
				usageCount: true,
				usageLimit: true,
				billingPeriodEnd: true,
				name: true
			}
		})

		if (!user) {
			return NextResponse.json({ error: 'UserNotFound', message: 'User not found' }, { status: 404 })
		}

		// 3. Check if user can use AI features
		if (!canUseAIFeatures(user)) {
			return NextResponse.json(
				{
					error: 'SubscriptionRequired',
					message: 'You have reached your AI assist limit. Please upgrade to Pro for unlimited access.',
					usageCount: user.usageCount,
					usageLimit: user.usageLimit,
					subscriptionStatus: user.subscriptionStatus
				},
				{ status: 403 }
			)
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

		// TODO: Replace with actual AI call (OpenAI, Anthropic, etc.)
		// For now, we'll generate a placeholder based on the inputs
		const generatedContent = `
Dear Hiring Manager at ${companyName || 'the company'},

I am writing to express my strong interest in the ${jobTitle || 'position'} role. With my background in ${resume.experiences[0]?.role || 'my field'} and my skills in ${resume.skills.slice(0, 3).map(s => s.name).join(', ')}, I am confident in my ability to contribute effectively to your team.

Based on the job description:
"${jobDescription.substring(0, 100)}..."

I believe my experience at ${resume.experiences[0]?.company || 'my previous companies'} aligns perfectly with your requirements.

Thank you for considering my application.

Sincerely,
${user.name || 'Candidate'}
		`.trim()

		// Increment usage
		await incrementUsage(user.id)

		return NextResponse.json({ content: generatedContent })
	} catch (error) {
		console.error('AI API error:', error)
		return NextResponse.json({ error: 'InternalError', message: 'An internal error occurred' }, { status: 500 })
	}
}
