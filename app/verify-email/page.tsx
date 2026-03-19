'use client'

import { ArrowLeft, CheckCircle, Loader2, Mail, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function VerifyEmailContent() {
  const params = useSearchParams()
  const error = params.get('error')
  const verified = params.get('verified') === '1' || params.get('status') === 'ok'

  if (error) {
    const message =
      error === 'InvalidOrExpired'
        ? 'This verification link is invalid or has expired.'
        : error === 'MissingParams'
          ? 'This verification link is missing required parameters.'
          : error === 'UserNotFound'
            ? 'No account was found for this email address.'
            : 'Something went wrong during verification.'

    return (
      <div className="text-center bg-white p-10 rounded-2xl shadow-lg max-w-md w-full">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Verification Failed</h1>
        <p className="mt-3 text-slate-600">{message}</p>
        <p className="mt-2 text-sm text-slate-500">
          Try signing in — if your email isn't verified yet, you can request a new link.
        </p>
        <Link
          href="/auth?login=true"
          className="mt-6 inline-block text-primary hover:underline text-sm font-medium"
        >
          Go to Sign In
        </Link>
      </div>
    )
  }

  if (verified) {
    return (
      <div className="text-center bg-white p-10 rounded-2xl shadow-lg max-w-md w-full">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Email Verified!</h1>
        <p className="mt-3 text-slate-600">Your email has been verified. You can now sign in.</p>
        <Link
          href="/auth?login=true"
          className="mt-6 inline-block bg-primary text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="text-center bg-white p-10 rounded-2xl shadow-lg max-w-md w-full">
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-primary/10 p-4">
          <Mail className="h-10 w-10 text-primary" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-slate-800">Verify Your Email</h1>
      <p className="mt-3 text-slate-600">
        Please check your inbox and click the verification link to activate your account.
      </p>
      <p className="mt-2 text-sm text-slate-500">The link will expire in 1 hour.</p>
      <p className="mt-6 text-sm text-slate-500">
        Already verified?{' '}
        <Link href="/auth?login=true" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
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
      <Suspense
        fallback={
          <div className="text-center bg-white p-10 rounded-2xl shadow-lg max-w-md w-full">
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-slate-600">Loading...</p>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}
