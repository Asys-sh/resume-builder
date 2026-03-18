'use client'

import Link from 'next/link'
import { Save, Download, LayoutDashboard, LogOut } from 'lucide-react'
import { signOut } from '@robojs/auth/client'

interface BuilderHeaderProps {
    isSaving: boolean
    lastSaved: Date | null
    onSave: () => void
    onDownload: (format: 'pdf' | 'word' | 'text') => void
    userInitials?: string
}

export function BuilderHeader({ isSaving, lastSaved, onSave, onDownload, userInitials }: BuilderHeaderProps) {
    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border-color/50 px-6 md:px-10 py-3 bg-background-light sticky top-0 z-20">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 text-text-main hover:opacity-80 transition-opacity">
                <div className="size-7 text-primary">
                    <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z M16 24A8 8 0 0 1 32 24A8 8 0 0 1 16 24Z"
                        />
                    </svg>
                </div>
                <h2 className="text-lg font-bold leading-tight tracking-tight">Robo Resume</h2>
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {/* Dashboard link */}
                <Link
                    href="/dashboard"
                    className="hidden md:flex items-center gap-1.5 text-sm font-medium text-text-subtle hover:text-text-main transition-colors px-3 py-2 rounded-lg hover:bg-border-color/30"
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                </Link>

                {/* Save status */}
                {lastSaved && (
                    <span className="text-xs text-text-subtle hidden md:block">
                        {isSaving ? 'Saving…' : `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                )}

                {/* Save button */}
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 cursor-pointer rounded-xl h-10 px-4 bg-border-color/50 text-text-main text-sm font-semibold hover:bg-border-color/80 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">{isSaving ? 'Saving…' : 'Save'}</span>
                </button>

                {/* Download button */}
                <button
                    onClick={() => onDownload('pdf')}
                    className="flex items-center gap-2 cursor-pointer rounded-xl h-10 px-4 bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all"
                >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                </button>

                {/* User avatar */}
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{userInitials ?? '?'}</span>
                </div>

                {/* Sign out */}
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    title="Sign out"
                    className="flex items-center justify-center h-9 w-9 rounded-lg text-text-subtle hover:text-text-main hover:bg-border-color/40 active:scale-95 transition-all"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </header>
    )
}
