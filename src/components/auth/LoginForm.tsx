'use client'

import { getCsrfToken, signIn } from '@robojs/auth/client'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/ui/form-input'
import ForgotPasswordModal from './ForgotPasswordModal'

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<{ email?: string; password?: string; server?: string }>({})
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
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const newErrors: { email?: string; password?: string } = {}

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      if (newErrors.email) emailRef.current?.focus()
      else if (newErrors.password) passwordRef.current?.focus()
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      const csrfToken = await getCsrfToken()

      // redirect must be the 4th argument — not inside the options object
      const result = await signIn(
        'credentials',
        { email: formData.email, password: formData.password, csrfToken, callbackUrl: '/' },
        undefined,
        false,
      )

      if (result?.error || !result?.ok) {
        const error = result?.error ?? ''
        if (error === 'CredentialsSignin' || error.startsWith('CredentialsSignin')) {
          setErrors({ email: 'Invalid email or password' })
          emailRef.current?.focus()
        } else {
          setErrors({ server: 'Login failed. Please try again.' })
        }
        setIsSubmitting(false)
        return
      }

      // Success — hard navigate to dashboard to avoid RSC redirect loops
      window.location.replace('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      setErrors({ server: 'An unexpected error occurred. Please try again.' })
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-slate-800">Welcome Back!</h1>
        <p className="mt-2 text-base text-slate-600">Please enter your details to sign in.</p>
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
          disabled={isSubmitting}
          rightLabel={
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-sm text-primary hover:underline bg-transparent border-none p-0 cursor-pointer font-normal"
              disabled={isSubmitting}
            >
              Forgot password?
            </button>
          }
        />

        <Button
          type="submit"
          className="w-full mt-4 h-12 bg-primary text-white font-bold tracking-wide hover:bg-opacity-90"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      <ForgotPasswordModal open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen} />
    </div>
  )
}
