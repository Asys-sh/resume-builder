'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Zap } from 'lucide-react'

interface SubscriptionModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	userId: string
}

// Define subscription plans
const PLANS = {
	FREE: {
		id: 'free',
		name: 'Free Trial',
		price: '€0',
		priceId: null, // No Stripe price needed for free tier
		features: ['100 AI assists per month', 'AI resume suggestions', 'Job description tailoring']
	},
	PRO: {
		id: 'pro',
		name: 'Pro',
		price: '€2.99',
		priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
		features: ['Unlimited AI assists', 'Priority AI processing', 'Advanced templates']
	}
}

export function SubscriptionModal({ open, onOpenChange, userId }: SubscriptionModalProps) {
	const [isLoading, setIsLoading] = useState(false)
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

	const handleSubscribe = async (plan: any) => {
		// Guard against empty userId
		if (!userId) {
			console.warn('Cannot proceed with subscription: userId is empty')
			return
		}

		try {
			setIsLoading(true)
			setSelectedPlanId(plan.id)

			const response = await fetch('/api/checkout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					priceId: plan.priceId,
					userId,
					mode: 'subscription'
				})
			})

			if (!response.ok) {
				throw new Error('Failed to create checkout session')
			}

			const data = await response.json()
			window.location.href = data.url
		} catch (error) {
			console.error('Subscription error:', error)
			toast.error('Failed to start checkout. Please try again.')
		} finally {
			setIsLoading(false)
			setSelectedPlanId(null)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Manage Subscription</DialogTitle>
					<DialogDescription>
						Choose a plan to unlock AI-powered resume features with monthly usage limits.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-6 md:grid-cols-2">
					{/* Plans will be added here in future implementation */}
					<Card className="border-2">
						<CardHeader>
							<Zap className="h-8 w-8 text-primary mx-auto" />
							<CardTitle className="text-center">{PLANS.FREE.name}</CardTitle>
							<CardDescription className="text-center text-lg font-semibold">
								{PLANS.FREE.price}/month
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ul className="space-y-2 text-sm text-muted-foreground mb-4">
								{PLANS.FREE.features.map((feature, idx) => (
									<li key={idx} className="flex items-center gap-2">
										<Check className="h-4 w-4 text-primary" />
										{feature}
									</li>
								))}
							</ul>
							<Button className="w-full" variant="outline" disabled>
								Current Plan
							</Button>
						</CardContent>
					</Card>

					<Card className="border-primary border-2 relative">
						<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
							Most Popular
						</div>
						<CardHeader>
							<Zap className="h-8 w-8 text-primary mx-auto" />
							<CardTitle className="text-center">{PLANS.PRO.name}</CardTitle>
							<CardDescription className="text-center text-lg font-semibold">
								{PLANS.PRO.price}/month
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ul className="space-y-2 text-sm text-muted-foreground mb-4">
								{PLANS.PRO.features.map((feature, idx) => (
									<li key={idx} className="flex items-center gap-2">
										<Check className="h-4 w-4 text-primary" />
										{feature}
									</li>
								))}
							</ul>
							<Button
								className="w-full"
								disabled={!userId || isLoading || !PLANS.PRO.priceId}
								onClick={() => handleSubscribe(PLANS.PRO)}
							>
								{isLoading && selectedPlanId === 'pro' ? 'Processing...' : 'Upgrade to Pro'}
							</Button>
						</CardContent>
					</Card>
				</div>

				<DialogFooter className="sm:justify-center">
					<p className="text-xs text-muted-foreground text-center">
						Secure payment powered by Stripe. Cancel anytime.
					</p>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
