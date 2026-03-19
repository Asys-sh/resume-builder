'use client'

import type { User } from '@prisma-generated/client'
import { signOut } from 'next-auth/react'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useState } from 'react'

interface NavbarProps {
  isAuthenticated?: boolean
  user?: User
}

export default function Navbar({ isAuthenticated = false, user }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-yellow bg-cream/80 px-4 py-3 backdrop-blur-sm sm:px-8 md:px-16 lg:px-24"
      >
        <div className="flex items-center gap-4 text-dark">
          <div className="size-7 text-primary">
            <svg
              fill="currentColor"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z M16 24A8 8 0 0 1 32 24A8 8 0 0 1 16 24Z"
              />
            </svg>
          </div>
          <Link href={isAuthenticated ? '/dashboard' : '/'}>
            <h2 className="text-xl font-bold tracking-tighter cursor-pointer">Robo Resume</h2>
          </Link>
        </div>

        {/* Desktop Menu */}
        {!isAuthenticated ? (
          <div className="hidden flex-1 items-center justify-end gap-2 md:flex">
            <Link
              href="/auth?login=true"
              //onClick={handleNavigation}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-transparent text-dark text-sm font-bold hover:bg-yellow"
            >
              <span className="truncate">Login</span>
            </Link>
            <Link
              href="/auth?login=false"
              //onClick={handleNavigation}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-dark text-sm font-bold hover:bg-primary/90"
            >
              <span className="truncate">Register</span>
            </Link>
          </div>
        ) : (
          <div className="hidden flex-1 items-center justify-end gap-4 md:flex">
            <Link
              href="/builder"
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-dark text-sm font-bold hover:bg-primary/90"
            >
              <span className="truncate">Create a Resume</span>
            </Link>
            <div className="group relative">
              <div
                role="img"
                className="h-10 w-10 cursor-pointer rounded-full bg-cover bg-center bg-no-repeat"
                aria-label="User profile avatar"
                style={{
                  backgroundImage: user?.image
                    ? `url("${user.image}")`
                    : 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAAkWZNtW9GGxfYSYMO-v5vVEi6aCMP4ToPr3JsiPSZbk-0pgQHyYEGykJg4neRGyjrlsnhb_9eHC097X30RNhdPStEeNj_pGtQUqMww6JDVCDivCw0SOPaN4JJqauMG62869tBKny38su70YSr71Ic6inhIsXS8IV7vOZYAdq3Ysln35JZYVRKVsAlwQZKpZllacdZvLaHrZxoLTYj5TjL_ZCbFivgTs9gveWylMvKhH3BNcz2cUOBX4b4u-BpDbl0jAvp1yeMgncP")',
                }}
              />
              <div className="absolute right-0 top-full mt-2 w-48 origin-top-right scale-95 transform-gpu rounded-lg bg-white p-2 opacity-0 shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-150 ease-in-out group-hover:scale-100 group-hover:opacity-100">
                <Link
                  href="/dashboard"
                  className="block w-full rounded px-4 py-2 text-left text-sm text-dark hover:bg-yellow"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="block w-full rounded px-4 py-2 text-left text-sm text-dark hover:bg-yellow"
                >
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="block w-full rounded px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex flex-col items-center justify-center gap-1.5 p-2 md:hidden"
          aria-label="Toggle menu"
        >
          <motion.span
            animate={mobileMenuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
            className="h-0.5 w-6 bg-dark transition-all"
          />
          <motion.span
            animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
            className="h-0.5 w-6 bg-dark transition-all"
          />
          <motion.span
            animate={mobileMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
            className="h-0.5 w-6 bg-dark transition-all"
          />
        </button>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-[57px] left-0 right-0 z-40 overflow-hidden border-b border-yellow bg-cream/95 backdrop-blur-sm md:hidden"
          >
            {!isAuthenticated ? (
              <div className="flex flex-col gap-2 p-4">
                <Link
                  href="/auth?login=true"
                  onClick={(e) => {
                    setMobileMenuOpen(false)
                  }}
                  className="flex w-full cursor-pointer items-center justify-center rounded-lg h-12 px-4 bg-transparent text-dark text-sm font-bold hover:bg-yellow"
                >
                  Login
                </Link>
                <Link
                  href="/auth?login=false"
                  onClick={(e) => {
                    setMobileMenuOpen(false)
                  }}
                  className="flex w-full cursor-pointer items-center justify-center rounded-lg h-12 px-4 bg-primary text-dark text-sm font-bold hover:bg-primary/90"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-4">
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-center rounded-lg h-12 px-4 bg-primary text-dark text-sm font-bold hover:bg-primary/90"
                >
                  Create a Resume
                </button>
                <div className="border-t border-yellow pt-2 mt-2">
                  <Link
                    href="/dashboard"
                    className="flex w-full items-center rounded px-4 py-3 text-sm text-dark hover:bg-yellow"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex w-full items-center rounded px-4 py-3 text-sm text-dark hover:bg-yellow"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex w-full items-center rounded px-4 py-3 text-sm text-red-500 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
