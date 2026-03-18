import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getUserData } from '@/lib/auth-helper'
import DashboardClient from './DashboardClient'
import { getUsersResumes } from '@/lib/data'

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
	if (!user) {
		redirect('/auth?login=true')
	}
	const { resumes, total, hasMore } = await getUsersResumes(user.id)
	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<DashboardClient user={user} resumes={resumes} total={total} hasMore={hasMore} />
		</Suspense>
	)
}
