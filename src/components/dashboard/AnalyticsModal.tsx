'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DailyEntry {
  date: string
  count: number
}

interface AnalyticsData {
  total: number
  peak: { date: string; count: number }
  trend: 'up' | 'down' | 'flat'
  daily: DailyEntry[]
}

interface AnalyticsModalProps {
  resumeId: string
  resumeTitle: string
  isOpen: boolean
  onClose: () => void
}

type Days = '30' | '60' | '90'

export function AnalyticsModal({ resumeId, resumeTitle, isOpen, onClose }: AnalyticsModalProps) {
  const [days, setDays] = useState<Days>('30')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setError(null)
    fetch(`/api/resumes/${resumeId}/analytics?days=${days}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch analytics')
        return res.json()
      })
      .then((json: AnalyticsData) => setData(json))
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setLoading(false))
  }, [isOpen, resumeId, days])

  const trendLabel =
    data?.trend === 'up' ? '↑ Up' : data?.trend === 'down' ? '↓ Down' : '→ Flat'

  const maxCount = data ? Math.max(...data.daily.map((d) => d.count), 1) : 1

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="bg-background-light border-border-color/50 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-text-main">{resumeTitle}</DialogTitle>
          <DialogDescription className="text-text-subtle">View Analytics</DialogDescription>
        </DialogHeader>

        {/* Day range selector */}
        <div className="flex gap-2">
          {(['30', '60', '90'] as Days[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                days === d
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text-subtle border-border-color/40 hover:border-primary/50 hover:text-primary'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center justify-center h-48 text-sm text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border-color/30 bg-white p-3 text-center">
                <p className="text-2xl font-bold text-text-main">{data.total}</p>
                <p className="text-xs text-text-subtle mt-0.5">Total Views</p>
              </div>
              <div className="rounded-lg border border-border-color/30 bg-white p-3 text-center">
                <p className="text-2xl font-bold text-text-main">{data.peak.count}</p>
                <p className="text-xs text-text-subtle mt-0.5">
                  Peak Day
                  {data.peak.date ? ` (${data.peak.date})` : ''}
                </p>
              </div>
              <div className="rounded-lg border border-border-color/30 bg-white p-3 text-center">
                <p className="text-2xl font-bold text-text-main">{trendLabel}</p>
                <p className="text-xs text-text-subtle mt-0.5">Trend (7d)</p>
              </div>
            </div>

            {/* Bar chart */}
            {data.total === 0 ? (
              <div className="flex items-center justify-center h-36 text-sm text-text-subtle">
                No views yet
              </div>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <div className="flex items-end gap-0.5 h-36 min-w-0" style={{ minWidth: `${data.daily.length * 14}px` }}>
                  {data.daily.map((entry, idx) => {
                    const heightPct = maxCount > 0 ? (entry.count / maxCount) * 100 : 0
                    const showLabel = idx % 7 === 0
                    return (
                      <div key={entry.date} className="flex flex-col items-center flex-1 gap-0.5">
                        <div
                          className="w-full bg-primary/70 rounded-sm transition-all"
                          style={{ height: `${Math.max(heightPct, entry.count > 0 ? 4 : 0)}%` }}
                          title={`${entry.date}: ${entry.count}`}
                        />
                        {showLabel ? (
                          <span
                            className="text-[9px] text-text-subtle whitespace-nowrap"
                            style={{ transform: 'rotate(-45deg)', transformOrigin: 'top left', marginTop: 2 }}
                          >
                            {entry.date.slice(5)}
                          </span>
                        ) : (
                          <span className="text-[9px] opacity-0">-</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
