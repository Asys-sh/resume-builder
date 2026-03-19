import { Clock, Mail, MessageSquare } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Contact — RoboResume',
  description: 'Get in touch with the RoboResume team. We typically respond within 24 hours.',
}

const SUPPORT_EMAIL = 'alexander@asys.sh'

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-6 py-16 w-full">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-dark mb-4">Get in Touch</h1>
          <p className="text-dark/70 text-lg">
            Have a question, found a bug, or just want to say hi? We&apos;d love to hear from you.
          </p>
        </div>

        {/* Main contact card */}
        <div className="bg-white border border-yellow/60 rounded-2xl p-8 mb-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-dark">Email Us</h2>
          <p className="text-dark/60 text-sm">
            This is the fastest way to reach us. Drop us an email for support, feedback, or anything
            else.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-block text-primary font-semibold text-lg hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
          <div className="pt-2">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 bg-primary text-dark font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Send Email
            </a>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white border border-yellow/60 rounded-xl p-5 flex gap-4">
            <Clock className="h-5 w-5 text-secondary-accent shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-dark text-sm">Response Time</h3>
              <p className="text-dark/60 text-sm mt-0.5">
                We typically respond within 24 hours on business days.
              </p>
            </div>
          </div>
          <div className="bg-white border border-yellow/60 rounded-xl p-5 flex gap-4">
            <MessageSquare className="h-5 w-5 text-secondary-accent shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-dark text-sm">What to Include</h3>
              <p className="text-dark/60 text-sm mt-0.5">
                Your account email and a description of the issue helps us respond faster.
              </p>
            </div>
          </div>
        </div>

        {/* Refund link */}
        <p className="text-center text-sm text-dark/50">
          Looking for a refund?{' '}
          <Link href="/refund" className="text-primary hover:underline">
            Visit our refund page
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  )
}
