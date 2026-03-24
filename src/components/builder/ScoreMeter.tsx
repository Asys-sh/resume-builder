'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import { useSetAtom } from 'jotai'
import { cn } from '@/lib/utils'
import { useResumeScore } from '@/hooks/use-resume-score'
import { setCurrentStepAtom } from '@/stores/builder'
import { getScoreColor, getScoreLabel } from '@/lib/resume-scorer'

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_LABELS: Record<number, string> = {
  1: 'Contact Info',
  2: 'Experience & Skills',
  3: 'Summary',
  4: 'Education & Certifications',
  5: 'Projects & Languages',
  6: 'Target Job',
  7: 'Review',
}

// Arc gauge geometry: 270° gauge (r=20, center at 26,26)
const R = 20
const CX = 26
const CY = 26
const C = 2 * Math.PI * R    // full circumference ≈ 125.66
const ARC = C * 0.75          // 270° ≈ 94.25
const GAP = C - ARC           // remaining gap ≈ 31.41

// ─── Arc Gauge ────────────────────────────────────────────────────────────────

function ScoreArc({ score, size = 52 }: { score: number; size?: number }) {
  const color = getScoreColor(score)
  const filled = (score / 100) * ARC

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      fill="none"
      className="shrink-0"
      aria-label={`Resume score: ${score} out of 100`}
    >
      {/* Track */}
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke="#ccd5ae"
        strokeOpacity={0.5}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${ARC} ${GAP}`}
        transform={`rotate(-225, ${CX}, ${CY})`}
      />
      {/* Progress fill */}
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${C}`}
        transform={`rotate(-225, ${CX}, ${CY})`}
        style={{
          transition: 'stroke-dasharray 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      {/* Score number */}
      <text
        x={CX}
        y={CY + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fontWeight="800"
        fill="#3a3226"
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        {score}
      </text>
    </svg>
  )
}

// ─── Pillar Bar ───────────────────────────────────────────────────────────────

function PillarBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = (score / max) * 100
  const color = getScoreColor(pct)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-subtle font-medium">{label}</span>
        <span className="text-xs font-semibold text-text-main tabular-nums">
          {score}
          <span className="text-text-subtle font-normal">/{max}</span>
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border-color/40 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  )
}

// ─── Score Meter ─────────────────────────────────────────────────────────────

export function ScoreMeter() {
  const [isExpanded, setIsExpanded] = useState(false)
  const score = useResumeScore()
  const setStep = useSetAtom(setCurrentStepAtom)

  const color = getScoreColor(score.total)
  const label = getScoreLabel(score.total)

  return (
    <div className="relative shrink-0 mt-2">
      {/* Expanded panel — floats above */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute bottom-full left-0 right-0 mb-2 z-10 bg-background-light border border-border-color/50 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Header with arc + score */}
              <div className="flex items-center gap-3">
                <div
                  className="p-[2px] rounded-full shrink-0"
                  style={{ background: `linear-gradient(135deg, ${color}, #d4a373)` }}
                >
                  <div className="bg-background-light rounded-full p-1">
                    <svg width="44" height="44" viewBox="0 0 52 52" fill="none">
                      <circle
                        cx={CX} cy={CY} r={R}
                        fill="none" stroke="#ccd5ae" strokeOpacity={0.5}
                        strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={`${ARC} ${GAP}`}
                        transform={`rotate(-225, ${CX}, ${CY})`}
                      />
                      <circle
                        cx={CX} cy={CY} r={R}
                        fill="none" stroke={color}
                        strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={`${(score.total / 100) * ARC} ${C}`}
                        transform={`rotate(-225, ${CX}, ${CY})`}
                        style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease' }}
                      />
                      <text
                        x={CX} y={CY + 1}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize="11" fontWeight="800" fill="#3a3226"
                        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                      >
                        {score.total}
                      </text>
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-base font-extrabold text-text-main" style={{ color }}>
                    {label}
                  </p>
                  <p className="text-xs text-text-subtle">{score.total}/100 points</p>
                </div>
              </div>

              {/* Pillar bars */}
              <div className="space-y-2.5">
                <PillarBar label="Completeness" score={score.completeness} max={score.completenessMax} />
                <PillarBar label="Content Quality" score={score.contentQuality} max={score.contentQualityMax} />
                <PillarBar label="ATS Safety" score={score.atsSafety} max={score.atsSafetyMax} />
              </div>

              {/* Tips */}
              {score.tips.length > 0 && (
                <>
                  <div className="border-t border-border-color/30" />
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest">
                      Top Tips
                    </p>
                    <ul className="space-y-2.5">
                      {score.tips.map((tip, i) => (
                        <li key={i} className="flex gap-2">
                          <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-xs text-text-main leading-snug">{tip.text}</p>
                            <button
                              type="button"
                              onClick={() => {
                                setStep(tip.step)
                                setIsExpanded(false)
                              }}
                              className="text-xs text-primary hover:underline font-semibold"
                            >
                              → Go to {STEP_LABELS[tip.step]}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {score.tips.length === 0 && (
                <p className="text-xs text-center text-text-subtle py-1">
                  No major issues found. Great resume!
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed trigger — gradient background + pulse */}
      <motion.div
        animate={
          isExpanded
            ? { boxShadow: '0 0 0 0 rgba(212,163,115,0)' }
            : {
                boxShadow: [
                  '0 0 0 0 rgba(212,163,115,0)',
                  '0 0 0 5px rgba(212,163,115,0.25)',
                  '0 0 0 0 rgba(212,163,115,0)',
                ],
              }
        }
        transition={
          isExpanded
            ? { duration: 0.3 }
            : { duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }
        }
        className="rounded-xl"
      >
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
            'bg-background-light border border-border-color/50 hover:border-primary/40',
          )}
          style={{ borderLeft: '3px solid ' + color }}
        >
          <ScoreArc score={score.total} />
          <div className="flex-1 text-left min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-text-subtle">
              Resume Score
            </p>
            <p className="text-base font-extrabold truncate" style={{ color }}>{label}</p>
          </div>
          <div className="shrink-0 text-text-subtle">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </div>
        </button>
      </motion.div>
    </div>
  )
}
