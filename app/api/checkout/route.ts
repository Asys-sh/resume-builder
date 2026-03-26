import { type NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { RATE_LIMIT_CHECKOUT } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rate-limit'
import { CheckoutSchema, parseBody } from '@/lib/schemas'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify the caller is authenticated
    const userSession = await getServerUser()
    if (!userSession?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = checkRateLimit(`checkout:${userSession.id}`, RATE_LIMIT_CHECKOUT.max, RATE_LIMIT_CHECKOUT.window)
    if (rateLimitResponse) return rateLimitResponse

    const { data, error } = await parseBody(request, CheckoutSchema)
    if (error) return error

    const { priceId, quantity, mode } = data

    // Use the authenticated session userId — never trust userId from the client body
    const user = await prisma.user.findUnique({ where: { id: userSession.id } })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found. Please contact support.' },
        { status: 404 },
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
          quantity: quantity,
        },
      ],
      mode: mode === 'subscription' ? 'subscription' : 'payment',
      metadata: {
        userId: user.id,
      },
      subscription_data:
        mode === 'subscription'
          ? {
              metadata: {
                userId: user.id,
              },
            }
          : undefined,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
    })

    // Subscription status will be updated ONLY after successful payment via webhook
    return NextResponse.json(
      {
        success: true,
        url: session.url,
        sessionId: session.id,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 },
    )
  }
}
