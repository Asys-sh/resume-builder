'use client'

import { BarChart2, Check, Copy, Edit, Eye, GitBranch, Globe, Link2, Loader2, Lock, Share2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ResumeWithRelations } from '@/lib/data'
import { TEMPLATES } from '@/lib/templates'
import { deleteResume, duplicateResume } from '@/lib/utils'
import type { ResumeData } from '@/stores/builder'
import { AnalyticsModal } from '@/components/dashboard/AnalyticsModal'

// A4 page dimensions at 96 dpi
const PAGE_WIDTH = 794
// Scale factor: shrink the full-width page to fit inside the card preview area
const SCALE = 0.33
const PREVIEW_WIDTH = Math.round(PAGE_WIDTH * SCALE) // ~262px
const PREVIEW_HEIGHT = 220 // clip height of the card thumbnail

function mapToResumeData(resume: ResumeWithRelations): ResumeData {
  return {
    id: resume.id,
    title: resume.title,
    contactInfo: (resume.contactInfo as ResumeData['contactInfo']) ?? {
      fullName: '',
      headline: '',
      email: '',
      phone: '',
      address: '',
      links: [],
    },
    summary: resume.summary ?? '',
    experiences: resume.experiences,
    skills: resume.skills,
    education: resume.education,
    projects: resume.projects,
    certifications: resume.certifications,
    languages: resume.languages,
    awards: [],
    currentStep: 1,
    selectedTemplate: resume.template ?? 'modern',
  }
}

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Updated today'
  if (days === 1) return 'Updated yesterday'
  if (days < 7) return `Updated ${days} days ago`

  return `Updated ${new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: new Date(date).getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })}`
}

interface ResumeCardProps {
  resume: ResumeWithRelations
  onDeleted?: (id: string) => void
  onDuplicated?: () => void
  isTailored?: boolean
}

