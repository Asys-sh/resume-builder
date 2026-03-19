import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST() {
  try {
    const userSession = await getServerUser()
    if (!userSession?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: userSession.id } })
    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json({ error: 'Failed to open billing portal' }, { status: 500 })
  }
}
