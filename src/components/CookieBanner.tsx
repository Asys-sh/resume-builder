'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent')
        if (!consent) setVisible(true)
    }, [])

    function accept() {
        localStorage.setItem('cookie-consent', 'accepted')
        setVisible(false)
    }

    if (!visible) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-dark text-cream px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <p className="text-sm">
                We use essential cookies to keep you logged in and enable payments via Stripe.{' '}
                <Link href="/legal/cookie-policy" className="underline hover:text-primary transition-colors">
                    Learn more
                </Link>
            </p>
            <button
                onClick={accept}
                className="shrink-0 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
                Got it
            </button>
        </div>
    )
}
