'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy, Edit, GitBranch, Globe, Link2, Loader2, Lock, Share2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { deleteResume } from '@/lib/utils'
import type { ResumeWithRelations } from '@/lib/data'
import type { ResumeData } from '@/stores/builder'

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface TailoredVersionRowProps {
  resume: ResumeWithRelations
  onDeleted: () => void
}

export function TailoredVersionRow({ resume, onDeleted }: TailoredVersionRowProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const contactName = (resume.contactInfo as ResumeData['contactInfo'])?.fullName

  // Share state
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isPublic, setIsPublic] = useState(resume.isPublic)
  const [publicSlug, setPublicSlug] = useState<string | null>(resume.publicSlug ?? null)
  const [isTogglingShare, setIsTogglingShare] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)

  const shareUrl =
    publicSlug && typeof window !== 'undefined'
      ? `${window.location.origin}/r/${publicSlug}`
      : null

  useEffect(() => {
    if (!isShareOpen) return
    function handleClick(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setIsShareOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isShareOpen])

  const handleTogglePublic = async () => {
    setIsTogglingShare(true)
    try {
      const res = await fetch('/api/resumes/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: resume.id,
          isPublic: !isPublic,
          hideContactInfo: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || 'Failed to update sharing')
        return
      }
      setIsPublic(!isPublic)
      if (data.publicSlug) setPublicSlug(data.publicSlug)
    } catch {
      toast.error('Failed to update sharing')
    } finally {
      setIsTogglingShare(false)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast.error('Could not copy link')
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeleting(true)
    try {
      const deleted = await deleteResume(resume.id)
      if (deleted) {
        toast.success('Tailored version deleted')
        onDeleted()
      } else {
        toast.error('Failed to delete')
        setIsDeleting(false)
      }
    } catch {
      toast.error('Failed to delete')
      setIsDeleting(false)
    }
  }

  return (
    <div className="group relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border-color/30 bg-white hover:border-primary/30 hover:bg-primary/[0.02] transition-all">
      {/* Left: icon + labels — clickable */}
      <button
        type="button"
        className="flex items-center gap-2.5 min-w-0 text-left w-full cursor-pointer bg-transparent border-none p-0"
        aria-label={`Open ${resume.tailoredFor || contactName || 'Tailored version'} in editor`}
        onClick={() => router.push(`/builder?resumeId=${resume.id}`)}
      >
        <GitBranch className="h-3.5 w-3.5 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-main truncate">
            {resume.tailoredFor || contactName || 'Tailored version'}
          </p>
          <p className="text-xs text-text-subtle">{formatDate(resume.updatedAt)}</p>
        </div>
      </button>

      {/* Right: actions */}
      <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 text-text-subtle hover:text-primary hover:bg-primary/10"
          aria-label="Edit resume"
          onClick={() => router.push(`/builder?resumeId=${resume.id}`)}
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>

        {/* Share button */}
        <div className="relative" ref={shareRef}>
          <Button
            size="icon"
            variant="ghost"
            className={`h-9 w-9 hover:bg-primary/10 transition-colors ${isPublic ? 'text-primary' : 'text-text-subtle hover:text-primary'}`}
            aria-label="Share resume"
            title="Share"
            onClick={() => setIsShareOpen((v) => !v)}
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>

          <AnimatePresence>
            {isShareOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                role="dialog"
                aria-label="Share settings"
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Escape') setIsShareOpen(false) }}
                className="absolute right-0 bottom-full mb-2 z-50 w-64 bg-white border border-border-color/50 rounded-xl shadow-xl p-3 flex flex-col gap-2.5"
              >
                <p className="text-xs font-bold text-text-main uppercase tracking-widest">Share</p>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-sm text-text-main">
                    {isPublic ? (
                      <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-text-subtle shrink-0" />
                    )}
                    <span>{isPublic ? 'Public' : 'Private'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTogglePublic}
                    disabled={isTogglingShare}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${isPublic ? 'bg-primary' : 'bg-border-color/60'}`}
                    role="switch"
                    aria-checked={isPublic}
                    aria-label="Toggle public sharing"
                  >
                    {isTogglingShare ? (
                      <Loader2 className="absolute inset-0 m-auto h-3 w-3 animate-spin text-white" />
                    ) : (
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${isPublic ? 'translate-x-4' : 'translate-x-0'}`}
                      />
                    )}
                  </button>
                </div>

                {isPublic && shareUrl && (
                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-primary/5 border border-primary/20">
                    <Link2 className="h-3 w-3 text-primary shrink-0" />
                    <p className="text-xs text-primary truncate flex-1">{shareUrl}</p>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="shrink-0 p-1 rounded hover:bg-primary/10 transition-colors"
                      aria-label="Copy link"
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-primary" />
                      )}
                    </button>
                  </div>
                )}

                {!isPublic && (
                  <p className="text-xs text-text-subtle">Enable sharing to get a public link.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 text-text-subtle hover:text-red-500 hover:bg-red-50"
          aria-label="Delete resume"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Trash2 className="h-3.5 w-3.5" />
          }
        </Button>
      </div>
    </div>
  )
}
