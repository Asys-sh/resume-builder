'use client'

import type { User } from '@prisma-generated/client'
import { signOut } from '@robojs/auth/client'
import {
  Award,
  CreditCard,
  Edit,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Plus,
  Settings,
  TrendingUp,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { ResumeCard } from '@/components/dashboard/ResumeCard'
import { SubscriptionModal } from '@/components/SubscriptionModal'
import { UsageDisplay } from '@/components/UsageDisplay'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import type { ResumeWithRelations } from '@/lib/data'
import BillingClient from './billing/BillingClient'
import CoverLettersView from './cover-letters/page'
import SettingsClient from './settings/SettingsClient'

type DashboardView = 'home' | 'cover-letters' | 'billing' | 'settings'

interface DashboardClientProps {
  user: User
  resumes: ResumeWithRelations[]
  total: number
  hasMore: boolean
}

export default function DashboardClient({
  user,
  resumes: initialResumes,
  total,
  hasMore: initialHasMore,
}: DashboardClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)
  const [resumeList, setResumeList] = useState(initialResumes)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [nextPage, setNextPage] = useState(2)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const searchParams = useSearchParams()
  const view = (searchParams.get('view') as DashboardView) ?? 'home'

  const handleLoadMore = async () => {
    setIsLoadingMore(true)
    try {
      const res = await fetch(`/api/resumes?page=${nextPage}`)
      if (!res.ok) {
        toast.error('Failed to load more resumes')
        return
      }
      const data = await res.json()
      setResumeList((prev) => [...prev, ...data.resumes])
      setHasMore(data.hasMore)
      setNextPage((p) => p + 1)
    } catch {
      toast.error('Failed to load more resumes')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const userInitials =
    user?.name
      ?.split(' ')
      .map((w) => w[0].toUpperCase())
      .join('') ?? '?'
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  const navItems: { id: DashboardView; label: string; icon: React.ElementType; href: string }[] = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    {
      id: 'cover-letters',
      label: 'Cover Letters',
      icon: Edit,
      href: '/dashboard?view=cover-letters',
    },
    { id: 'billing', label: 'Billing', icon: CreditCard, href: '/dashboard?view=billing' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard?view=settings' },
  ]

  const SidebarContent = () => (
    <>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">{userInitials}</span>
          </div>
          <span className="text-lg font-semibold text-dark">RoboResume</span>
        </div>
      </div>
      <Separator />

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ id, label, icon: Icon, href }) => (
          <Link key={id} href={href} onClick={() => setIsSidebarOpen(false)}>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-2 text-dark ${view === id ? 'bg-yellow' : 'hover:bg-yellow/50'}`}
              aria-current={view === id ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          </Link>
        ))}
        <Link href="/builder" onClick={() => setIsSidebarOpen(false)}>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-dark hover:bg-yellow/50"
          >
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
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark truncate">{user.name}</p>
            <p className="text-xs text-dark/70 truncate">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
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

          {/* Mobile Sidebar */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden relative top-4 left-4 z-50"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-beige">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          {/* Main Content Area */}
          <main className="flex-1 md:ml-64 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
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
                      {/* Welcome */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                              {userInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h1 className="text-3xl font-bold text-dark">
                              Welcome back, {firstName}!
                            </h1>
                            <p className="text-dark/70">Ready to build your next resume?</p>
                          </div>
                        </div>
                        <Link href="/builder">
                          <Button size="lg" className="animate-pulse-soft">
                            <Plus className="mr-2 h-5 w-5" />
                            Create Resume
                          </Button>
                        </Link>
                      </div>

                      {/* Stats */}
                      <div className="grid gap-6 md:grid-cols-3">
                        <Card className="border border-yellow bg-yellow">
                          <CardHeader>
                            <CardTitle className="text-sm font-medium text-dark/70">
                              Total Resumes
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-secondary-accent" />
                              <p className="text-3xl font-bold text-dark">{total}</p>
                            </div>
                          </CardHeader>
                        </Card>
                        <Card className="border border-yellow bg-yellow">
                          <CardHeader>
                            <CardTitle className="text-sm font-medium text-dark/70">
                              AI Assists Used
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-secondary-accent" />
                              <p className="text-3xl font-bold text-dark">
                                {user.usageCount}/{user.usageLimit}
                              </p>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="w-full bg-black rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(user.usageCount / user.usageLimit) * 100}%` }}
                              />
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border border-yellow bg-yellow">
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <Award className="h-5 w-5 text-secondary-accent" />
                              <CardTitle>Upgrade to Pro</CardTitle>
                            </div>
                            <CardDescription>
                              Unlock unlimited resumes and AI features
                            </CardDescription>
                            <Link href="/dashboard?view=billing">
                              <Button variant="outline" size="sm" className="mt-4">
                                Learn More
                              </Button>
                            </Link>
                          </CardHeader>
                        </Card>
                      </div>

                      {/* Resumes */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-2xl font-bold text-dark">Your Resumes</h2>
                          {total > 0 && <span className="text-sm text-dark/50">{total} total</span>}
                        </div>
                        {resumeList.length > 0 ? (
                          <>
                            <div className="flex flex-wrap gap-5">
                              {resumeList.map((resume) => (
                                <ResumeCard key={resume.id} resume={resume} />
                              ))}
                            </div>
                            {hasMore && (
                              <div className="flex justify-center pt-2">
                                <Button
                                  variant="outline"
                                  onClick={handleLoadMore}
                                  disabled={isLoadingMore}
                                  className="border-yellow"
                                >
                                  {isLoadingMore ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Loading…
                                    </>
                                  ) : (
                                    'Load more resumes'
                                  )}
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <Card className="py-12 bg-none border-none shadow-none">
                            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                              <div className="w-16 h-16 bg-beige rounded-full flex items-center justify-center">
                                <FileText className="h-8 w-8 text-dark/70" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-dark">No resumes yet</h3>
                                <p className="text-sm text-dark/70 mt-1">
                                  Create your first resume to get started
                                </p>
                              </div>
                              <Link href="/builder">
                                <Button size="lg" className="mt-4">
                                  <Plus className="mr-2 h-5 w-5" />
                                  Create Resume
                                </Button>
                              </Link>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}

                  {view === 'billing' && <BillingClient user={user} />}
                  {view === 'settings' && <SettingsClient />}
                  {view === 'cover-letters' && <CoverLettersView />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </motion.div>
      </div>
      <SubscriptionModal
        open={isSubscriptionModalOpen}
        onOpenChange={setIsSubscriptionModalOpen}
        userId={user.id}
      />
    </>
  )
}
