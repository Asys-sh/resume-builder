'use client'

import { Clock, History, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface Snapshot {
  id: string
  label: string | null
  createdAt: string
}

interface SnapshotDrawerProps {
  resumeId: string
}

export function SnapshotDrawer({ resumeId }: SnapshotDrawerProps) {
  const [open, setOpen] = useState(false)
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showLabelInput, setShowLabelInput] = useState(false)
  const [labelValue, setLabelValue] = useState('')

  const fetchSnapshots = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/resumes/${resumeId}/snapshots`)
      if (res.ok) {
        const data = await res.json()
        setSnapshots(data)
      }
    } catch {
      toast.error('Failed to load version history.')
    } finally {
      setLoading(false)
    }
  }, [resumeId])

  useEffect(() => {
    if (open) {
      fetchSnapshots()
    }
  }, [open, fetchSnapshots])

  const handleSaveCheckpoint = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/resumes/${resumeId}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: labelValue.trim() || undefined }),
      })
      if (res.ok) {
        toast.success('Checkpoint saved!')
        setShowLabelInput(false)
        setLabelValue('')
        fetchSnapshots()
      } else {
        toast.error('Failed to save checkpoint.')
      }
    } catch {
      toast.error('Failed to save checkpoint.')
    } finally {
      setSaving(false)
    }
  }

  const handleRestore = async (snapshot: Snapshot) => {
    const confirmed = window.confirm(
      'Restore this version? Your current resume will be saved first.',
    )
    if (!confirmed) return

    try {
      const res = await fetch(
        `/api/resumes/${resumeId}/snapshots/${snapshot.id}/restore`,
        { method: 'POST' },
      )
      if (res.ok) {
        toast.success('Resume restored!')
        window.location.reload()
      } else {
        toast.error('Failed to restore version.')
      }
    } catch {
      toast.error('Failed to restore version.')
    }
  }

  const handleDelete = async (snapshotId: string) => {
    if (!window.confirm('Delete this checkpoint?')) return
    try {
      const res = await fetch(`/api/resumes/${resumeId}/snapshots/${snapshotId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Checkpoint deleted.')
        setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId))
      } else {
        toast.error('Failed to delete checkpoint.')
      }
    } catch {
      toast.error('Failed to delete checkpoint.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer rounded-xl h-10 px-4 bg-border-color/50 text-text-main text-sm font-semibold hover:bg-border-color/80 active:scale-95 transition-all"
          aria-label="Version history"
        >
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">History</span>
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="flex flex-col w-96 max-w-full">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between pr-6">
            <SheetTitle>Version History</SheetTitle>
            <button
              type="button"
              onClick={() => setShowLabelInput((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <Clock className="h-3.5 w-3.5" />
              Save checkpoint
            </button>
          </div>
        </SheetHeader>

        {/* Inline label input */}
        {showLabelInput && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              aria-label="Checkpoint label"
              placeholder="Optional label (e.g. Before interview)"
              maxLength={80}
              className="flex-1 h-9 px-3 rounded-lg border border-border-color/50 bg-background text-sm text-text-main placeholder:text-text-subtle/60 focus:outline-none focus:border-primary/60 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveCheckpoint()
                if (e.key === 'Escape') {
                  setShowLabelInput(false)
                  setLabelValue('')
                }
              }}
            />
            <Button
              size="sm"
              onClick={handleSaveCheckpoint}
              disabled={saving}
              className="shrink-0"
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        )}

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-border-color/20 animate-pulse"
                />
              ))}
            </div>
          ) : snapshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-text-subtle text-sm">
              <Clock className="h-8 w-8 mb-2 opacity-40" />
              <p>No checkpoints saved yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-start justify-between gap-2 p-3 rounded-lg border border-border-color/30 hover:border-border-color/60 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-main truncate">
                      {snapshot.label ?? 'Checkpoint'}
                    </p>
                    <p className="text-xs text-text-subtle mt-0.5">
                      {new Date(snapshot.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRestore(snapshot)}
                      className="text-xs font-semibold text-primary hover:text-primary/80 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(snapshot.id)}
                      aria-label="Delete checkpoint"
                      className="p-1.5 rounded-md text-text-subtle hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
