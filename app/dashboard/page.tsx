import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getUserData } from '@/lib/auth-helper'
import DashboardClient from './DashboardClient'
import { getUsersResumes } from '@/lib/data'

export default async function DashboardPage() {
	const user = await getUserData()
	if (!user) {
		redirect('/auth?login=true')
	}
	const resumes = await getUsersResumes(user.id)
	return (
		<Suspense>
			<DashboardClient user={user} resumes={resumes} />
		</Suspense>
	)
}
