'use client'

import { ArrowLeft, RefreshCw, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CancelPage() {
  const router = useRouter()

  const handleTryAgain = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <XCircle className="w-20 h-20 text-red-500" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Cancelled</h1>

          <p className="text-gray-600 mb-6">
            Your payment was cancelled. No charges were made to your account.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              If you experienced any issues during checkout, please try again or contact our support
              team.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleTryAgain}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>

            <button
              type="button"
              onClick={handleGoHome}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
