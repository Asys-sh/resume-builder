import { CreditCard, HelpCircle, Shield, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { getServerUser } from '@/lib/auth-helper'
import PricingCards from './PricingCards'

export const metadata = {
  title: 'Pricing — Landed',
  description: 'Simple, transparent pricing. Start free and upgrade when you need more power.',
}

export default async function PricingPage() {
  const user = await getServerUser()
  const isAuthenticated = !!user

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Navbar isAuthenticated={isAuthenticated} user={user ?? undefined} />

      <main className="flex flex-1 flex-col">
        {/* Hero Section */}
        <section className="px-4 pb-12 pt-16 text-center sm:pb-16 sm:pt-24">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow bg-yellow px-4 py-1.5 text-sm font-medium text-dark">
              <Sparkles className="h-4 w-4 text-primary" />
              No credit card required to start
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tighter text-dark sm:text-5xl md:text-6xl">
              Simple, Transparent <span className="text-primary">Pricing</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-dark/70 sm:text-xl">
              Build a world-class resume for free. Upgrade to Pro when you need unlimited AI power
              to land your dream job faster.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <PricingCards isAuthenticated={isAuthenticated} />

        {/* Trust badges */}
        <section className="px-4 py-10 text-center">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-6 text-sm text-dark/60">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" />
              Secure payments via Stripe
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-primary" />
              Cancel anytime, no questions asked
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              Instant access after upgrade
            </span>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-beige px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <div className="mb-10 text-center">
              <span className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                <HelpCircle className="h-4 w-4" />
                Common Questions
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tighter text-dark">Got questions?</h2>
              <p className="mt-2 text-dark/60">Everything you need to know about our plans.</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-yellow bg-cream p-6">
                <h3 className="font-semibold text-dark">
                  Can I cancel my Pro subscription anytime?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-dark/70">
                  Yes, absolutely. You can cancel at any time from your account settings. Your Pro
                  benefits stay active until the end of your current billing period, after which
                  your account reverts to the Free plan — no fees, no hassle.
                </p>
              </div>

              <div className="rounded-xl border border-yellow bg-cream p-6">
                <h3 className="font-semibold text-dark">Is my payment information secure?</h3>
                <p className="mt-2 text-sm leading-relaxed text-dark/70">
                  Completely. We use <span className="font-medium text-dark">Stripe</span> — a
                  PCI-DSS Level 1 certified payment processor — to handle all transactions. Robo
                  Resume never stores your card details on our servers.
                </p>
              </div>

              <div className="rounded-xl border border-yellow bg-cream p-6">
                <h3 className="font-semibold text-dark">What is your refund policy?</h3>
                <p className="mt-2 text-sm leading-relaxed text-dark/70">
                  We offer a{' '}
                  <span className="font-medium text-dark">14-day money-back guarantee</span> on all
                  Pro subscriptions. If you&apos;re not satisfied, contact us within 14 days of your
                  purchase and we&apos;ll issue a full refund — no questions asked. EU consumers
                  also have statutory withdrawal rights under applicable law.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-4 py-16 text-center sm:py-20">
          <div className="mx-auto max-w-xl">
            <h2 className="text-3xl font-bold tracking-tighter text-dark">
              Ready to build your perfect resume?
            </h2>
            <p className="mt-3 text-dark/60">
              Join thousands of job seekers already using Landed.
            </p>
            <div className="mt-8">
              <Link href="/auth?login=false">
                <Button
                  className="h-12 rounded-lg bg-primary px-8 text-base font-bold text-dark hover:bg-primary/90"
                  size="lg"
                >
                  Get Started for Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
