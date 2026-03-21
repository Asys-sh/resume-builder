import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getUserData } from '@/lib/auth-helper'
import { getGroupedResumes } from '@/lib/data'
import DashboardClient from './DashboardClient'

function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen bg-cream">
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-beige border-r border-yellow animate-pulse" />
      <div className="flex-1 md:ml-64 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="h-16 w-64 rounded-xl bg-black/5 animate-pulse" />
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-black/5 animate-pulse" />
            ))}
          </div>
          <div className="flex flex-wrap gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-[262px] h-[310px] rounded-xl bg-black/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const user = await getUserData()
  if (!user) redirect('/auth?login=true')

  const grouped = await getGroupedResumes(user.id)
  const total =
    grouped.bases.length +
    grouped.orphans.length +
    grouped.bases.reduce((acc, b) => acc + b.children.length, 0)

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient user={user} grouped={grouped} total={total} />
    </Suspense>
  )
}
