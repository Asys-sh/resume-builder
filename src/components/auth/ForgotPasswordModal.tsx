'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { FormInput } from '@/components/ui/form-input'

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  // Focus email input on modal open
  useEffect(() => {
    if (open && emailRef.current) {
      emailRef.current.focus()
    }
  }, [open])

  // Reset form state when modal closes
  useEffect(() => {
    if (!open) {
      setEmail('')
      setError('')
      setSuccess(false)
      setIsSubmitting(false)
    }
  }, [open])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      emailRef.current?.focus()
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/password-reset-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error('Failed to send reset email')
      }

      setSuccess(true)
    } catch (err) {
      setError('An error occurred. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-xl shadow-2xl max-w-lg bg-cream"
        aria-describedby="forgot-password-modal"
      >
        <DialogTitle className="text-sm">Forgot password</DialogTitle>
        <div className="px-6 pb-10 sm:px-10 md:px-12">
          {success ? (
            // Success state
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-6xl text-[#d4a373] mb-4 block">
                check_circle
              </span>
              <h2 className="text-2xl font-black text-slate-800 mb-4">Check Your Email</h2>
              <p className="text-base text-slate-600">
                If an account with that email exists, a password reset link has been sent.
              </p>
            </div>
          ) : (
            // Form state
            <>
              <div className="text-center mb-8">
                <h2 className="text-4xl font-black text-slate-800 mb-2">Reset Your Password</h2>
                <p className="text-base text-slate-600">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <FormInput
                    ref={emailRef}
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon="mail"
                    aria-label="Email address"
                    aria-invalid={!!error}
                    aria-describedby={error ? 'email-error' : undefined}
                    id={''}
                    label={''}
                  />
                  {error && (
                    <p id="email-error" role="alert" className="text-sm text-red-500 mt-2">
                      {error}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#d4a373] hover:bg-[#c89563] text-white font-semibold rounded-lg transition-colors"
                  disabled={isSubmitting}
                  aria-label={isSubmitting ? 'Sending reset link...' : 'Send reset link'}
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
