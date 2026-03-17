'use client'

import { useState, useRef, FormEvent, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/ui/form-input'
// import { Label } from '@/components/ui/label'
// import { Checkbox } from '@/components/ui/checkbox'
import { signIn, getCsrfToken } from '@robojs/auth/client'
import { useRouter, useSearchParams } from 'next/navigation'
import ForgotPasswordModal from './ForgotPasswordModal'

export default function LoginForm() {
	const [formData, setFormData] = useState({
		email: '',
		password: '',
		rememberMe: false
	})
	const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
	const router = useRouter()
	const searchParams = useSearchParams()
	const emailRef = useRef<HTMLInputElement>(null)
	const passwordRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (searchParams.get('error') === 'CredentialsSignin') {
			setErrors({ email: 'Invalid email or password' })
		}
	}, [searchParams])

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target
		setFormData({
			...formData,
			[name]: type === 'checkbox' ? checked : value
		})
	}

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		// Reset errors
		const newErrors: { email?: string; password?: string } = {}

		// Validate email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!formData.email || !emailRegex.test(formData.email)) {
			newErrors.email = 'Please enter a valid email address'
		}

		// Validate password
		if (!formData.password || formData.password.length < 8) {
			newErrors.password = 'Password must be at least 8 characters'
		}

		// Set errors if any
		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors)

			// Focus the first field with an error
			if (newErrors.email) {
				emailRef.current?.focus()
			} else if (newErrors.password) {
				passwordRef.current?.focus()
			}

			return
		}

		// Clear errors and submit
		setErrors({})
		setIsSubmitting(true)

		try {
			// Get CSRF token
			const csrfToken = await getCsrfToken()

			// Use Auth.js signIn with credentials provider
			const result = (await signIn('credentials', {
				email: formData.email,
				password: formData.password,
				csrfToken,
				redirect: false
			}))

			console.log('Sign in result:', result)

			// Check for error in URL if present
			if (result?.url) {
				try {
					const url = new URL(result.url, window.location.origin)
					const error = url.searchParams.get('error')

					if (error === 'CredentialsSignin') {
						setErrors({ email: 'Invalid email or password' })
						emailRef.current?.focus()
						setIsSubmitting(false)
						return
					}
				} catch (e) {
					// Ignore invalid URLs
					console.error('Error parsing redirect URL:', e)
				}
			}

			if (result?.ok) {
				// Login successful - redirect to home
				console.log('Login successful!')
				router.push('/')
				router.refresh() // Refresh to update session
			} else {
				// Unexpected response
				setErrors({ email: 'Login failed. Please try again.' })
				setIsSubmitting(false)
			}
		} catch (error) {
			console.error('Login error:', error)
			setErrors({ email: 'An unexpected error occurred. Please try again.' })
			setIsSubmitting(false)
		}
	}

	return (
		<div>
			{/* Header */}
			<div className="mb-8 text-center">
				<h1 className="text-3xl font-black text-slate-800">Welcome Back!</h1>
				<p className="mt-2 text-base text-slate-600">Please enter your details to sign in.</p>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-4">
				{/* Email Field */}
				<FormInput
					ref={emailRef}
					id="email"
					label="Email"
					type="email"
					placeholder="you@example.com"
					value={formData.email}
					onChange={handleChange}
					error={errors.email}
					icon="mail"
				/>

				{/* Password Field */}
				<FormInput
					ref={passwordRef}
					id="password"
					label="Password"
					type="password"
					placeholder="Enter your password"
					value={formData.password}
					onChange={handleChange}
					error={errors.password}
					icon="lock"
					rightLabel={
						<button
							type="button"
							onClick={() => setIsForgotPasswordOpen(true)}
							className="text-sm text-primary hover:underline bg-transparent border-none p-0 cursor-pointer font-normal"
						>
							Forgot password?
						</button>
					}
				/>

				{/* Remember Me Checkbox */}
				{/* <div className="flex items-center space-x-2">
					<Checkbox
						id="rememberMe"
						name="rememberMe"
						checked={formData.rememberMe}
						onCheckedChange={(checked) =>
							handleChange({
								target: { name: 'rememberMe', type: 'checkbox', checked }
							} as React.ChangeEvent<HTMLInputElement>)
						}
					/>
					<Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
						Remember me for 30 days
					</Label>
				</div> */}

				{/* Submit Button */}
				<Button
					type="submit"
					className="w-full mt-4 h-12 bg-primary text-white font-bold tracking-wide hover:bg-opacity-90"
					disabled={isSubmitting}
				>
					{isSubmitting ? 'Signing in...' : 'Sign In'}
				</Button>
			</form>

			<ForgotPasswordModal open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen} />
		</div>
	)
}
