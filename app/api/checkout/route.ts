import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getServerUser } from '@/lib/auth-helper'
import { checkRateLimit } from '@/lib/rate-limit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
	try {
		// Verify the caller is authenticated
		const userSession = await getServerUser()
		if (!userSession?.id) {
			return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
		}

		// 10 checkout attempts per hour per user
		const rateLimitResponse = checkRateLimit(`checkout:${userSession.id}`, 10, 60 * 60 * 1000)
		if (rateLimitResponse) return rateLimitResponse

		const body = await request.json()
		const { priceId, quantity = 1, mode = 'subscription' } = body

		if (!priceId) {
			return NextResponse.json({ success: false, error: 'Price ID is required' }, { status: 400 })
		}

		// Use the authenticated session userId — never trust userId from the client body
		const user = await prisma.user.findUnique({ where: { id: userSession.id } })

		if (!user) {
			return NextResponse.json(
				{ success: false, error: 'User not found. Please contact support.' },
				{ status: 404 }
			)
		}

		/**
		 * Subscription Flow Documentation:
		 *
		 * 1. This creates a Stripe Checkout session for subscription billing
		 * 2. The `mode: 'subscription'` parameter enables recurring billing
		 * 3. User subscription status is updated via webhook after successful payment
		 *    (see app/api/webhooks/stripe/route.ts for webhook handlers)
		 * 4. The `metadata.userId` is used by the webhook to identify the user
		 *    and update their subscription status, usage count, and billing period
		 * 5. The `subscription_data.metadata.userId` ensures the userId is stored
		 *    on the Stripe Subscription object itself for renewal and cancellation webhooks
		 */
		const session = await stripe.checkout.sessions.create({
			line_items: [
				{
					price: priceId,
					quantity: quantity
				}
			],
			mode: mode === 'subscription' ? 'subscription' : 'payment',
			metadata: {
				userId: user.id
			},
			subscription_data: mode === 'subscription' ? {
				metadata: {
					userId: user.id
				}
			} : undefined,
			success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`
		})

		// Subscription status will be updated ONLY after successful payment via webhook
		return NextResponse.json(
			{
				success: true,
				url: session.url,
				sessionId: session.id
			},
			{ status: 200 }
		)
	} catch (error) {
		console.error('Checkout error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to create checkout session' },
			{ status: 500 }
		)
	}
}
