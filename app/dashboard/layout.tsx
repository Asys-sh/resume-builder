import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUserData } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Dashboard — Landed',
  description: 'Manage your resumes, cover letters, and account settings.',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserData()

  if (!user) {
    redirect('/auth?login=true')
  }

  if (!user.emailVerified) {
    redirect('/verify-email?pending=1')
  }

  // Init trial for newly verified users who haven't had a subscription yet
  if (user.subscriptionStatus === 'INACTIVE' && !user.stripeCustomerId) {
    const now = new Date()
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'TRIAL',
        usageLimit: 5,
        usageCount: 0,
        billingPeriodStart: now,
        billingPeriodEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    })
  }

  return <>{children}</>
}