export function ResumeCard({ resume, onDeleted, onDuplicated, isTailored }: ResumeCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [tailoredForInput, setTailoredForInput] = useState('')
  const [isDuplicating, setIsDuplicating] = useState(false)
  const template = TEMPLATES.find((t) => t.id === (resume.template ?? 'modern')) ?? TEMPLATES[0]
  const TemplateComponent = template.component
  const resumeData = mapToResumeData(resume)

  const contactName = (resume.contactInfo as ResumeData['contactInfo'])?.fullName

  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false)

  // Quick share state
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isPublic, setIsPublic] = useState(resume.isPublic)
  const [publicSlug, setPublicSlug] = useState<string | null>(resume.publicSlug ?? null)
  const [isTogglingShare, setIsTogglingShare] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const shareUrl =
    publicSlug && typeof window !== 'undefined'
      ? `${window.location.origin}/r/${publicSlug}`
      : null

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

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const deleted = await deleteResume(resume.id)
      if (deleted) {
        toast.success('Resume deleted')
        onDeleted?.(resume.id)
      } else {
        toast.error('Failed to delete resume')
        setIsDeleting(false)
      }
    } catch {
      toast.error('Failed to delete resume')
      setIsDeleting(false)
    }
  }

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      const result = await duplicateResume(resume.id, tailoredForInput)
      if (result) {
        toast.success('Tailored copy created! Opening in builder…')
        setIsDuplicateDialogOpen(false)
        onDuplicated?.()
        router.push(`/builder?resumeId=${result.resumeId}`)
      } else {
        toast.error('Failed to create tailored copy')
      }
    } catch {
      toast.error('Failed to create tailored copy')
    } finally {
      setIsDuplicating(false)
    }
  }

  return (
    <div className="group relative flex flex-col rounded-xl border border-border-color/40 overflow-visible bg-white hover:shadow-lg hover:shadow-black/8 hover:border-primary/30 transition-all duration-200">
      {/* Tailored badge */}
      {isTailored && resume.tailoredFor && (
        <div className="px-2.5 py-1 bg-primary/10 border-b border-primary/20 flex items-center gap-1.5 rounded-t-xl">
          <GitBranch className="h-3 w-3 text-primary shrink-0" />
          <span className="text-xs font-semibold text-primary truncate">{resume.tailoredFor}</span>
        </div>
      )}

      {/* Live scaled preview */}
      <button
        type="button"
        className="relative overflow-hidden bg-gray-50 cursor-pointer rounded-t-xl text-left w-full"
        style={{ height: `${PREVIEW_HEIGHT}px`, width: `${PREVIEW_WIDTH}px` }}
        aria-label={`Open ${contactName || resume.title || 'Untitled Resume'} in editor`}
        onClick={() => router.push(`/builder?resumeId=${resume.id}`)}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${PAGE_WIDTH}px`,
            transform: `scale(${SCALE})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }}
        >
          <TemplateComponent resumeData={resumeData} />
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white text-primary text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm border border-primary/20 translate-y-1 group-hover:translate-y-0 transition-transform duration-200">
            Open in Editor
          </span>
        </div>
      </button>

      {/* Footer */}
      <div className="px-3.5 py-3 flex flex-col gap-2 border-t border-border-color/20">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-main truncate">
            {contactName || resume.title || 'Untitled Resume'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-text-subtle whitespace-nowrap">{formatDate(resume.updatedAt)}</p>
            {isPublic && resume.viewCount > 0 && (
              <p className="text-xs text-text-subtle flex items-center gap-1 whitespace-nowrap">
                <Eye className="h-3 w-3" />
                {resume.viewCount} view{resume.viewCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-text-subtle hover:text-primary hover:bg-primary/10"
            aria-label="Edit resume"
            onClick={() => router.push(`/builder?resumeId=${resume.id}`)}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          {/* Quick share button */}
          <Button
            size="icon"
            variant="ghost"
            className={`h-9 w-9 hover:bg-primary/10 transition-colors ${isPublic ? 'text-primary' : 'text-text-subtle hover:text-primary'}`}
            aria-label="Share resume"
            title="Share"
            onClick={() => setIsShareOpen(true)}
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>

          {/* Share dialog */}
          <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-xs bg-white border-border-color/50">
              <DialogHeader>
                <DialogTitle className="text-text-main">Share Resume</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                {/* Public toggle */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-sm text-text-main">
                    {isPublic ? (
                      <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-text-subtle shrink-0" />
                    )}
                    <span>{isPublic ? 'Public link' : 'Private'}</span>
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

                {/* URL copy row */}
                {isPublic && shareUrl && (
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-primary/5 border border-primary/20">
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
                  <p className="text-xs text-text-subtle">Toggle on to generate a public link.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-text-subtle hover:text-primary hover:bg-primary/10"
            aria-label="View analytics"
            title="Analytics"
            onClick={() => setShowAnalytics(true)}
          >
            <BarChart2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-text-subtle hover:text-primary hover:bg-primary/10"
            aria-label="Duplicate resume"
            title="Duplicate & Tailor"
            onClick={() => {
              setTailoredForInput('')
              setIsDuplicateDialogOpen(true)
            }}
          >
            <GitBranch className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-text-subtle hover:text-red-500 hover:bg-red-50"
            aria-label="Delete resume"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      <AnalyticsModal
        resumeId={resume.id}
        resumeTitle={resume.title || 'Resume'}
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />

      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="bg-background-light border-border-color/50 w-[calc(100vw-2rem)] max-w-xs">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-text-main text-base">Fork Resume</DialogTitle>
            <DialogDescription className="text-text-subtle text-xs">
              Optional: name this tailored copy.
            </DialogDescription>
          </DialogHeader>
          <input
            type="text"
            value={tailoredForInput}
            onChange={(e) => setTailoredForInput(e.target.value)}
            placeholder="e.g. Senior Engineer @ Google"
            maxLength={200}
            autoFocus
            className="w-full h-9 px-3 rounded-lg border border-border-color/50 bg-white text-sm text-text-main placeholder:text-text-subtle/60 focus:outline-none focus:border-primary/60 transition-colors"
            onKeyDown={(e) => { if (e.key === 'Enter') handleDuplicate() }}
          />
          <DialogFooter className="flex-row gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDuplicateDialogOpen(false)}
              disabled={isDuplicating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="flex-1 bg-primary text-white hover:bg-primary/90"
            >
              {isDuplicating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Create Copy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
