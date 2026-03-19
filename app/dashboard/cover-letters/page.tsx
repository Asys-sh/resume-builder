'use client'

import { FileText, Loader2, Plus, Save, Trash2, Wand2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface CoverLetter {
  id: string
  title: string
  jobTitle?: string
  companyName?: string
  updatedAt: string
  status: string
}

const emptyForm = { jobTitle: '', companyName: '', jobDescription: '', content: '' }

export default function CoverLettersView() {
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [showCreator, setShowCreator] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchCoverLetters is stable
  useEffect(() => {
    fetchCoverLetters()
  }, [])

  const fetchCoverLetters = async () => {
    setIsLoading(true)
    setFetchError(false)
    try {
      const res = await fetch('/api/cover-letters')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setCoverLetters(data.coverLetters)
    } catch {
      setFetchError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!form.jobDescription.trim()) {
      toast.error('Please enter a job description first')
      return
    }
    setIsGenerating(true)
    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: form.jobDescription,
          jobTitle: form.jobTitle,
          companyName: form.companyName,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || 'Failed to generate cover letter')
        return
      }
      setForm((prev) => ({ ...prev, content: data.content }))
      toast.success('Cover letter generated!')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!form.content.trim()) {
      toast.error('Nothing to save — generate a cover letter first')
      return
    }
    setIsSaving(true)
    try {
      const title =
        form.jobTitle && form.companyName
          ? `${form.jobTitle} at ${form.companyName}`
          : form.jobTitle || form.companyName || 'Untitled Cover Letter'

      const res = await fetch('/api/cover-letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: form.content,
          jobTitle: form.jobTitle,
          companyName: form.companyName,
          jobDescription: form.jobDescription,
          status: 'draft',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to save cover letter')
        return
      }
      toast.success('Cover letter saved!')
      setForm(emptyForm)
      setShowCreator(false)
      fetchCoverLetters()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cover letter?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/cover-letters/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCoverLetters((prev) => prev.filter((cl) => cl.id !== id))
        toast.success('Cover letter deleted')
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to delete cover letter')
      }
    } catch {
      toast.error('Failed to delete cover letter')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark">Cover Letters</h1>
          <p className="text-dark/70 mt-1">Generate and manage tailored cover letters.</p>
        </div>
        {!showCreator && (
          <Button className="bg-primary text-dark font-bold" onClick={() => setShowCreator(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Cover Letter
          </Button>
        )}
      </div>

      {/* Inline creator */}
      {showCreator && (
        <div className="rounded-xl border border-yellow bg-beige p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-dark">New Cover Letter</h2>
            <button
              type="button"
              onClick={() => {
                setShowCreator(false)
                setForm(emptyForm)
              }}
              className="p-1.5 rounded-lg text-dark/50 hover:text-dark hover:bg-yellow/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Left: inputs */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="cl-job-title" className="text-sm font-medium text-dark">
                  Job Title
                </label>
                <input
                  id="cl-job-title"
                  value={form.jobTitle}
                  onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full h-11 rounded-xl border border-yellow/70 bg-white px-4 text-sm text-dark placeholder:text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cl-company-name" className="text-sm font-medium text-dark">
                  Company Name
                </label>
                <input
                  id="cl-company-name"
                  value={form.companyName}
                  onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                  placeholder="e.g. Acme Corp"
                  className="w-full h-11 rounded-xl border border-yellow/70 bg-white px-4 text-sm text-dark placeholder:text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cl-job-description" className="text-sm font-medium text-dark">
                  Job Description
                </label>
                <textarea
                  id="cl-job-description"
                  value={form.jobDescription}
                  onChange={(e) => setForm((p) => ({ ...p, jobDescription: e.target.value }))}
                  placeholder="Paste the full job description here..."
                  className="w-full min-h-[160px] rounded-xl border border-yellow/70 bg-white px-4 py-3 text-sm text-dark placeholder:text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !form.jobDescription.trim()}
                className="w-full bg-primary text-dark font-bold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>

            {/* Right: generated content */}
            <div className="space-y-1.5">
              <label htmlFor="cl-content" className="text-sm font-medium text-dark">
                Cover Letter
              </label>
              <textarea
                id="cl-content"
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                placeholder="Your cover letter will appear here — edit freely after generating."
                className="w-full min-h-[300px] rounded-xl border border-yellow/70 bg-white px-4 py-3 text-sm text-dark placeholder:text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1 border-t border-yellow/60">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreator(false)
                setForm(emptyForm)
              }}
              className="border-yellow"
              disabled={isSaving || isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !form.content.trim()}
              className="bg-primary text-dark font-bold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Cover Letter
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {!showCreator &&
        (isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-dark/40" />
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-dark/60">Failed to load cover letters.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCoverLetters}
              className="border-yellow"
            >
              Retry
            </Button>
          </div>
        ) : coverLetters.length === 0 && !showCreator ? (
          <Card className="py-12 border-none shadow-none bg-none">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-beige rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-dark/70" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-dark">No cover letters yet</h3>
                <p className="text-sm text-dark/70 mt-1">
                  Click "New Cover Letter" above to get started.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coverLetters.map((cl) => (
              <Card key={cl.id} className="flex flex-col border border-yellow bg-beige">
                <CardHeader>
                  <CardTitle className="line-clamp-1 text-dark">{cl.title}</CardTitle>
                  <CardDescription>
                    {cl.jobTitle
                      ? `${cl.jobTitle}${cl.companyName ? ` at ${cl.companyName}` : ''}`
                      : 'Untitled Position'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-dark/60">
                    {new Date(cl.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <div className="mt-2 inline-flex items-center rounded-full border border-yellow bg-yellow/40 px-2.5 py-0.5 text-xs font-semibold text-dark capitalize">
                    {cl.status}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(cl.id)}
                    disabled={deletingId === cl.id}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    {deletingId === cl.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ))}
    </div>
  )
}
