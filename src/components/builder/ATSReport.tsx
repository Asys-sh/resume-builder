'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { runATSCheck } from '@/lib/ats-checker'
import type { ATSIssue, ATSSeverity } from '@/lib/ats-checker'
import type { ResumeData } from '@/stores/builder'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ATSReportProps {
  resumeData: ResumeData
  jd?: string
}

// ─── Severity helpers ─────────────────────────────────────────────────────────

function SeverityIcon({ severity }: { severity: ATSSeverity }) {
  switch (severity) {
    case 'error':
      return <XCircle className="h-4 w-4 shrink-0 text-red-500" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-500" />
    case 'info':
      return <Info className="h-4 w-4 shrink-0 text-blue-400" />
  }
}

function getBadgeStyle(issues: ATSIssue[]): { text: string; classes: string } {
  const errorCount = issues.filter((i) => i.severity === 'error').length

  if (issues.length === 0) {
    return { text: '0 issues', classes: 'bg-green-500/15 text-green-600 border-green-500/30' }
  }
  if (errorCount > 0) {
    return {
      text: `${issues.length} issue${issues.length !== 1 ? 's' : ''}`,
      classes: 'bg-red-500/15 text-red-500 border-red-500/30',
    }
  }
  return {
    text: `${issues.length} issue${issues.length !== 1 ? 's' : ''}`,
    classes: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
  }
}

// ─── Issue Row ────────────────────────────────────────────────────────────────

function IssueRow({ issue }: { issue: ATSIssue }) {
  return (
    <li className="flex gap-2.5 py-2.5 border-b border-border-color/20 last:border-b-0">
      <SeverityIcon severity={issue.severity} />
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-semibold text-text-main leading-snug">{issue.message}</p>
        <p className="text-xs text-text-subtle leading-snug">{issue.fix}</p>
      </div>
    </li>
  )
}

// ─── ATSReport ────────────────────────────────────────────────────────────────

export function ATSReport({ resumeData, jd }: ATSReportProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const issues = useMemo(() => runATSCheck(resumeData, jd), [resumeData, jd])
  const badge = getBadgeStyle(issues)

  return (
    <div className="relative shrink-0 mt-1">
      {/* Expanded panel — floats above */}
      {isExpanded && (
        <div className="absolute bottom-full left-0 right-0 mb-2 z-10 bg-background-light border border-border-color/50 rounded-xl shadow-xl overflow-hidden">
          <div className="p-4">
            <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest mb-3">
              ATS Issues
            </p>
            {issues.length === 0 ? (
              <p className="text-xs text-center text-text-subtle py-1">
                No ATS issues detected. Your resume looks great!
              </p>
            ) : (
              <ul className="space-y-0">
                {issues.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Collapsed trigger */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
          'bg-background-light border border-border-color/50 hover:border-primary/40',
        )}
      >
        <div className="flex-1 flex items-center gap-2 text-left min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-text-subtle shrink-0">
            ATS Check
          </p>
          <span
            className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full border',
              badge.classes,
            )}
          >
            {badge.text}
          </span>
        </div>
        <div className="shrink-0 text-text-subtle">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
      </button>
    </div>
  )
}
