'use client'

import { CheckCircle2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="w-20 h-20 text-green-500" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>

          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your payment has been processed successfully.
          </p>

          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Session ID</p>
              <p className="text-xs font-mono text-gray-700 break-all">{sessionId}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>

            <p className="text-sm text-gray-500">
              Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
