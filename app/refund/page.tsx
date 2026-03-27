import { ArrowLeft, Clock, Mail, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Refund Request — Landed',
  description: 'Request a refund or exercise your EU 14-day right of withdrawal.',
}

export default function RefundPage() {
  const supportEmail = 'support@resume.dev'
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-6 py-16 w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-10 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="text-4xl font-black text-dark mb-4">Refund Request</h1>
        <p className="text-dark/70 mb-10 text-lg">
          We want you to be happy with Landed. If you&apos;re not satisfied, we&apos;re here to
          help.
        </p>

        {/* EU Withdrawal Notice */}
        <div className="bg-yellow/20 border border-yellow rounded-xl p-6 mb-8 flex gap-4">
          <ShieldCheck className="h-6 w-6 text-secondary-accent shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-dark mb-1">EU Right of Withdrawal</h2>
            <p className="text-sm text-dark/70">
              If you are an EU consumer, you have the right to withdraw from your subscription
              contract within <strong>14 days</strong> of the date of purchase without giving any
              reason. To exercise this right, contact us at the email below before the 14-day period
              expires.
            </p>
          </div>
        </div>

        {/* How to request */}
        <div className="bg-white border border-yellow/60 rounded-xl p-6 mb-8 space-y-5">
          <h2 className="font-bold text-dark text-xl">How to Request a Refund</h2>

          <div className="flex gap-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-dark">Email us</p>
              <p className="text-sm text-dark/70 mt-0.5">
                Send an email to{' '}
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-primary hover:underline font-medium"
                >
                  {supportEmail}
                </a>{' '}
                with the subject line <strong>&quot;Refund Request&quot;</strong>.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-dark">Include your details</p>
              <p className="text-sm text-dark/70 mt-0.5">
                Please include the email address associated with your account and the approximate
                date of purchase.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-dark">We&apos;ll process it</p>
              <p className="text-sm text-dark/70 mt-0.5">
                We&apos;ll review your request and respond within 3 business days. Approved refunds
                are returned to the original payment method.
              </p>
            </div>
          </div>
        </div>

        {/* Response time notice */}
        <div className="flex items-start gap-3 text-sm text-dark/60 mb-8">
          <Clock className="h-4 w-4 shrink-0 mt-0.5" />
          <p>Typical response time: 1–3 business days.</p>
        </div>

        {/* CTA */}
        <a
          href={`mailto:${supportEmail}?subject=Refund Request`}
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Mail className="h-4 w-4" />
          Email Us Now
        </a>
      </main>
      <Footer />
    </div>
  )
}
