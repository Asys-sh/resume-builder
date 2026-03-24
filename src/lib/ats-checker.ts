import type { ResumeData } from '@/stores/builder'
import { matchJD } from '@/lib/jd-matcher'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ATSSeverity = 'error' | 'warning' | 'info'

export interface ATSIssue {
  id: string
  severity: ATSSeverity
  category: 'contact' | 'sections' | 'formatting' | 'content' | 'keywords'
  message: string
  fix: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Templates that use a sidebar/two-column layout and may confuse some ATS parsers.
// Derived from src/lib/templates.tsx — only 'creative' uses layout: 'sidebar'.
const SIDEBAR_TEMPLATES = new Set(['creative'])

// Unicode characters that are not plain ASCII and can trip up ATS parsers.
const UNICODE_BULLETS_RE = /[•◦▪▸▶►▻→←↑↓–—■□○●∙⁃✓✔✗✘★☆✦✧◆◇❖\u2018\u2019\u201C\u201D]/

// ─── Sort order ───────────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<ATSSeverity, number> = { error: 0, warning: 1, info: 2 }

// ─── Main export ──────────────────────────────────────────────────────────────

export function runATSCheck(resumeData: ResumeData, jd?: string): ATSIssue[] {
  const issues: ATSIssue[] = []
  const { contactInfo, experiences, skills, summary, selectedTemplate } = resumeData

  // ── contact ──────────────────────────────────────────────────────────────

  if (!contactInfo.email || !contactInfo.email.trim()) {
    issues.push({
      id: 'missing-email',
      severity: 'error',
      category: 'contact',
      message: 'No email address',
      fix: 'Add your email in Contact Info',
    })
  }

  if (!contactInfo.phone || !contactInfo.phone.trim()) {
    issues.push({
      id: 'missing-phone',
      severity: 'error',
      category: 'contact',
      message: 'No phone number',
      fix: 'Add your phone number in Contact Info',
    })
  }

  // ── sections ─────────────────────────────────────────────────────────────

  if (experiences.length === 0) {
    issues.push({
      id: 'no-experience',
      severity: 'error',
      category: 'sections',
      message: 'No work experience entries',
      fix: 'Add at least one experience entry',
    })
  }

  if (skills.length === 0) {
    issues.push({
      id: 'no-skills',
      severity: 'warning',
      category: 'sections',
      message: 'No skills listed',
      fix: 'Add skills so ATS can match keywords',
    })
  }

  // ── formatting ───────────────────────────────────────────────────────────

  const textsToCheck = [
    ...experiences.map((e) => e.description ?? ''),
    summary,
    ...resumeData.projects.map((p) => p.description ?? ''),
  ]
  const hasUnicodeBullets = textsToCheck.some((text) => UNICODE_BULLETS_RE.test(text))
  if (hasUnicodeBullets) {
    issues.push({
      id: 'unicode-bullets',
      severity: 'error',
      category: 'formatting',
      message: 'Unicode bullet characters detected',
      fix: 'Replace fancy bullets with plain hyphens (-)',
    })
  }

  if (SIDEBAR_TEMPLATES.has(selectedTemplate)) {
    issues.push({
      id: 'sidebar-template',
      severity: 'warning',
      category: 'formatting',
      message: 'Sidebar/two-column template may confuse some ATS parsers',
      fix: 'Consider using the Modern or Classic single-column template when applying',
    })
  }

  // ── content ──────────────────────────────────────────────────────────────

  const hasMissingRole = experiences.some((e) => !e.role || !e.role.trim())
  if (hasMissingRole) {
    issues.push({
      id: 'missing-role',
      severity: 'warning',
      category: 'content',
      message: 'Some experience entries are missing a job title',
      fix: 'Add a job title to all experience entries',
    })
  }

  const trimmedSummary = summary.trim()
  if (trimmedSummary.length > 0 && trimmedSummary.length < 50) {
    issues.push({
      id: 'short-summary',
      severity: 'info',
      category: 'content',
      message: 'Summary is very short',
      fix: 'Expand your summary to at least 2–3 sentences',
    })
  }

  // ── keywords ─────────────────────────────────────────────────────────────

  if (jd && jd.trim()) {
    const result = matchJD(jd, resumeData)
    if (result.matchPercent < 40) {
      issues.push({
        id: 'low-jd-keywords',
        severity: 'warning',
        category: 'keywords',
        message: 'Low keyword overlap with the job description',
        fix: 'Add more keywords from the job description to your skills and experience',
      })
    }
  }

  // ── Sort: errors first, then warnings, then info ──────────────────────────

  issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  return issues
}
