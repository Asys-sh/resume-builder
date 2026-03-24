'use client'

import { handleGoogleSignIn } from '@/lib/auth-client'
import { Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FormInput } from '@/components/ui/form-input'

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: true,
  })
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
    terms?: string
    server?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)

  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: typeof errors = {}

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Please enter your full name (at least 2 characters)'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain an uppercase letter'
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain a lowercase letter'
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain a number'
    } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain a special character'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.agreeToTerms) {
      newErrors.terms = 'You must agree to the Terms of Service and Privacy Policy'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      if (newErrors.name) nameRef.current?.focus()
      else if (newErrors.email) emailRef.current?.focus()
      else if (newErrors.password) passwordRef.current?.focus()
      else if (newErrors.confirmPassword) confirmPasswordRef.current?.focus()
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          password: formData.password,
        }),
      })

      if (res.ok) {
        setRegisteredEmail(formData.email)
        return
      }

      // Try to parse error response
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        setErrors({ server: 'Registration failed. Please try again.' })
        setIsSubmitting(false)
        return
      }

      const data = await res.json()
      const errorMessage = data.message || 'Registration failed'

      if (data.error === 'InvalidEmail') {
        setErrors({ email: errorMessage })
        emailRef.current?.focus()
      } else if (data.error === 'WeakPassword') {
        setErrors({ password: errorMessage })
        passwordRef.current?.focus()
      } else if (data.error === 'UserExists') {
        setErrors({ email: 'An account with this email already exists' })
        emailRef.current?.focus()
      } else {
        setErrors({ server: errorMessage })
      }
      setIsSubmitting(false)
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({ server: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (registeredEmail) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Mail className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-slate-800">Check Your Email</h1>
        <p className="mt-3 text-base text-slate-600">
          We sent a verification link to{' '}
          <span className="font-semibold text-slate-800">{registeredEmail}</span>.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Click the link in the email to activate your account. It expires in 1 hour.
        </p>
        <p className="mt-6 text-sm text-slate-500">
          Already verified?{' '}
          <Link href="/auth?login=true" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-slate-800">Create Your Account</h1>
        <p className="mt-2 text-base text-slate-600">Join us and start building your future.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.server && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600"
          >
            {errors.server}
          </div>
        )}

        <FormInput
          ref={nameRef}
          id="name"
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          icon="person"
          disabled={isSubmitting}
        />

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
          disabled={isSubmitting}
        />

        <div className="space-y-2">
          <FormInput
            ref={passwordRef}
            id="password"
            label="Password"
            type="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            icon="lock"
            disabled={isSubmitting}
          />
          <PasswordStrength password={formData.password} />
        </div>

        <FormInput
          ref={confirmPasswordRef}
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          icon="lock"
          disabled={isSubmitting}
        />

        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="agreeToTerms"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) =>
                handleChange({
                  target: { name: 'agreeToTerms', type: 'checkbox', checked },
                } as React.ChangeEvent<HTMLInputElement>)
              }
              className={errors.terms ? 'border-red-400' : ''}
              aria-invalid={errors.terms ? 'true' : 'false'}
              aria-describedby={errors.terms ? 'terms-error' : undefined}
            />
            <p className="text-sm font-normal leading-relaxed">
              I agree to the{' '}
              <Link href="/legal/tos" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/legal/privacy_policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
          {errors.terms && (
            <p id="terms-error" role="alert" className="text-sm text-red-500">
              {errors.terms}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full mt-4 h-12 bg-primary text-white font-bold tracking-wide hover:bg-opacity-90"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">or</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={() => handleGoogleSignIn()}
          disabled={isSubmitting}
          className="mt-4 w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign up with Google
        </button>
      </form>
    </div>
  )
}
