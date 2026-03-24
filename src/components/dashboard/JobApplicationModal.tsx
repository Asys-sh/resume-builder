'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Resume {
  id: string
  title: string
}

interface CoverLetter {
  id: string
  title: string
}

export interface JobApplication {
  id: string
  userId: string
  company: string
  role: string
  status: string
  appliedAt: string
  jobUrl: string | null
  notes: string | null
  salary: string | null
  location: string | null
  resumeId: string | null
  coverLetterId: string | null
  createdAt: string
  updatedAt: string
  resume?: { id: string; title: string } | null
  coverLetter?: { id: string; title: string } | null
}

const STATUS_OPTIONS = [
  { value: 'APPLIED', label: 'Applied' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
]

interface JobApplicationModalProps {
  application?: JobApplication | null
  onClose: () => void
  onSaved: (app: JobApplication) => void
}

function toDateInputValue(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toISOString().split('T')[0]
  } catch {
    return ''
  }
}

export function JobApplicationModal({ application, onClose, onSaved }: JobApplicationModalProps) {
  const isEditing = !!application

  const [form, setForm] = useState({
    company: application?.company ?? '',
    role: application?.role ?? '',
    status: application?.status ?? 'APPLIED',
    appliedAt: toDateInputValue(application?.appliedAt),
    jobUrl: application?.jobUrl ?? '',
    salary: application?.salary ?? '',
    location: application?.location ?? '',
    resumeId: application?.resumeId ?? '',
    coverLetterId: application?.coverLetterId ?? '',
    notes: application?.notes ?? '',
  })

  const [resumes, setResumes] = useState<Resume[]>([])
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetch('/api/resumes')
      .then((r) => r.json())
      .then((d) => setResumes(d.resumes ?? []))
      .catch(() => {})

    fetch('/api/cover-letters')
      .then((r) => r.json())
      .then((d) => setCoverLetters(d.coverLetters ?? []))
      .catch(() => {})
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const payload = {
      company: form.company,
      role: form.role,
      status: form.status,
      jobUrl: form.jobUrl || undefined,
      salary: form.salary || undefined,
      location: form.location || undefined,
      resumeId: form.resumeId || undefined,
      coverLetterId: form.coverLetterId || undefined,
      notes: form.notes || undefined,
      appliedAt: form.appliedAt ? new Date(form.appliedAt).toISOString() : undefined,
    }

    try {
      const url = isEditing
        ? `/api/job-applications/${application.id}`
        : '/api/job-applications'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to save application')
        return
      }

      toast.success(isEditing ? 'Application updated' : 'Application added')
      onSaved(data.application)
      onClose()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass =
    'w-full h-10 rounded-xl border border-yellow/70 bg-white px-3 text-sm text-dark placeholder:text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors'

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-beige border-yellow">
        <DialogHeader>
          <DialogTitle className="text-dark">
            {isEditing ? 'Edit Application' : 'Add Application'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="company" className="text-sm font-medium text-dark">
                Company <span className="text-red-500">*</span>
              </label>
              <input
                id="company"
                name="company"
                value={form.company}
                onChange={handleChange}
                required
                placeholder="e.g. Acme Corp"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="role" className="text-sm font-medium text-dark">
                Role <span className="text-red-500">*</span>
              </label>
              <input
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                required
                placeholder="e.g. Software Engineer"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="status" className="text-sm font-medium text-dark">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="appliedAt" className="text-sm font-medium text-dark">
                Applied Date
              </label>
              <input
                id="appliedAt"
                name="appliedAt"
                type="date"
                value={form.appliedAt}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="jobUrl" className="text-sm font-medium text-dark">
              Job URL
            </label>
            <input
              id="jobUrl"
              name="jobUrl"
              type="text"
              value={form.jobUrl}
              onChange={handleChange}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="salary" className="text-sm font-medium text-dark">
                Salary
              </label>
              <input
                id="salary"
                name="salary"
                value={form.salary}
                onChange={handleChange}
                placeholder="$80k–100k"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="location" className="text-sm font-medium text-dark">
                Location
              </label>
              <input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Remote / New York, NY"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="resumeId" className="text-sm font-medium text-dark">
                Resume
              </label>
              <select
                id="resumeId"
                name="resumeId"
                value={form.resumeId}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">None</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title || 'Untitled Resume'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="coverLetterId" className="text-sm font-medium text-dark">
                Cover Letter
              </label>
              <select
                id="coverLetterId"
                name="coverLetterId"
                value={form.coverLetterId}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">None</option>
                {coverLetters.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.title || 'Untitled Cover Letter'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="notes" className="text-sm font-medium text-dark">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Recruiter name, interview notes, next steps..."
              rows={3}
              className="w-full min-h-[80px] rounded-xl border border-yellow/70 bg-white px-3 py-2 text-sm text-dark placeholder:text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="border-yellow"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-primary text-dark font-bold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Add Application'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
