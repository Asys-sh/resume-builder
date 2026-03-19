'use client'

import { ArrowLeft } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import LoginForm from '@/components/auth/LoginForm'
import RegisterForm from '@/components/auth/RegisterForm'

export default function AuthPage() {
  // get URL and parse params
  const params = useSearchParams()

  const [authMode, setAuthMode] = useState<'login' | 'register'>(
    params.get('login') === 'true' || params.has('error') || params.has('callbackUrl')
      ? 'login'
      : 'register',
  )

  return (
    <div className="bg-cream relative">
      <Link
        href="/"
        className="w-max self-baseline flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-secondary-accent/30 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Go back home
      </Link>
      <div className="flex-col relative flex min-h-screen w-full items-center justify-center bg-cream">
        {/* Go Back Home Button - Top Left */}
        <div className="w-full max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-1 gap-20 lg:grid-cols-2 lg:gap-32">
            {/* Left Column - Hero Panel */}
            <div className="flex flex-col items-center justify-center text-center lg:items-start lg:text-left">
              <div className="flex flex-col gap-6">
                <div
                  className="hidden aspect-square w-full max-w-md bg-contain bg-center bg-no-repeat lg:block"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC7ZOlkx03Qesrh1yAz_RHqTR0CYlktL4RoxdQeYuw5HrSsVF9VrFpCMh5pvcNPuXFc1M2ITwpprnhyFZpOceq8q6tymKgTvEXUB3mcTJe0wbURTqCFn5vEByXnUUO3UzgSyfScvwdO1PRHjPJvUqpLL-hoOjeCHQH1lEA3VB-vgDh3e8Bk790isZeHBbNk7-wkRzJJ1wOewYi9Gx6RLxQsvCUAdaxYqMccQNbDa1jCF6wytlc_MBTj-TUD3dhr7_pdnbG_btIBE6gK')",
                  }}
                  role="img"
                  aria-label="An abstract illustration of a person climbing a staircase of books and documents"
                />
                <div className="flex flex-col gap-2">
                  <h1 className="text-4xl font-black leading-tight tracking-tighter text-slate-800 sm:text-5xl">
                    Build Your Professional Future, One Resume at a Time.
                  </h1>
                  <p className="text-base font-normal leading-normal text-slate-600 sm:text-lg">
                    Effortlessly create, manage, and share your resume to land your dream job.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Form Container */}
            <div className="flex w-full items-center justify-center">
              <div className="flex w-full max-w-md flex-col rounded-xl border border-secondary-accent bg-beige p-6 shadow-lg sm:p-8">
                {/* Toggle UI */}
                <div className="flex px-0 py-3">
                  <div
                    className="flex h-12 flex-1 items-center justify-center rounded-lg bg-secondary-accent/50 p-1"
                    role="radiogroup"
                    aria-label="Authentication mode"
                  >
                    <label
                      htmlFor="login-toggle"
                      className={`flex h-full grow cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2 transition-colors ${
                        authMode === 'login'
                          ? 'bg-white text-slate-800 shadow-[0_0_4px_rgba(0,0,0,0.1)]'
                          : 'text-slate-600'
                      }`}
                    >
                      <span className="text-sm font-bold leading-normal">Login</span>
                      <input
                        id="login-toggle"
                        type="radio"
                        name="auth-toggle"
                        value="login"
                        checked={authMode === 'login'}
                        onChange={() => setAuthMode('login')}
                        className="invisible w-0"
                      />
                    </label>
                    <label
                      htmlFor="register-toggle"
                      className={`flex h-full grow cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2 transition-colors ${
                        authMode === 'register'
                          ? 'bg-white text-slate-800 shadow-[0_0_4px_rgba(0,0,0,0.1)]'
                          : 'text-slate-600'
                      }`}
                    >
                      <span className="text-sm font-bold leading-normal">Register</span>
                      <input
                        id="register-toggle"
                        type="radio"
                        name="auth-toggle"
                        value="register"
                        checked={authMode === 'register'}
                        onChange={() => setAuthMode('register')}
                        className="invisible w-0"
                      />
                    </label>
                  </div>
                </div>

                {/* Form Container */}
                <div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={authMode}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      {authMode === 'login' ? <LoginForm /> : <RegisterForm />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
