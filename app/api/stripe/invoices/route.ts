import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerUser } from '@/lib/auth-helper'
import { INVOICES_PER_PAGE } from '@/lib/constants'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET() {
  try {
    const userSession = await getServerUser()

    if (!userSession?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userSession.id },
      select: { stripeCustomerId: true },
    })

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ invoices: [] })
    }

    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: INVOICES_PER_PAGE,
    })

    const formatted = invoices.data.map((inv) => ({
      id: inv.id,
      date: inv.created,
      amount: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      pdf: inv.invoice_pdf,
      hostedUrl: inv.hosted_invoice_url,
    }))

    return NextResponse.json({ invoices: formatted })
  } catch (error) {
    console.error('Invoices fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
