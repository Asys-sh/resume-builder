'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { analyzeBullets } from '@/lib/bullet-analyzer'
import { cn } from '@/lib/utils'

const FANCY_BULLETS_RE = /[•◆★♦◉▶►●■□▪▫]/

interface BulletAnalyzerProps {
  description: string | null | undefined
  onFix?: (fixed: string) => void
  /** Rendered on the left side of the header row (e.g. BulletLibrary button) */
  headerAction?: React.ReactNode
}

function Badge({ ok, warn, label }: { ok: boolean; warn?: boolean; label: string }) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded text-xs font-bold leading-none border',
        ok
          ? 'bg-green-100 text-green-800 border-green-300'
          : warn
            ? 'bg-amber-100 text-amber-800 border-amber-300'
            : 'bg-white text-text-subtle border-border-color/50',
      )}
    >
      {label}
    </span>
  )
}

export function BulletAnalyzer({ description, onFix, headerAction }: BulletAnalyzerProps) {
  const [isOpen, setIsOpen] = useState(true)
  const bullets = useMemo(() => analyzeBullets(description), [description])
  const hasFancyBullets = useMemo(
    () => !!description && FANCY_BULLETS_RE.test(description),
    [description],
  )

  if (bullets.length === 0) return null

  return (
    <div className="mt-2 rounded-lg border border-border-color/30 bg-white/60">
      {/* Header row: [optional left action] [spacer] [label + chevron toggle] */}
      <div className="flex items-center gap-2 px-2.5 py-2">
        {headerAction && <div onClick={(e) => e.stopPropagation()}>{headerAction}</div>}
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex-1 flex items-center justify-end gap-1.5"
          aria-expanded={isOpen}
        >
          <span className="text-[10px] font-bold text-text-subtle uppercase tracking-widest">
            Bullet quality
          </span>
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5 text-text-subtle shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-text-subtle shrink-0" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="px-2.5 pb-2.5 space-y-1.5">
          {hasFancyBullets && (
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-amber-50 border border-amber-200 mb-1">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700">
                  Fancy bullet characters detected — some ATS systems strip them
                </p>
              </div>
              {onFix && (
                <button
                  type="button"
                  onClick={() => onFix(description!.replace(/[•◆★♦◉▶►●■□▪▫]/g, '-'))}
                  className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline shrink-0"
                >
                  Fix
                </button>
              )}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <p className="text-xs text-text-subtle truncate flex-1 min-w-0">
                  {b.text.length > 55 ? `${b.text.slice(0, 55)}…` : b.text}
                </p>
                <div className="flex gap-1 shrink-0">
                  <Badge ok={b.hasActionVerb} warn={!b.hasActionVerb} label="Verb" />
                  <Badge ok={b.hasQuantified} label="№" />
                  <Badge
                    ok={b.lengthStatus === 'good'}
                    warn={b.lengthStatus !== 'good'}
                    label={
                      b.lengthStatus === 'short'
                        ? 'Short'
                        : b.lengthStatus === 'long'
                          ? 'Long'
                          : 'Len'
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
