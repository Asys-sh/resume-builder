'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { BuilderFormField, BuilderTextarea } from '@/components/builder'
import { Combobox } from '@/components/ui/combobox'
import { DatePicker } from '@/components/ui/date-picker'
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

  return (
    <div className="p-6 bg-white/50 rounded-lg border border-border-color/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-text-main">Experience {index + 1}</h3>
        <button
          type="button"
          onClick={onDelete}
          className="text-text-subtle hover:text-primary transition-colors"
          aria-label={`Delete experience ${index + 1}`}
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-6">
        {/* Row 1: Role & Company */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="min-w-40 flex-1 flex flex-col gap-2">
            <span className="text-base font-medium text-text-main">Role</span>
            <Combobox
              value={experience.role}
              onSelect={(value) => onUpdate('role', value)}
              placeholder="Select role"
              searchPlaceholder="Search roles..."
              staticOptions={jobs_title}
            />
          </div>
          <div className="min-w-40 flex-1">
            <BuilderFormField
              id={`company-${experience.id}`}
              label="Company"
              value={experience.company}
              onChange={(e) => onUpdate('company', e.target.value)}
              placeholder="e.g., Google"
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
        </div>
      </div>
    </div>
  )
}
