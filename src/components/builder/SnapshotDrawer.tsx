'use client'

import { Clock, History, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

type PendingAction =
  | { type: 'restore'; snapshot: Snapshot }
  | { type: 'delete'; snapshotId: string }

export function SnapshotDrawer({ resumeId }: SnapshotDrawerProps) {
  const [open, setOpen] = useState(false)
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [confirming, setConfirming] = useState(false)

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

  const handleConfirm = async () => {
    if (!pending) return
    setConfirming(true)

    try {
      if (pending.type === 'restore') {
        const res = await fetch(
          `/api/resumes/${resumeId}/snapshots/${pending.snapshot.id}/restore`,
          { method: 'POST' },
        )
        if (res.ok) {
          toast.success('Resume restored!')
          window.location.reload()
        } else {
          toast.error('Failed to restore version.')
        }
      } else {
        const res = await fetch(`/api/resumes/${resumeId}/snapshots/${pending.snapshotId}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          toast.success('Checkpoint deleted.')
          setSnapshots((prev) => prev.filter((s) => s.id !== pending.snapshotId))
        } else {
          toast.error('Failed to delete checkpoint.')
        }
      }
    } catch {
      toast.error(pending.type === 'restore' ? 'Failed to restore version.' : 'Failed to delete checkpoint.')
    } finally {
      setConfirming(false)
      setPending(null)
    }
  }

  const isRestore = pending?.type === 'restore'

  return (
    <>
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

        <SheetContent side="right" className="flex flex-col w-96 max-w-full bg-background-light border-l border-border-color/30">
          <SheetHeader className="mb-4 pr-6">
            <SheetTitle>Version History</SheetTitle>
            <p className="text-xs text-text-subtle">Snapshots are saved automatically as you work.</p>
          </SheetHeader>

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
                    className="flex items-start justify-between gap-2 p-3 rounded-lg border border-border-color/30 bg-border-color/10 hover:bg-primary/5 hover:border-primary/40 transition-all duration-150"
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
                        onClick={() => setPending({ type: 'restore', snapshot })}
                        className="text-xs font-semibold text-primary hover:text-primary/80 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors"
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => setPending({ type: 'delete', snapshotId: snapshot.id })}
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

      <Dialog open={!!pending} onOpenChange={(o) => { if (!o) setPending(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isRestore ? 'Restore this version?' : 'Delete this checkpoint?'}
            </DialogTitle>
            <DialogDescription>
              {isRestore
                ? 'Your current resume will be saved as a checkpoint first, then this version will be restored.'
                : 'This checkpoint will be permanently deleted and cannot be recovered.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setPending(null)}
              className="flex-1 rounded-lg border border-border-color/40 px-4 py-2 text-sm font-semibold text-text-main hover:bg-border-color/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
                isRestore
                  ? 'bg-primary hover:bg-primary/90'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {confirming
                ? isRestore ? 'Restoring…' : 'Deleting…'
                : isRestore ? 'Restore' : 'Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
