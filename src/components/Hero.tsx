'use client'

import { motion } from 'motion/react'
import Link from 'next/link'

interface HeroProps {
  isAuthenticated?: boolean
}

export default function Hero({ isAuthenticated = false }: HeroProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
      className="flex h-screen flex-col items-center justify-center bg-cream px-4 text-center"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col gap-2">
          {!isAuthenticated ? (
            <>
              <h1 className="text-4xl font-bold leading-tight tracking-tighter text-dark md:text-6xl lg:text-7xl">
                Build Your Professional Resume in Minutes.
              </h1>
              <h2 className="mx-auto max-w-2xl text-base font-normal text-dark/80 md:text-lg">
                Craft a standout resume with our easy-to-use tools, AI-powered suggestions, and
                professional templates.
              </h2>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold leading-tight tracking-tighter text-dark md:text-6xl lg:text-7xl">
                Ready to Land Your Dream Job?
              </h1>
              <h2 className="mx-auto max-w-2xl text-base font-normal text-dark/80 md:text-lg">
                Start a new resume or manage your existing ones from your dashboard.
              </h2>
            </>
          )}
        </div>
        <button
          type="button"
          className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-base font-bold text-dark hover:bg-primary/90"
        >
          <Link href={isAuthenticated ? '/dashboard' : '/auth?login=true'}>
            <span className="truncate">
              {isAuthenticated ? 'Create a New Resume' : 'Get Started Now'}
            </span>
          </Link>
        </button>
      </div>
    </motion.section>
  )
}
