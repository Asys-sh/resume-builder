'use client'

import { Edit, GitBranch, Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
    <div
      className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border-color/30 bg-white hover:border-primary/30 hover:bg-primary/[0.02] transition-all cursor-pointer"
      onClick={() => router.push(`/builder?resumeId=${resume.id}`)}
    >
      {/* Left: icon + labels */}
      <div className="flex items-center gap-2.5 min-w-0">
        <GitBranch className="h-3.5 w-3.5 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-main truncate">
            {resume.tailoredFor || contactName || 'Tailored version'}
          </p>
          <p className="text-xs text-text-subtle">{formatDate(resume.updatedAt)}</p>
        </div>
      </div>

      {/* Right: actions */}
      <div
        className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-text-subtle hover:text-primary hover:bg-primary/10"
          aria-label="Edit"
          onClick={() => router.push(`/builder?resumeId=${resume.id}`)}
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-text-subtle hover:text-red-500 hover:bg-red-50"
          aria-label="Delete"
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
