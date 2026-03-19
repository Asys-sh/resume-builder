'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/ui/form-input'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/password-reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to reset password')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/auth?login=true')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-red-500">Invalid Link</h1>
        <p className="mt-2 text-slate-600">
          This password reset link is invalid or missing a token.
        </p>
        <Link href="/auth?login=true" className="mt-4 inline-block text-primary hover:underline">
          Return to Login
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center bg-white p-8 rounded-xl shadow-lg">
        <span className="material-symbols-outlined text-6xl text-green-500 mb-4 block">
          check_circle
        </span>
        <h1 className="text-2xl font-bold text-slate-800">Password Reset Successful!</h1>
        <p className="mt-2 text-slate-600">You can now log in with your new password.</p>
        <p className="mt-4 text-sm text-slate-500">Redirecting to login...</p>
        <Link href="/auth?login=true" className="mt-4 inline-block text-primary hover:underline">
          Click here if not redirected
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-slate-800">Reset Password</h1>
        <p className="mt-2 text-slate-600">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          id="password"
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
          required
          icon="lock"
        />
        <FormInput
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required={true}
          error={error}
          icon="lock"
        />

        <Button
          type="submit"
          className="w-full h-12 bg-primary text-white font-bold"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 relative">
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Go back home
      </Link>
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}
