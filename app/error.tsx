'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

interface ErrorPageProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function Error({ error, reset }: ErrorPageProps) {
	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100">
			<div className="max-w-md w-full mx-4">
				<div className="bg-white rounded-2xl shadow-xl p-8 text-center">
					<div className="flex justify-center mb-6">
						<AlertTriangle className="w-20 h-20 text-orange-500" />
					</div>

					<h1 className="text-3xl font-bold text-gray-900 mb-4">Something went wrong</h1>

					<p className="text-gray-600 mb-6">
						An unexpected error occurred. You can try again or return to the home page.
					</p>

					{error.digest && (
						<div className="bg-gray-50 rounded-lg p-3 mb-6">
							<p className="text-xs text-gray-400">Error ID: {error.digest}</p>
						</div>
					)}

					<div className="space-y-3">
						<button
							onClick={reset}
							className="w-full bg-primary hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-opacity flex items-center justify-center gap-2"
						>
							<RefreshCw className="w-5 h-5" />
							Try Again
						</button>

						<a
							href="/"
							className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 block"
						>
							<ArrowLeft className="w-5 h-5" />
							Back to Home
						</a>
					</div>
				</div>
			</div>
		</div>
	)
}
