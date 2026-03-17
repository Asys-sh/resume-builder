'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

function VerifyEmailContent() {
	const searchParams = useSearchParams()
	const token = searchParams.get('token')
	const email = searchParams.get('email')
	const router = useRouter()

	const [status, setStatus] = useState<'pending' | 'success' | 'error' | 'expired'>('pending')
	const [errorMessage, setErrorMessage] = useState('')
	const [isResending, setIsResending] = useState(false)
	const [resendSuccess, setResendSuccess] = useState(false)

	useEffect(() => {
		if (!token || !email) {
			setStatus('error')
			setErrorMessage('This verification link is invalid or missing required parameters.')
			return
		}

		const verify = async () => {
			try {
				const res = await fetch('/api/auth/verify-email', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token, email })
				})

				const data = await res.json()

				if (!res.ok) {
					if (data.error?.includes('expired')) {
						setStatus('expired')
					} else {
						setStatus('error')
					}
					setErrorMessage(data.error || 'Verification failed')
					return
				}

				setStatus('success')
				setTimeout(() => {
					router.push('/dashboard')
				}, 3000)
			} catch {
				setStatus('error')
				setErrorMessage('An unexpected error occurred. Please try again.')
			}
		}

		verify()
	}, [token, email, router])

	const handleResend = async () => {
		setIsResending(true)
		try {
			const res = await fetch('/api/auth/send-verification', { method: 'POST' })
			if (res.ok) {
				setResendSuccess(true)
			} else {
				const data = await res.json()
				setErrorMessage(data.error || 'Failed to resend verification email')
			}
		} catch {
			setErrorMessage('Failed to resend verification email')
		} finally {
			setIsResending(false)
		}
	}

	if (status === 'pending') {
		return (
			<div className="text-center bg-white p-10 rounded-2xl shadow-lg max-w-md w-full">
				<Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
				<h1 className="text-2xl font-bold text-slate-800">Verifying your email...</h1>
				<p className="mt-2 text-slate-600">Please wait a moment.</p>
			</div>
		)
	}

	if (status === 'success') {
		return (
			<div className="text-center bg-white p-10 rounded-2xl shadow-lg max-w-md w-full">
				<CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
				<h1 className="text-2xl font-bold text-slate-800">Email Verified!</h1>
				<p className="mt-2 text-slate-600">Your email has been verified successfully.</p>
				<p className="mt-4 text-sm text-slate-500">Redirecting to your dashboard...</p>
				<Link href="/dashboard" className="mt-4 inline-block text-primary hover:underline text-sm">
					Click here if not redirected
				</Link>
			</div>
		)
	}

	if (status === 'expired') {
		return (
			<div className="text-center bg-white p-10 rounded-2xl shadow-lg max-w-md w-full">
				<XCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
				<h1 className="text-2xl font-bold text-slate-800">Link Expired</h1>
				<p className="mt-2 text-slate-600">{errorMessage}</p>
				{resendSuccess ? (
					<div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
						<Mail className="h-5 w-5 text-green-600 mx-auto mb-1" />
						<p className="text-sm text-green-700 font-medium">New verification email sent! Check your inbox.</p>
					</div>
				) : (
					<Button
						className="mt-6 bg-primary text-white"
						onClick={handleResend}
						disabled={isResending}
					>
						{isResending ? (
							<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
						) : (
							<><Mail className="h-4 w-4 mr-2" />Resend Verification Email</>
						)}
					</Button>
				)}
			</div>
		)
	}

	// error state
	return (
		<div className="text-center bg-white p-10 rounded-2xl shadow-lg max-w-md w-full">
			<XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
			<h1 className="text-2xl font-bold text-slate-800">Verification Failed</h1>
			<p className="mt-2 text-slate-600">{errorMessage}</p>
			<Link href="/auth?login=true" className="mt-6 inline-block text-primary hover:underline text-sm">
				Return to Login
			</Link>
		</div>
	)
}

export default function VerifyEmailPage() {
	return (
		<div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 relative">
			<Link
				href="/"
				className="absolute top-8 left-8 flex items-center gap-2 text-slate-600 hover:text-slate-800"
			>
				<ArrowLeft className="h-4 w-4" />
				Go back home
			</Link>
			<Suspense fallback={
				<div className="text-center bg-white p-10 rounded-2xl shadow-lg max-w-md w-full">
					<Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
					<p className="text-slate-600">Loading...</p>
				</div>
			}>
				<VerifyEmailContent />
			</Suspense>
		</div>
	)
}
