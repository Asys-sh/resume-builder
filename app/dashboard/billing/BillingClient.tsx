'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Zap, CheckCircle2, XCircle, Calendar, TrendingUp, Crown, ArrowUpCircle, FileText, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { User } from '@prisma-generated/client'

interface Invoice {
	id: string
	date: number
	amount: number
	currency: string
	status: string | null
	pdf: string | null
	hostedUrl: string | null
}

interface BillingClientProps {
    user: User
}

function formatDate(date: Date | null): string {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

const FREE_FEATURES = [
    '100 AI assists per month',
    'Up to 3 resume templates',
    'PDF & DOCX export',
    'Cover letter generator (limited)',
]

const PRO_FEATURES = [
    'Unlimited AI assists',
    'All resume templates',
    'PDF & DOCX export',
    'Unlimited cover letters',
    'Priority support',
    'Early access to new features',
]

export default function BillingClient({ user }: BillingClientProps) {
    const router = useRouter()
    const [isPortalLoading, setIsPortalLoading] = useState(false)
    const [isUpgradeLoading, setIsUpgradeLoading] = useState(false)
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [invoicesLoading, setInvoicesLoading] = useState(false)

    useEffect(() => {
        if (user.stripeCustomerId) {
            setInvoicesLoading(true)
            fetch('/api/stripe/invoices')
                .then((r) => r.json())
                .then((data) => setInvoices(data.invoices ?? []))
                .catch(() => {})
                .finally(() => setInvoicesLoading(false))
        }
    }, [user.stripeCustomerId])

    const isPro = user.subscriptionStatus === 'ACTIVE'
    const isTrial = user.subscriptionStatus === 'TRIAL'
    const isTrialExpired = isTrial && user.billingPeriodEnd ? new Date() > new Date(user.billingPeriodEnd) : false
    const trialDaysLeft = isTrial && user.billingPeriodEnd && !isTrialExpired
        ? Math.max(0, Math.ceil((new Date(user.billingPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0
    const usagePercent = user.usageLimit > 0 ? Math.min((user.usageCount / user.usageLimit) * 100, 100) : 0

    const handleManageSubscription = async () => {
        setIsPortalLoading(true)
        try {
            const res = await fetch('/api/stripe/portal', { method: 'POST' })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Failed to open billing portal')
            }
            window.location.href = data.url
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to open billing portal')
        } finally {
            setIsPortalLoading(false)
        }
    }

    const handleUpgrade = async () => {
        const priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
        if (!priceId) {
            router.push('/pricing')
            return
        }
        setIsUpgradeLoading(true)
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId }),
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Failed to start checkout')
            }
            window.location.href = data.url
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to start checkout')
        } finally {
            setIsUpgradeLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Page Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h1 className="text-3xl font-bold text-dark mb-2">Billing & Subscription</h1>
                <p className="text-dark/70">Manage your plan, usage, and payment details.</p>
            </motion.div>

            {/* Trial Banner */}
            {isTrial && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                >
                    <div className={`rounded-xl border-2 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isTrialExpired ? 'border-red-200 bg-red-50' : 'border-primary/40 bg-primary/5'}`}>
                        <div>
                            <p className={`font-bold text-base ${isTrialExpired ? 'text-red-700' : 'text-dark'}`}>
                                {isTrialExpired ? 'Your trial has expired' : `Trial active — ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left`}
                            </p>
                            <p className="text-sm text-dark/60 mt-0.5">
                                {isTrialExpired
                                    ? 'You\'ve been moved to the free tier (100 AI assists/month). Upgrade to Pro for unlimited access.'
                                    : `You have ${user.usageLimit - user.usageCount} of ${user.usageLimit} trial AI assists remaining. Upgrade anytime for unlimited access.`}
                            </p>
                        </div>
                        <Button
                            onClick={handleUpgrade}
                            disabled={isUpgradeLoading}
                            size="sm"
                            className="bg-primary text-dark font-bold shrink-0"
                        >
                            <Zap className="mr-1.5 h-3.5 w-3.5" />
                            {isUpgradeLoading ? 'Loading...' : 'Upgrade to Pro'}
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Current Plan Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <Card className="border border-yellow bg-beige">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-secondary-accent" />
                            <CardTitle>Current Plan</CardTitle>
                        </div>
                        <CardDescription>Your active subscription details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Plan badge + status */}
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                                        isPro
                                            ? 'bg-primary/20 text-primary border border-primary/30'
                                            : isTrial
                                            ? 'bg-yellow/60 text-dark border border-yellow'
                                            : 'bg-dark/10 text-dark border border-dark/20'
                                    }`}
                                >
                                    {isPro ? (
                                        <>
                                            <Zap className="h-3.5 w-3.5" />
                                            Pro
                                        </>
                                    ) : isTrial ? (
                                        <>
                                            <Zap className="h-3.5 w-3.5" />
                                            Trial
                                        </>
                                    ) : (
                                        'Free'
                                    )}
                                </span>
                                <span className="text-dark/70 text-sm">
                                    {isPro ? 'Unlimited AI assists' : `${user.usageLimit} AI assists / month`}
                                </span>
                            </div>
                            {isPro && (
                                <span className="flex items-center gap-1.5 text-sm text-green-700 font-medium">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Active
                                </span>
                            )}
                            {!isPro && !isTrial && (
                                <span className="flex items-center gap-1.5 text-sm text-dark/50 font-medium">
                                    <XCircle className="h-4 w-4" />
                                    No active subscription
                                </span>
                            )}
                        </div>

                        {/* Billing period */}
                        {isPro && user.billingPeriodStart && user.billingPeriodEnd && (
                            <>
                                <Separator className="bg-yellow/50" />
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex items-center gap-2 text-sm text-dark/70">
                                        <Calendar className="h-4 w-4 text-secondary-accent" />
                                        <span>
                                            Billing period:{' '}
                                            <span className="text-dark font-medium">
                                                {formatDate(user.billingPeriodStart)} — {formatDate(user.billingPeriodEnd)}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-dark/70">
                                    <CreditCard className="h-4 w-4 text-secondary-accent" />
                                    <span>
                                        Next billing date:{' '}
                                        <span className="text-dark font-medium">{formatDate(user.billingPeriodEnd)}</span>
                                    </span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Usage Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Card className="border border-yellow bg-beige">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-secondary-accent" />
                            <CardTitle>Usage This Period</CardTitle>
                        </div>
                        <CardDescription>AI assists consumed in the current billing cycle.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-dark/70">AI Assists Used</span>
                            <span className="font-semibold text-dark">
                                {user.usageCount}
                                {isPro ? '' : ` / ${user.usageLimit}`}
                            </span>
                        </div>
                        {!isPro && (
                            <div className="space-y-1.5">
                                <div className="w-full bg-dark/10 rounded-full h-2.5">
                                    <div
                                        className={`h-2.5 rounded-full transition-all duration-500 ${
                                            usagePercent >= 90
                                                ? 'bg-red-500'
                                                : usagePercent >= 70
                                                ? 'bg-yellow-500'
                                                : 'bg-primary'
                                        }`}
                                        style={{ width: `${usagePercent}%` }}
                                    />
                                </div>
                                <p className="text-xs text-dark/50">
                                    {Math.round(usagePercent)}% of your monthly allowance used
                                </p>
                            </div>
                        )}
                        {isPro && (
                            <p className="text-sm text-dark/60 italic">
                                No limits on your Pro plan — use as many AI assists as you need.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Subscription Actions Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <Card className="border border-yellow bg-beige">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-secondary-accent" />
                            <CardTitle>Subscription Actions</CardTitle>
                        </div>
                        <CardDescription>
                            {isPro
                                ? 'Manage your subscription, update payment method, or cancel.'
                                : 'Upgrade to Pro to unlock unlimited AI assists and all features.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isPro ? (
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 border border-yellow rounded-lg bg-yellow/10">
                                <div>
                                    <p className="font-medium text-dark">Manage your subscription</p>
                                    <p className="text-sm text-dark/60 mt-0.5">
                                        Update payment method, view invoices, or cancel your plan via the Stripe portal.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleManageSubscription}
                                    disabled={isPortalLoading}
                                    className="bg-primary text-white shrink-0"
                                >
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    {isPortalLoading ? 'Opening...' : 'Manage Subscription'}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 border border-primary/30 rounded-lg bg-primary/5">
                                <div>
                                    <p className="font-medium text-dark">Upgrade to Pro</p>
                                    <p className="text-sm text-dark/60 mt-0.5">
                                        Get unlimited AI assists, all templates, and priority support.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleUpgrade}
                                    disabled={isUpgradeLoading}
                                    className="bg-primary text-white shrink-0"
                                >
                                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                                    {isUpgradeLoading ? 'Loading...' : 'Upgrade to Pro'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Invoice History Card */}
            {user.stripeCustomerId && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                >
                    <Card className="border border-yellow bg-beige">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-secondary-accent" />
                                <CardTitle>Invoice History</CardTitle>
                            </div>
                            <CardDescription>Your recent billing receipts.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {invoicesLoading ? (
                                <div className="flex items-center gap-2 text-dark/50 text-sm py-4">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading invoices...
                                </div>
                            ) : invoices.length === 0 ? (
                                <p className="text-sm text-dark/50 py-4">No invoices yet.</p>
                            ) : (
                                <ul className="divide-y divide-yellow/40">
                                    {invoices.map((inv) => (
                                        <li key={inv.id} className="flex items-center justify-between py-3 gap-4">
                                            <div className="text-sm">
                                                <p className="font-medium text-dark">
                                                    {new Date(inv.date * 1000).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                <p className="text-dark/60 mt-0.5 capitalize">
                                                    {inv.status} · {(inv.amount / 100).toFixed(2)} {inv.currency.toUpperCase()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                {inv.pdf && (
                                                    <a
                                                        href={inv.pdf}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        PDF <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                )}
                                                {inv.hostedUrl && (
                                                    <a
                                                        href={inv.hostedUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        View <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Plan Comparison Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <Card className="border border-yellow bg-beige">
                    <CardHeader>
                        <CardTitle>Plan Comparison</CardTitle>
                        <CardDescription>See what&apos;s included in each plan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Free Plan */}
                            <div
                                className={`rounded-lg border p-4 space-y-3 ${
                                    !isPro ? 'border-yellow bg-yellow/20' : 'border-yellow/40 bg-yellow/5'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-dark">Free</h3>
                                    {!isPro && (
                                        <span className="text-xs text-dark/60 font-medium bg-dark/10 px-2 py-0.5 rounded-full">
                                            Current
                                        </span>
                                    )}
                                </div>
                                <p className="text-2xl font-bold text-dark">
                                    $0<span className="text-sm font-normal text-dark/50"> / month</span>
                                </p>
                                <Separator className="bg-yellow/50" />
                                <ul className="space-y-2">
                                    {FREE_FEATURES.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2 text-sm text-dark/80">
                                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Pro Plan */}
                            <div
                                className={`rounded-lg border p-4 space-y-3 ${
                                    isPro ? 'border-primary bg-primary/5' : 'border-yellow/40 bg-yellow/5'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-dark flex items-center gap-1.5">
                                        <Zap className="h-4 w-4 text-primary" />
                                        Pro
                                    </h3>
                                    {isPro && (
                                        <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                            Current
                                        </span>
                                    )}
                                </div>
                                <p className="text-2xl font-bold text-dark">
                                    €9.99<span className="text-sm font-normal text-dark/50"> / month</span>
                                </p>
                                <Separator className="bg-yellow/50" />
                                <ul className="space-y-2">
                                    {PRO_FEATURES.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2 text-sm text-dark/80">
                                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                {!isPro && (
                                    <Button
                                        onClick={handleUpgrade}
                                        disabled={isUpgradeLoading}
                                        size="sm"
                                        className="w-full mt-2 bg-primary text-white"
                                    >
                                        {isUpgradeLoading ? 'Loading...' : 'Upgrade Now'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
