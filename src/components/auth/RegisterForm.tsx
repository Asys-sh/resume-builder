'use client'

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
      </form>
    </div>
  )
}
