'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { UsageDisplay } from '@/components/UsageDisplay'
import { SubscriptionModal } from '@/components/SubscriptionModal'
import { LayoutDashboard, FileText, Settings, Menu, Plus, Edit, Trash2, TrendingUp, Award, CreditCard } from 'lucide-react'
import { User } from '@prisma-generated/client'
import { Resume } from '@prisma-generated/client'
import { TemplatePreview } from '@/components/dashboard/TemplatePreview'
import { useRouter } from 'next/navigation'
import { deleteResume } from '@/lib/utils'
import { toast } from 'sonner'

interface DashboardClientProps {
	user: User
	resumes: Resume[]
}

export default function DashboardClient({ user, resumes }: DashboardClientProps) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)
	const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)

	const router = useRouter();

	const userInitials = user?.name?.split(' ').map((word) => word[0].toUpperCase()).join('') ?? '[Redacted]'
	const firstName = user?.name?.split(' ')[0] ?? '[Redacted]'

	const SidebarContent = () => (
		<>
			{/* Header Section */}
			<div className="p-4">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
						<span className="text-primary-foreground font-bold text-sm">{userInitials}</span>
					</div>
					<span className="text-lg font-semibold text-dark">RoboResume</span>
				</div>
			</div>
			<Separator />

			{/* Navigation Section */}
			<nav className="flex-1 space-y-1 px-3 py-4">
				<Link href="/dashboard" onClick={() => setIsSidebarOpen(false)}>
					<Button variant="ghost" className="w-full justify-start gap-2 bg-yellow text-dark" aria-current="page">
						<LayoutDashboard className="h-4 w-4" />
						Dashboard
					</Button>
				</Link>
				<Link href="/dashboard/builder" onClick={() => setIsSidebarOpen(false)}>
					<Button variant="ghost" className="w-full justify-start gap-2 text-dark hover:bg-yellow/50">
						<FileText className="h-4 w-4" />
						Resume Builder
					</Button>
				</Link>
				<Link href="/dashboard/cover-letters" onClick={() => setIsSidebarOpen(false)}>
					<Button variant="ghost" className="w-full justify-start gap-2 text-dark hover:bg-yellow/50">
						<Edit className="h-4 w-4" />
						Cover Letters
					</Button>
				</Link>
				<Link href="/dashboard/billing" onClick={() => setIsSidebarOpen(false)}>
					<Button variant="ghost" className="w-full justify-start gap-2 text-dark hover:bg-yellow/50">
						<CreditCard className="h-4 w-4" />
						Billing
					</Button>
				</Link>
				<Link href="/dashboard/settings" onClick={() => setIsSidebarOpen(false)}>
					<Button variant="ghost" className="w-full justify-start gap-2 text-dark hover:bg-yellow/50">
						<Settings className="h-4 w-4" />
						Settings
					</Button>
				</Link>
			</nav>

			{/* Footer Section */}
			<div className="p-4 border-t border-yellow space-y-4">
				<UsageDisplay usageCount={user.usageCount} usageLimit={user.usageLimit} onClick={() => setIsSubscriptionModalOpen(true)} />
				<div className="flex items-center gap-3">
					<Avatar className="h-10 w-10">
						<AvatarFallback>{userInitials}</AvatarFallback>
					</Avatar>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium text-dark truncate">{user.name}</p>
						<p className="text-xs text-dark/70 truncate">{user.email}</p>
					</div>
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

					{/* Mobile Sidebar (Sheet) */}
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
						<div className="max-w-7xl mx-auto space-y-8">
							{/* Welcome Section */}
							<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
								<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
									{/* Left Section: Greeting */}
									<div className="flex items-center gap-4">
										<Avatar className="h-16 w-16">
											<AvatarFallback className="bg-primary text-primary-foreground text-xl">
												{userInitials}
											</AvatarFallback>
										</Avatar>
										<div>
											<h1 className="text-3xl font-bold text-dark">Welcome back, {firstName}!</h1>
											<p className="text-dark/70">Ready to build your next resume?</p>
										</div>
									</div>
									{/* Right Section: Create Button */}
									<Button size="lg" className="animate-pulse-soft">
										<Plus className="mr-2 h-5 w-5" />
										<Link href="/builder">Create Resume</Link>
									</Button>
								</div>
							</motion.div>

							{/* Stats Cards */}
							<div className="grid gap-6 md:grid-cols-3">
								{/* Card 1: Total Resumes */}
								<Card className="border border-yellow bg-yellow">
									<CardHeader>
										<CardTitle className="text-sm font-medium text-dark/70">Total Resumes</CardTitle>
										<div className="flex items-center gap-2">
											<FileText className="h-4 w-4 text-secondary-accent" />
											<p className="text-3xl font-bold text-dark">{resumes.length}</p>
										</div>
									</CardHeader>
								</Card>

								{/* Card 2: Usage Remaining */}
								<Card className="border border-yellow bg-yellow">
									<CardHeader>
										<CardTitle className="text-sm font-medium text-dark/70">AI Assists Used</CardTitle>
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

								{/* Card 3: Upgrade CTA */}
								<Card className="border border-yellow bg-yellow">
									<CardHeader>
										<div className="flex items-center gap-2">
											<Award className="h-5 w-5 text-secondary-accent" />
											<CardTitle>Upgrade to Pro</CardTitle>
										</div>
										<CardDescription>Unlock unlimited resumes and AI features</CardDescription>
										<Button variant="outline" size="sm" className="mt-4">
											Learn More
										</Button>
									</CardHeader>
								</Card>
							</div>

							{/* Resumes Section */}
							<div className="space-y-6">
								{/* Section Header */}
								<div className="flex items-center justify-between">
									<h2 className="text-2xl font-bold text-dark">Your Resumes</h2>
								</div>

								{/* Resume Grid */}
								{resumes.length > 0 ? (
									<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
										{resumes.map((resume: Resume) => {

											return (
												<motion.div
													key={resume.id}
													whileHover={{ scale: 1.1 }}
													transition={{ duration: 0.3 }}
													className="group relative"
												>
													{/* <ResumePreview > */}

													<TemplatePreview template={resume.template ?? "an error occurred"} />
													{/* Hover Buttons */}
													<div className="absolute top-4 right-4 flex gap-2 hover-reveal">
														<Button size="icon" variant="secondary" aria-label="Edit resume" onClick={() => router.push(`/builder?resumeId=${resume.id}`)}>
															<Edit className="h-4 w-4" />
														</Button>
														<Button size="icon" variant="destructive" aria-label="Delete resume" onClick={async () => {
															try {
																const deleted = await deleteResume(resume.id)
																if (deleted) {
																	toast.success("Resume deleted")
																	router.refresh()
																} else {
																	toast.error("Failed to delete resume")
																}
															} catch {
																toast.error("Failed to delete resume")
															}
														}}>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</motion.div>)
										})}
									</div>
								) : (
									/* Empty State */
									<Card className="py-12 bg-none border-none shadow-none">
										<CardContent className="flex flex-col items-center justify-center text-center space-y-4">
											<div className="w-16 h-16 bg-beige rounded-full flex items-center justify-center">
												<FileText className="h-8 w-8 text-dark/70" />
											</div>
											<div>
												<h3 className="text-lg font-semibold text-dark">No resumes yet</h3>
												<p className="text-sm text-dark/70 mt-1">Create your first resume to get started</p>
											</div>
											<Button size="lg" className="mt-4">
												<Plus className="mr-2 h-5 w-5" />
												<Link href="/builder">Create Resume</Link>
											</Button>
										</CardContent>
									</Card>
								)}
							</div>
						</div>
					</main>
				</motion.div>
			</div>
			<SubscriptionModal open={isSubscriptionModalOpen} onOpenChange={setIsSubscriptionModalOpen} userId={user.id} />
		</>
	)
}
