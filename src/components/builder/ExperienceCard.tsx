'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { BulletAnalyzer, BulletLibrary, BuilderFormField, BuilderTextarea } from '@/components/builder'
import { AutocompleteInput } from '@/components/ui/autocomplete-input'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { jobs_title } from '@/lib/arrays'
import type { Experience } from '@/stores/builder'

interface ExperienceCardProps {
  experience: Experience
  onUpdate: (field: keyof Experience, value: any) => void
  onDelete: () => void
  index: number
}

export function ExperienceCard({ experience, onUpdate, onDelete, index }: ExperienceCardProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleInsertBullet = (text: string) => {
    const current = experience.description?.trimEnd() || ''
    onUpdate('description', current ? `${current}\n- ${text}` : `- ${text}`)
  }

  const handleAIDescription = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'description',
          role: experience.role,
          company: experience.company,
          currentContent: experience.description,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || 'Failed to generate description')
        return
      }
      onUpdate('description', data.result)
      toast.success('Description generated!')
    } catch {
      toast.error('Failed to generate description')
    } finally {
      setIsGenerating(false)
    }
  }

  const collapseLabel =
    experience.role && experience.company
      ? `${experience.role} @ ${experience.company}`
      : experience.role || experience.company || `Experience ${index + 1}`

  return (
    <div className="bg-white/50 rounded-lg border border-border-color/50">
      {/* Header — always visible, clickable to collapse */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={() => setIsCollapsed((v) => !v)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-text-subtle" />
          ) : (
            <ChevronUp className="h-4 w-4 shrink-0 text-text-subtle" />
          )}
          <h3 className="text-lg font-bold text-text-main truncate">
            {isCollapsed ? collapseLabel : `Experience ${index + 1}`}
          </h3>
        </button>
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="ml-3 text-text-subtle hover:text-primary transition-colors shrink-0"
              aria-label={`Delete experience ${index + 1}`}
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this experience?</DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogTrigger asChild>
                <Button variant="outline">Keep</Button>
              </DialogTrigger>
              <Button variant="destructive" onClick={onDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Collapsible body */}
      {!isCollapsed && (
        <div className="px-6 pb-6 flex flex-col gap-6">
          {/* Row 1: Role & Company */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="min-w-40 flex-1 flex flex-col gap-2">
              <span className="text-base font-medium text-text-main">Role</span>
              <AutocompleteInput
                value={experience.role}
                onChange={(value) => onUpdate('role', value)}
                options={jobs_title}
                placeholder="e.g., Software Engineer"
              />
            </div>
            <div className="min-w-40 flex-1">
              <BuilderFormField
                id={`company-${experience.id}`}
                label="Company"
                value={experience.company}
                onChange={(e) => onUpdate('company', e.target.value)}
                placeholder="e.g., Google"
                required
              />
            </div>
          </div>

          {/* Row 2: Location & Dates */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="min-w-40 flex-1">
              <BuilderFormField
                id={`location-${experience.id}`}
                label="Location"
                value={experience.location || ''}
                onChange={(e) => onUpdate('location', e.target.value)}
                placeholder="e.g., San Francisco, CA"
              />
            </div>
            <div className="min-w-40 flex-1 flex gap-4 flex-col">
              <div className="flex-1">
                <DatePicker
                  label="Start Date"
                  value={
                    experience.startDate
                      ? new Date(experience.startDate).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    onUpdate('startDate', e.target.value ? new Date(e.target.value) : null)
                  }
                />
              </div>
              <div className="flex-1">
                <DatePicker
                  label="End Date"
                  value={
                    experience.endDate ? new Date(experience.endDate).toISOString().split('T')[0] : ''
                  }
                  onChange={(e) =>
                    onUpdate('endDate', e.target.value ? new Date(e.target.value) : null)
                  }
                />
              </div>
            </div>
          </div>

          {/* Row 3: Description */}
          <div>
            <BuilderTextarea
              id={`experience-description-${experience.id}`}
              label="Description"
              value={experience.description || ''}
              onChange={(e) => onUpdate('description', e.target.value)}
              placeholder="Describe your responsibilities and achievements..."
              rows={4}
              showAIButton={true}
              onAIClick={handleAIDescription}
              disabled={isGenerating}
            />
            {isGenerating && (
              <p className="text-xs text-text-subtle mt-1 animate-pulse">Generating description…</p>
            )}
            <BulletAnalyzer
              description={experience.description}
              onFix={(fixed) => onUpdate('description', fixed)}
              headerAction={
                <BulletLibrary role={experience.role} onInsert={handleInsertBullet} />
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
