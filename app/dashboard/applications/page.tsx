'use client'

import {
  Briefcase,
  Edit2,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  JobApplicationModal,
  type JobApplication,
} from '@/components/dashboard/JobApplicationModal'
import { Button } from '@/components/ui/button'

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

const STATUS_COLORS: Record<string, string> = {
  APPLIED:   'bg-blue-100 text-blue-800 border-blue-200',
  SCREENING: 'bg-purple-100 text-purple-800 border-purple-200',
  INTERVIEW: 'bg-amber-100 text-amber-800 border-amber-200',
  OFFER:     'bg-green-100 text-green-800 border-green-200',
  REJECTED:  'bg-red-100 text-red-800 border-red-200',
  WITHDRAWN: 'bg-gray-100 text-gray-600 border-gray-200',
}

const FILTER_TABS = ['All', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']

// ─── Component ────────────────────────────────────────────────────────────────

export default function ApplicationsView() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [filter, setFilter] = useState('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchApplications = async () => {
    setIsLoading(true)
    setFetchError(false)
    try {
      const res = await fetch('/api/job-applications')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setApplications(data.applications)
    } catch {
      setFetchError(true)
    } finally {
      setIsLoading(false)
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchApplications is stable
  useEffect(() => {
    fetchApplications()
  }, [])

  const handleSaved = (app: JobApplication) => {
    setApplications((prev) => {
      const idx = prev.findIndex((a) => a.id === app.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = app
        return next
      }
      return [app, ...prev]
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/job-applications/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setApplications((prev) => prev.filter((a) => a.id !== id))
        toast.success('Application deleted')
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to delete application')
      }
    } catch {
      toast.error('Failed to delete application')
    } finally {
      setDeletingId(null)
    }
  }

  const openCreate = () => {
    setEditingApp(null)
    setIsModalOpen(true)
  }

  const openEdit = (app: JobApplication) => {
    setEditingApp(app)
    setIsModalOpen(true)
  }

  const filtered =
    filter === 'All' ? applications : applications.filter((a) => a.status === filter)

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark">Job Applications</h1>
          <p className="text-dark/70 mt-1">Track every application in one place.</p>
        </div>
        <Button className="bg-primary text-dark font-bold" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Application
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const isActive = filter === tab
          const count =
            tab === 'All'
              ? applications.length
              : applications.filter((a) => a.status === tab).length
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                isActive
                  ? 'bg-primary text-dark border-primary'
                  : 'bg-white text-dark/70 border-yellow/70 hover:bg-yellow/30'
              }`}
            >
              {tab === 'All' ? 'All' : STATUS_LABELS[tab]} {count > 0 && `(${count})`}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-dark/40" />
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-dark/60">Failed to load applications.</p>
          <Button variant="outline" size="sm" onClick={fetchApplications} className="border-yellow">
            Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="w-16 h-16 bg-beige rounded-full flex items-center justify-center border border-yellow">
            <Briefcase className="h-8 w-8 text-dark/50" />
          </div>
          <div>
            <p className="font-semibold text-dark">
              {filter === 'All'
                ? 'No applications yet.'
                : `No ${STATUS_LABELS[filter]} applications.`}
            </p>
            <p className="text-sm text-dark/60 mt-1">
              {filter === 'All'
                ? 'Start tracking your job search!'
                : 'Try a different filter.'}
            </p>
          </div>
          {filter === 'All' && (
            <Button className="bg-primary text-dark font-bold" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Application
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-yellow bg-beige overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-yellow/60 bg-yellow/20">
                <th className="text-left px-4 py-3 font-semibold text-dark/70">Company / Role</th>
                <th className="text-left px-4 py-3 font-semibold text-dark/70">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-dark/70 hidden sm:table-cell">Applied</th>
                <th className="text-left px-4 py-3 font-semibold text-dark/70 hidden md:table-cell">Resume</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((app, idx) => (
                <tr
                  key={app.id}
                  className={`border-b border-yellow/30 last:border-0 hover:bg-yellow/10 transition-colors ${idx % 2 === 0 ? '' : 'bg-white/40'}`}
                >
                  {/* Company + Role */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-semibold text-dark">{app.company}</p>
                        <p className="text-dark/60 text-xs mt-0.5">{app.role}</p>
                      </div>
                      {app.jobUrl && (
                        <a
                          href={app.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-dark/40 hover:text-dark transition-colors"
                          title="View job posting"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[app.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
                    >
                      {STATUS_LABELS[app.status] ?? app.status}
                    </span>
                  </td>

                  {/* Applied date */}
                  <td className="px-4 py-3 text-dark/60 hidden sm:table-cell whitespace-nowrap">
                    {new Date(app.appliedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Linked resume */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    {app.resume ? (
                      <span className="inline-flex items-center rounded-full border border-yellow bg-yellow/40 px-2.5 py-0.5 text-xs font-medium text-dark truncate max-w-[120px]">
                        {app.resume.title || 'Resume'}
                      </span>
                    ) : (
                      <span className="text-dark/30 text-xs">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(app)}
                        className="h-8 w-8 p-0 text-dark/50 hover:text-dark hover:bg-yellow/60"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(app.id)}
                        disabled={deletingId === app.id}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        {deletingId === app.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <JobApplicationModal
          application={editingApp}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
