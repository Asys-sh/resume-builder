'use client'

import { handleGoogleSignIn, handleSignIn } from '@/lib/auth-client'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
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
      const result = await handleSignIn(formData.email, formData.password)

      if (!result.ok) {
        if (result.error === 'CredentialsSignin') {
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
        Continue with Google
      </button>

      <ForgotPasswordModal open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen} />
    </div>
  )
}
