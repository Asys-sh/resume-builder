import { ArrowRight, Brain, FileText, Zap } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'About — Landed',
  description:
    'Learn about Landed — the AI-powered resume builder built to help you land your next job faster.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
          <h1 className="text-5xl font-black text-dark mb-6 leading-tight">
            Built to get you hired, faster.
          </h1>
          <p className="text-xl text-dark/70 leading-relaxed">
            Landed is an AI-powered resume builder that helps job seekers create tailored,
            ATS-friendly resumes in minutes — not hours.
          </p>
        </section>

        {/* Story */}
        <section className="max-w-2xl mx-auto px-6 pb-16">
          <div className="bg-white border border-yellow/60 rounded-2xl p-8 space-y-4">
            <h2 className="text-2xl font-bold text-dark">Our Story</h2>
            <p className="text-dark/70 leading-relaxed">
              We built Landed because writing a resume is one of the most frustrating parts of
              job searching. You spend hours formatting, rewriting, and second-guessing every word —
              and it still might not pass an ATS filter.
            </p>
            <p className="text-dark/70 leading-relaxed">
              Our goal is simple: give everyone access to a great resume, regardless of their
              writing skills or design experience. With AI assistance, live previews, and one-click
              export, you can go from blank page to job application in under 10 minutes.
            </p>
          </div>
        </section>

        {/* What we offer */}
        <section className="max-w-3xl mx-auto px-6 pb-20">
          <h2 className="text-2xl font-bold text-dark mb-8 text-center">What we offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-yellow/60 rounded-2xl p-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="font-bold text-dark">AI-Powered Suggestions</h3>
              <p className="text-sm text-dark/60">
                Our AI rewrites your bullet points, tailors your summary, and optimises your resume
                for any job description.
              </p>
            </div>
            <div className="bg-white border border-yellow/60 rounded-2xl p-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="font-bold text-dark">Multiple Templates</h3>
              <p className="text-sm text-dark/60">
                Choose from professionally designed templates — Modern, Classic, Minimalist, and
                Creative — and export as PDF or DOCX.
              </p>
            </div>
            <div className="bg-white border border-yellow/60 rounded-2xl p-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="font-bold text-dark">Cover Letters</h3>
              <p className="text-sm text-dark/60">
                Generate a personalised cover letter from your resume and a job description in
                seconds.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-beige border-t border-yellow py-16 text-center px-6">
          <h2 className="text-3xl font-black text-dark mb-4">Ready to build your resume?</h2>
          <p className="text-dark/70 mb-8">
            It&apos;s free to get started — no credit card required.
          </p>
          <Link
            href="/auth?login=false"
            className="inline-flex items-center gap-2 bg-primary text-dark font-bold px-8 py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
