/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import type { Experience, Skill } from '@/stores/builder'
import type { ResumeData } from '@/stores/builder'
import { initialResumeData } from '@/stores/builder'
import { runATSCheck } from '@/lib/ats-checker'

// ─── Fixture helpers ──────────────────────────────────────────────────────────

function makeExperience(overrides: Partial<{
  id: string
  role: string
  company: string
  description: string
  startDate: Date
  endDate: Date | null
  location: string | null
  resumeId: string
  createdAt: Date
  updatedAt: Date
}> = {}): Experience {
  return {
    id: 'exp-1',
    role: 'Software Engineer',
    company: 'Acme Corp',
    description: '- Built features\n- Shipped code',
    startDate: new Date('2020-01-01'),
    endDate: null,
    location: null,
    resumeId: 'resume-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as Experience
}

function makeSkill(name: string): Skill {
  return {
    id: `skill-${name}`,
    name,
    level: null,
    resumeId: 'resume-1',
  } as unknown as Skill
}

/** A fully valid "perfect" resume that should produce zero ATS issues. */
function makePerfectResume(): ResumeData {
  return {
    ...initialResumeData,
    contactInfo: {
      fullName: 'Jane Doe',
      headline: 'Senior Software Engineer',
      email: 'jane@example.com',
      phone: '+1 555-555-5555',
      address: 'New York, NY',
      links: [{ label: 'LinkedIn', url: 'https://linkedin.com/in/jane' }],
    },
    experiences: [makeExperience()],
    skills: [makeSkill('TypeScript'), makeSkill('React'), makeSkill('Node.js')],
    summary: 'Experienced engineer with 10 years building scalable web applications and leading cross-functional teams.',
    selectedTemplate: 'modern',
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('runATSCheck', () => {
  // 1. Empty resume
  it('flags missing-email, missing-phone, no-experience (errors) and no-skills (warning) on an empty resume', () => {
    const issues = runATSCheck(initialResumeData)
    const ids = issues.map((i) => i.id)
    expect(ids).toContain('missing-email')
    expect(ids).toContain('missing-phone')
    expect(ids).toContain('no-experience')
    expect(ids).toContain('no-skills')

    const missingEmail = issues.find((i) => i.id === 'missing-email')!
    expect(missingEmail.severity).toBe('error')
    const missingPhone = issues.find((i) => i.id === 'missing-phone')!
    expect(missingPhone.severity).toBe('error')
    const noExp = issues.find((i) => i.id === 'no-experience')!
    expect(noExp.severity).toBe('error')
    const noSkills = issues.find((i) => i.id === 'no-skills')!
    expect(noSkills.severity).toBe('warning')
  })

  // 2. Unicode bullets in experience description
  it('returns unicode-bullets error when description contains unicode bullet chars', () => {
    const resume: ResumeData = {
      ...makePerfectResume(),
      experiences: [makeExperience({ description: '• Built features\n• Shipped code' })],
    }
    const issues = runATSCheck(resume)
    const ids = issues.map((i) => i.id)
    expect(ids).toContain('unicode-bullets')
    const issue = issues.find((i) => i.id === 'unicode-bullets')!
    expect(issue.severity).toBe('error')
  })

  // 3. Regular dash bullets → no unicode-bullets issue
  it('does NOT return unicode-bullets when only plain dash bullets are used', () => {
    const resume: ResumeData = {
      ...makePerfectResume(),
      experiences: [makeExperience({ description: '- Built features\n- Shipped code' })],
    }
    const issues = runATSCheck(resume)
    const ids = issues.map((i) => i.id)
    expect(ids).not.toContain('unicode-bullets')
  })

  // 4. Sidebar template → sidebar-template warning
  it('returns sidebar-template warning for the creative template', () => {
    const resume: ResumeData = {
      ...makePerfectResume(),
      selectedTemplate: 'creative',
    }
    const issues = runATSCheck(resume)
    const ids = issues.map((i) => i.id)
    expect(ids).toContain('sidebar-template')
    const issue = issues.find((i) => i.id === 'sidebar-template')!
    expect(issue.severity).toBe('warning')
  })

  // 5. Single-column template → no sidebar-template warning
  it('does NOT return sidebar-template warning for the modern template', () => {
    const resume: ResumeData = { ...makePerfectResume(), selectedTemplate: 'modern' }
    const issues = runATSCheck(resume)
    const ids = issues.map((i) => i.id)
    expect(ids).not.toContain('sidebar-template')
  })

  it('does NOT return sidebar-template warning for the classic template', () => {
    const resume: ResumeData = { ...makePerfectResume(), selectedTemplate: 'classic' }
    const issues = runATSCheck(resume)
    expect(issues.map((i) => i.id)).not.toContain('sidebar-template')
  })

  it('does NOT return sidebar-template warning for the minimalist template', () => {
    const resume: ResumeData = { ...makePerfectResume(), selectedTemplate: 'minimalist' }
    const issues = runATSCheck(resume)
    expect(issues.map((i) => i.id)).not.toContain('sidebar-template')
  })

  // 6. Experience with empty role
  it('returns missing-role warning when an experience has no role', () => {
    const resume: ResumeData = {
      ...makePerfectResume(),
      experiences: [makeExperience({ role: '' })],
    }
    const issues = runATSCheck(resume)
    const ids = issues.map((i) => i.id)
    expect(ids).toContain('missing-role')
    const issue = issues.find((i) => i.id === 'missing-role')!
    expect(issue.severity).toBe('warning')
  })

  // 7. Short summary (> 0 but < 50 chars)
  it('returns short-summary info when summary exists but is under 50 characters', () => {
    const resume: ResumeData = {
      ...makePerfectResume(),
      summary: 'Hello world', // 11 chars
    }
    const issues = runATSCheck(resume)
    const ids = issues.map((i) => i.id)
    expect(ids).toContain('short-summary')
    const issue = issues.find((i) => i.id === 'short-summary')!
    expect(issue.severity).toBe('info')
  })

  // 8. Empty summary → no short-summary
  it('does NOT return short-summary when summary is empty', () => {
    const resume: ResumeData = { ...makePerfectResume(), summary: '' }
    const issues = runATSCheck(resume)
    expect(issues.map((i) => i.id)).not.toContain('short-summary')
  })

  // 9. JD provided with low overlap → low-jd-keywords warning
  it('returns low-jd-keywords warning when JD keyword match is below 40%', () => {
    const resume: ResumeData = {
      ...initialResumeData,
      contactInfo: {
        ...initialResumeData.contactInfo,
        email: 'jane@example.com',
        phone: '+1 555-0000',
      },
      experiences: [makeExperience({ description: '- Built features' })],
      skills: [makeSkill('TypeScript')],
      summary: 'An experienced engineer with deep knowledge of software systems.',
      selectedTemplate: 'modern',
    }
    // JD full of unrelated keywords not present in the resume
    const jd = `
      We are looking for a nuclear physicist with expertise in quantum mechanics,
      particle accelerators, reactor design, plasma engineering, and fusion research.
      Must have experience with hadron colliders, neutrino detection, and isotope separation.
      Required: dark matter simulation, superconducting magnets, cryogenic systems, neutron flux.
      Strong background in astrophysics, cosmology, gravitational waves preferred.
    `
    const issues = runATSCheck(resume, jd)
    const ids = issues.map((i) => i.id)
    expect(ids).toContain('low-jd-keywords')
    const issue = issues.find((i) => i.id === 'low-jd-keywords')!
    expect(issue.severity).toBe('warning')
  })

  // 10. JD not provided → no low-jd-keywords
  it('does NOT return low-jd-keywords when no JD is provided', () => {
    const resume = makePerfectResume()
    const issues = runATSCheck(resume)
    expect(issues.map((i) => i.id)).not.toContain('low-jd-keywords')
  })

  it('does NOT return low-jd-keywords when JD is an empty string', () => {
    const resume = makePerfectResume()
    const issues = runATSCheck(resume, '')
    expect(issues.map((i) => i.id)).not.toContain('low-jd-keywords')
  })

  // 11. Perfect resume → empty array
  it('returns empty array for a perfect resume', () => {
    const issues = runATSCheck(makePerfectResume())
    expect(issues).toHaveLength(0)
  })

  // 12. Sort order: errors before warnings before info
  it('sorts issues with errors first, then warnings, then info', () => {
    // Resume that triggers: missing-phone (error), no-skills (warning), short-summary (info)
    const resume: ResumeData = {
      ...initialResumeData,
      contactInfo: {
        ...initialResumeData.contactInfo,
        email: 'jane@example.com',
        phone: '', // triggers missing-phone (error)
      },
      experiences: [makeExperience()],
      skills: [], // triggers no-skills (warning)
      summary: 'Hi there', // 8 chars — triggers short-summary (info)
      selectedTemplate: 'modern',
    }
    const issues = runATSCheck(resume)
    const severities = issues.map((i) => i.severity)
    const ORDER = { error: 0, warning: 1, info: 2 }

    for (let i = 1; i < severities.length; i++) {
      expect(ORDER[severities[i]]).toBeGreaterThanOrEqual(ORDER[severities[i - 1]])
    }

    // Verify we actually have all three in the result
    expect(severities).toContain('error')
    expect(severities).toContain('warning')
    expect(severities).toContain('info')
  })
})
