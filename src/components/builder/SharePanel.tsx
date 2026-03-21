'use client'

import { useEffect, useState } from 'react'
import { Globe, Lock, Copy, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SharePanelProps {
  resumeId: string | null
}

export function SharePanel({ resumeId }: SharePanelProps) {
  const [isPublic, setIsPublic] = useState(false)
  const [hideContactInfo, setHideContactInfo] = useState(true)
  const [publicSlug, setPublicSlug] = useState<string | null>(null)
  const [viewCount, setViewCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const shareUrl = publicSlug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${publicSlug}`
    : null

  // Load current share state on mount
  useEffect(() => {
    if (!resumeId) return
    fetch(`/api/resumes?resumeId=${resumeId}`)
      .then(r => r.json())
      .then(data => {
        setIsPublic(data.isPublic ?? false)
        setHideContactInfo(data.hideContactInfo ?? true)
        setPublicSlug(data.publicSlug ?? null)
        setViewCount(data.viewCount ?? 0)
        setIsInitialized(true)
      })
      .catch(() => setIsInitialized(true))
  }, [resumeId])

  const updateShare = async (newIsPublic: boolean, newHideContact: boolean) => {
    if (!resumeId) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/resumes/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          isPublic: newIsPublic,
          hideContactInfo: newHideContact,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update sharing settings')
      setIsPublic(newIsPublic)
      setHideContactInfo(newHideContact)
      setPublicSlug(data.publicSlug ?? null)
      if (newIsPublic) {
        toast.success('Resume is now public')
      } else {
        toast.success('Public link deactivated')
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update sharing settings')
      // Revert optimistic state
      setIsPublic(!newIsPublic)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePublic = () => {
    updateShare(!isPublic, hideContactInfo)
  }

  const handleToggleHideContact = () => {
    if (!isPublic) return
    updateShare(isPublic, !hideContactInfo)
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  if (!resumeId) {
    return (
      <div className="p-4 rounded-lg bg-border-color/10 border border-border-color/30 text-center">
        <p className="text-sm text-text-subtle">Save your resume first to enable sharing.</p>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center gap-2 text-text-subtle text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main toggle */}
      <div className={cn(
        'flex items-center justify-between p-4 rounded-xl border transition-colors',
        isPublic
          ? 'bg-primary/5 border-primary/30'
          : 'bg-border-color/10 border-border-color/30'
      )}>
        <div className="flex items-center gap-3">
          {isPublic
            ? <Globe className="h-5 w-5 text-primary shrink-0" />
            : <Lock className="h-5 w-5 text-text-subtle shrink-0" />
          }
          <div>
            <p className="text-sm font-semibold text-text-main">
              {isPublic ? 'Publicly shared' : 'Private'}
            </p>
            <p className="text-xs text-text-subtle">
              {isPublic
                ? 'Anyone with the link can view this resume'
                : 'Only you can view this resume'
              }
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleTogglePublic}
          disabled={isLoading}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            isPublic ? 'bg-primary' : 'bg-border-color/60',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
          role="switch"
          aria-checked={isPublic}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200',
              isPublic ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      {/* Share URL (visible when public) */}
      {isPublic && shareUrl && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 h-9 px-3 rounded-lg border border-border-color/50 bg-white text-sm text-text-main font-mono focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 h-9 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0"
            >
              {isCopied ? <><Check className="h-3.5 w-3.5" />Copied!</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
            </button>
          </div>

          {/* View count */}
          <p className="text-xs text-text-subtle pt-1">
            Viewed <span className="font-semibold text-text-main">{viewCount}</span> time{viewCount !== 1 ? 's' : ''}
          </p>

          {/* Hide contact info toggle */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <p className="text-sm font-medium text-text-main">Hide contact info on public page</p>
              <p className="text-xs text-text-subtle">Email, phone, address and links will not be visible</p>
            </div>
            <button
              type="button"
              onClick={handleToggleHideContact}
              disabled={isLoading}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ml-3',
                hideContactInfo ? 'bg-primary' : 'bg-border-color/60',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
              role="switch"
              aria-checked={hideContactInfo}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition duration-200',
                  hideContactInfo ? 'translate-x-4' : 'translate-x-0'
                )}
              />
            </button>
          </label>
        </div>
      )}
    </div>
  )
}
