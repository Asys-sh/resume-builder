'use client'

import { BuilderFormField } from '@/components/builder'
import { Button } from '@/components/ui/button'
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
import type { Education } from '@/stores/builder'

interface EducationCardProps {
  education: Education
  onUpdate: (field: keyof Education, value: any) => void
  onDelete: () => void
  index: number
}

export function EducationCard({ education, onUpdate, onDelete, index }: EducationCardProps) {
  // Helper to format Date object to YYYY-MM-DD string for input
  const formatDateForInput = (date: Date | null | string) => {
    if (!date) return ''
    // If it's already a string (legacy), return it
    if (typeof date === 'string') return date
    try {
      return date.toISOString().split('T')[0]
    } catch (e) {
      return ''
    }
  }

  return (
    <div className="p-6 bg-white/50 rounded-lg border border-border-color/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-text-main">Education {index + 1}</h3>
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="text-text-subtle hover:text-primary transition-colors"
              aria-label={`Delete education ${index + 1}`}
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this education?</DialogTitle>
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

      {/* Fields */}
      <div className="flex flex-col gap-6">
        {/* Row 1: Degree & Field of Study */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="min-w-40 flex-1">
            <BuilderFormField
              id={`degree-${education.id}`}
              label="Degree"
              value={education.degree}
              onChange={(e) => onUpdate('degree', e.target.value)}
              placeholder="e.g., Master of Business Administration (MBA)"
              required
            />
          </div>
          <div className="min-w-40 flex-1">
            <BuilderFormField
              id={`fieldOfStudy-${education.id}`}
              label="Field of Study"
              value={education.fieldOfStudy || ''}
              onChange={(e) => onUpdate('fieldOfStudy', e.target.value)}
              placeholder="e.g., Business Administration"
            />
          </div>
        </div>

        {/* Row 2: School/University */}
        <div>
          <BuilderFormField
            id={`school-${education.id}`}
            label="School/University"
            value={education.school}
            onChange={(e) => onUpdate('school', e.target.value)}
            placeholder="e.g., Stanford University"
            required
          />
        </div>

        {/* Row 3: Start Date, End Date, and GPA */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <DatePicker
              label="Start Date"
              value={formatDateForInput(education.startDate)}
              onChange={(e) =>
                onUpdate('startDate', e.target.value ? new Date(e.target.value) : new Date())
              }
            />
          </div>
          <div className="flex-1">
            <DatePicker
              label="End Date"
              value={formatDateForInput(education.endDate)}
              onChange={(e) =>
                onUpdate('endDate', e.target.value ? new Date(e.target.value) : null)
              }
            />
          </div>
          <div className="flex-1">
            <BuilderFormField
              id={`gpa-${education.id}`}
              label="GPA (Optional)"
              value={education.gpa || ''}
              onChange={(e) => onUpdate('gpa', e.target.value)}
              placeholder="e.g., 3.8"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
