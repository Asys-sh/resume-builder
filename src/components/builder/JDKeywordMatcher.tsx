'use client'

import { useEffect, useState } from 'react'
import { useAtomValue } from 'jotai'
import { resumeDataAtom } from '@/stores/builder'
import { matchJD, type JDMatchResult } from '@/lib/jd-matcher'
import { cn } from '@/lib/utils'

interface JDKeywordMatcherProps {
  jd: string
}

export function JDKeywordMatcher({ jd }: JDKeywordMatcherProps) {
  const resumeData = useAtomValue(resumeDataAtom)
  const [result, setResult] = useState<JDMatchResult | null>(null)

  // Debounced computation — only runs when JD is long enough to be meaningful
  useEffect(() => {
    if (jd.length < 100) {
      setResult(null)
      return
    }
    const timer = setTimeout(() => {
      setResult(matchJD(jd, resumeData))
    }, 600)
    return () => clearTimeout(timer)
  }, [jd, resumeData])

  if (!result || result.total === 0) return null

  const pct = result.matchPercent
  const scoreColor = pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-amber-600' : 'text-red-500'
  const barColor = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'
  const label = pct >= 70 ? 'Strong match' : pct >= 40 ? 'Partial match' : 'Weak match'

  return (
    <div className="rounded-xl border border-border-color/40 bg-white p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Header + score */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-main">Keyword Match</p>
          <p className="text-xs text-text-subtle">{label} — {result.matched.length}/{result.total} keywords found</p>
        </div>
        <span className={cn('text-2xl font-bold tabular-nums shrink-0', scoreColor)}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-border-color/30">
        <div
          className={cn('h-1.5 rounded-full transition-all duration-700', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Missing keywords — most actionable, shown first */}
      {result.missing.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest">
            Missing from your resume
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.missing.map((kw) => (
              <span
                key={kw}
                className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Matched keywords */}
      {result.matched.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest">
            Found in your resume
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.matched.map((kw) => (
              <span
                key={kw}
                className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
