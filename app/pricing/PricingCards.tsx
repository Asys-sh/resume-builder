'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Check, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

const freePlanFeatures = [
	'100 AI assists per month',
	'All resume templates',
	'PDF & Word export',
	'Cover letter generator',
]

const proPlanFeatures = [
	'Unlimited AI assists',
	'Priority AI processing',
	'All Free features',
	'Early access to new features',
]

const containerVariants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.15,
			delayChildren: 0.1,
		},
	},
}

const cardVariants = {
	hidden: { opacity: 0, y: 32 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.55, ease: 'easeOut' },
	},
}

interface PricingCardsProps {
	isAuthenticated: boolean
}

export default function PricingCards({ isAuthenticated }: PricingCardsProps) {
	return (
		<section className="px-4 pb-4 pt-2">
			<motion.div
				initial="hidden"
				animate="visible"
				variants={containerVariants}
				className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2"
			>
				{/* Free Plan */}
				<motion.div variants={cardVariants}>
					<Card className="flex h-full flex-col rounded-2xl border border-yellow bg-beige shadow-sm transition-shadow duration-300 hover:shadow-md">
						<CardHeader className="pb-4">
							<div className="mb-1 text-xs font-semibold uppercase tracking-widest text-dark/50">
								Free
							</div>
							<CardTitle className="flex items-end gap-1.5 text-4xl font-bold text-dark">
								€0
								<span className="mb-1 text-base font-normal text-dark/50">/ month</span>
							</CardTitle>
							<CardDescription className="mt-1 text-sm text-dark/60">
								Everything you need to build a standout resume and get started.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-1 flex-col justify-between gap-6">
							<ul className="flex flex-col gap-3">
								{freePlanFeatures.map((feature) => (
									<li key={feature} className="flex items-center gap-2.5 text-sm text-dark">
										<span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
											<Check className="h-3 w-3 text-primary" strokeWidth={3} />
										</span>
										{feature}
									</li>
								))}
							</ul>
							<Link href="/auth?login=false" className="block w-full">
								<Button
									variant="outline"
									size="lg"
									className="w-full rounded-lg border-2 border-yellow bg-cream font-bold text-dark hover:bg-yellow hover:border-primary/40"
								>
									Get Started Free
								</Button>
							</Link>
						</CardContent>
					</Card>
				</motion.div>

				{/* Pro Plan */}
				<motion.div variants={cardVariants} className="relative">
					{/* Most Popular badge */}
					<div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
						<span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1 text-xs font-bold text-dark shadow-sm">
							<Star className="h-3 w-3 fill-dark/70 text-dark/70" />
							Most Popular
						</span>
					</div>

					<Card className="flex h-full flex-col rounded-2xl border-2 border-primary bg-beige shadow-md transition-shadow duration-300 hover:shadow-lg">
						<CardHeader className="pb-4 pt-7">
							<div className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
								Pro
							</div>
							<CardTitle className="flex items-end gap-1.5 text-4xl font-bold text-dark">
								€9.99
								<span className="mb-1 text-base font-normal text-dark/50">/ month</span>
							</CardTitle>
							<CardDescription className="mt-1 text-sm text-dark/60">
								Unlimited AI power for serious job seekers who want results fast.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-1 flex-col justify-between gap-6">
							<ul className="flex flex-col gap-3">
								{proPlanFeatures.map((feature) => (
									<li key={feature} className="flex items-center gap-2.5 text-sm text-dark">
										<span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/30">
											<Check className="h-3 w-3 text-primary" strokeWidth={3} />
										</span>
										{feature}
									</li>
								))}
							</ul>
							<Link href={isAuthenticated ? '/dashboard' : '/auth?login=false'} className="block w-full">
								<Button
									size="lg"
									className="w-full rounded-lg bg-primary font-bold text-dark hover:bg-primary/90"
								>
									Get Started with Pro
								</Button>
							</Link>
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</section>
	)
}
