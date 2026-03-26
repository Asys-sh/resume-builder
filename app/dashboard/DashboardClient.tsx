'use client'

import type { User } from '@prisma-generated/client'
import { handleSignOut } from '@/lib/auth-client'
import {
  BookUser,
  Briefcase,
  CreditCard,
  Edit,
  FileText,
  Home,
  LogOut,
  Menu,
  PenTool,
  Plus,
  Settings,
  Sparkles,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ResumeCard } from '@/components/dashboard/ResumeCard'
import { SubscriptionModal } from '@/components/SubscriptionModal'
import { UsageDisplay } from '@/components/UsageDisplay'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { GroupedResumes } from '@/lib/data'
import { TailoredVersionRow } from '@/components/dashboard/TailoredVersionRow'
import BillingClient from './billing/BillingClient'
import ApplicationsView from './applications/page'
import CoverLettersView from './cover-letters/page'
import ProfilesClient from './profiles/ProfilesClient'
import SettingsClient from './settings/SettingsClient'
import { ChevronDown } from 'lucide-react'

type DashboardView = 'home' | 'cover-letters' | 'profiles' | 'billing' | 'settings' | 'applications'

interface DashboardClientProps {
  user: User
  grouped: GroupedResumes
  total: number
}

export default function DashboardClient({ user, grouped, total }: DashboardClientProps) {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)
  const searchParams = useSearchParams()
  const view = (searchParams.get('view') as DashboardView) ?? 'home'

  const handleDuplicated = () => {
    router.refresh()
  }

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const toggleCollapsed = (id: string) =>
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const userInitials =
    user?.name
      ?.split(' ')
      .map((w) => w[0].toUpperCase())
      .join('') ?? '?'
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  const navItems: { id: DashboardView; label: string; icon: React.ElementType; href: string }[] = [
    { id: 'home', label: 'Home', icon: Home, href: '/dashboard' },
    { id: 'cover-letters', label: 'Cover Letters', icon: Edit, href: '/dashboard?view=cover-letters' },
    { id: 'applications', label: 'Applications', icon: Briefcase, href: '/dashboard?view=applications' },
    { id: 'profiles', label: 'Saved Profiles', icon: BookUser, href: '/dashboard?view=profiles' },
    { id: 'billing', label: 'Billing', icon: CreditCard, href: '/dashboard?view=billing' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard?view=settings' },
  ]

  const SidebarContent = () => (
    <>
      <div className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="size-7 text-primary">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z M16 24A8 8 0 0 1 32 24A8 8 0 0 1 16 24Z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-dark">RoboResume</span>
        </Link>
      </div>
      <Separator />

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main navigation">
        {navItems.map(({ id, label, icon: Icon, href }) => (
          <Link key={id} href={href} onClick={() => setIsSidebarOpen(false)}>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-2 text-dark ${view === id ? 'bg-primary/10 border-l-3 border-primary text-primary font-semibold' : 'hover:bg-primary/5'}`}
              aria-current={view === id ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          </Link>
        ))}
        <Link href="/builder" onClick={() => setIsSidebarOpen(false)}>
          <Button variant="ghost" className="w-full justify-start gap-2 text-dark hover:bg-primary/5">
            <FileText className="h-4 w-4" />
            Resume Builder
          </Button>
        </Link>
      </nav>

      <div className="p-4 border-t border-yellow space-y-4">
        <UsageDisplay
          usageCount={user.usageCount}
          usageLimit={user.usageLimit}
          onClick={() => setIsSubscriptionModalOpen(true)}
        />
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? 'Profile'}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-primary/20 text-dark font-semibold">
                {userInitials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark truncate">{user.name}</p>
            <p className="text-xs text-dark/70 truncate">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => handleSignOut()}
            title="Sign out"
            className="shrink-0 p-1.5 rounded-lg text-dark/50 hover:text-dark hover:bg-yellow/60 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <div className="flex min-h-screen bg-cream">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex w-full flex-col"
        >
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50 bg-beige border-r border-yellow">
            <SidebarContent />
          </aside>

          {/* Mobile Top Bar */}
          <div className="md:hidden flex items-center px-3 py-2 bg-beige border-b border-yellow sticky top-0 z-40">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-beige">
                <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <span className="ml-2 text-sm font-semibold text-dark">RoboResume</span>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 md:ml-64 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {view === 'home' && (
                    <div className="space-y-8">
                      {/* Header */}
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-dark">
                            Hey, {firstName} 👋
                          </h1>
                          <p className="mt-1 text-dark/50 text-sm">
                            {total === 0
                              ? "Let's build your first resume."
                              : `You have ${total} resume${total !== 1 ? 's' : ''}.`}
                          </p>
                        </div>
                        <Link href="/builder" className="hidden md:block">
                          <Button className="gap-2 shrink-0">
                            <Plus className="h-4 w-4" />
                            New Resume
                          </Button>
                        </Link>
                      </div>

                      {/* Resumes */}
                      {total > 0 ? (
                        <div className="space-y-3">
                          <h2 className="text-xs font-bold uppercase tracking-widest text-dark/40">
                            Your Resumes
                          </h2>
                          <div className="flex flex-wrap gap-5 justify-center sm:justify-start">
                            {grouped.bases.map((base) => (
                              <div key={base.id} className="flex flex-col gap-2" style={{ width: '262px' }}>
                                <ResumeCard
                                  resume={base}
                                  onDeleted={() => router.refresh()}
                                  onDuplicated={handleDuplicated}
                                />
                                {base.children.length > 0 && (
                                  <div className="flex flex-col gap-1">
                                    <button
                                      type="button"
                                      onClick={() => toggleCollapsed(base.id)}
                                      className="flex items-center justify-between px-1 pt-1 pb-0.5 group/toggle"
                                    >
                                      <p className="text-[10px] font-bold text-dark/40 uppercase tracking-widest">
                                        {base.children.length} tailored version{base.children.length !== 1 ? 's' : ''}
                                      </p>
                                      <ChevronDown
                                        className={`h-3 w-3 text-dark/40 transition-transform duration-200 ${
                                          collapsedIds.has(base.id) ? '-rotate-90' : ''
                                        }`}
                                      />
                                    </button>
                                    {!collapsedIds.has(base.id) &&
                                      base.children.map((child) => (
                                        <TailoredVersionRow
                                          key={child.id}
                                          resume={child}
                                          onDeleted={() => router.refresh()}
                                        />
                                      ))}
                                  </div>
                                )}
                              </div>
                            ))}

                            {grouped.orphans.map((orphan) => (
                              <ResumeCard
                                key={orphan.id}
                                resume={orphan}
                                onDeleted={() => router.refresh()}
                                onDuplicated={handleDuplicated}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Empty state */
                        <div className="mt-16 flex flex-col items-center justify-center text-center gap-6">
                          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <FileText className="h-9 w-9 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xl font-semibold text-dark">No resumes yet</h3>
                            <p className="text-sm text-dark/50 max-w-xs">
                              Create your first resume and land your next opportunity.
                            </p>
                          </div>
                          <Link href="/builder">
                            <Button size="lg" className="gap-2">
                              <Sparkles className="h-4 w-4" />
                              Build my resume
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {view === 'profiles' && <ProfilesClient />}
                  {view === 'billing' && <BillingClient user={user} />}
                  {view === 'settings' && <SettingsClient />}
                  {view === 'cover-letters' && <CoverLettersView />}
                  {view === 'applications' && <ApplicationsView />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </motion.div>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-beige border-t border-yellow h-14 flex items-center justify-around md:hidden"
        aria-label="Mobile navigation"
      >
        {([
          { id: 'home' as DashboardView, label: 'Home', icon: Home, href: '/dashboard' },
          { id: 'cover-letters' as DashboardView, label: 'Letters', icon: FileText, href: '/dashboard?view=cover-letters' },
        ] as const).map(({ id, label, icon: Icon, href }) => (
          <Link
            key={id}
            href={href}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs ${view === id ? 'text-primary font-semibold' : 'text-dark/50'}`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}

        {/* Raised center + button */}
        <Link href="/builder" className="flex items-center justify-center -mt-5">
          <div className="relative flex items-center justify-center">
            <span className="absolute h-14 w-14 rounded-full border-2 border-primary/30 animate-pulse" />
            <div className="relative h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-4 border-beige">
              <Plus className="h-6 w-6" />
            </div>
          </div>
        </Link>

        {([
          { id: 'applications' as DashboardView, label: 'Applications', icon: Briefcase, href: '/dashboard?view=applications' },
        ] as const).map(({ id, label, icon: Icon, href }) => (
          <Link
            key={id}
            href={href}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs ${view === id ? 'text-primary font-semibold' : 'text-dark/50'}`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}
        <Link
          href="/builder"
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs text-dark/50"
        >
          <PenTool className="h-5 w-5" />
          <span>Builder</span>
        </Link>
      </nav>

      <SubscriptionModal
        open={isSubscriptionModalOpen}
        onOpenChange={setIsSubscriptionModalOpen}
        userId={user.id}
      />
    </>
  )
}
