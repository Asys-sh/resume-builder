import { redirect } from 'next/navigation'
import { getUserData } from '@/lib/auth-helper'
import BillingClient from './BillingClient'

export default async function BillingPage() {
    const user = await getUserData()
    if (!user) redirect('/auth?login=true')
    return <BillingClient user={user} />
}
