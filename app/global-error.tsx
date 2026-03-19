'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100 font-sans">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="flex justify-center mb-6">
                <AlertTriangle className="w-20 h-20 text-red-500" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">Critical Error</h1>

              <p className="text-gray-600 mb-6">
                A critical error occurred. Please refresh the page or contact support if the problem
                persists.
              </p>

              {error.digest && (
                <div className="bg-gray-50 rounded-lg p-3 mb-6">
                  <p className="text-xs text-gray-400">Error ID: {error.digest}</p>
                </div>
              )}

              <button
                type="button"
                onClick={reset}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
