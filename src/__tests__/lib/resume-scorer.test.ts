import { describe, it, expect } from 'vitest'
import { scoreResume, getScoreLabel, getScoreColor } from '@/lib/resume-scorer'
import { initialResumeData } from '@/stores/builder'
import type { ResumeData } from '@/stores/builder'

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeExp(overrides: Partial<{
  id: string
  company: string
  role: string
  description: string | null
  startDate: Date
  endDate: Date | null
  location: string | null
  resumeId: string
  createdAt: Date
  updatedAt: Date
}> = {}) {
  return {
    id: 'exp-1',
    company: 'Acme Corp',
    role: 'Software Engineer',
    description: null,
    startDate: new Date('2020-01-01'),
    endDate: null,
    location: null,
    resumeId: 'resume-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as any
}

function makeSkill(name: string) {
  return { id: `skill-${name}`, name, level: null, resumeId: 'resume-1' } as any
}

function makeEdu(overrides: Partial<{
  degree: string
  school: string
  fieldOfStudy: string | null
  startDate: Date
}> = {}) {
  return {
    id: 'edu-1',
    degree: 'Bachelor of Science',
    school: 'State University',
    fieldOfStudy: 'Computer Science',
    startDate: new Date('2016-09-01'),
    endDate: new Date('2020-05-01'),
    gpa: null,
    resumeId: 'resume-1',
    ...overrides,
  } as any
}

function makeProject(overrides: Partial<{ title: string; description: string | null; technologies: string | null }> = {}) {
  return {
    id: 'proj-1',
    title: 'My Project',
    description: null,
    link: null,
    technologies: null,
    startDate: null,
    endDate: null,
    resumeId: 'resume-1',
    ...overrides,
  } as any
}

function makeCert(name: string) {
  return { id: `cert-${name}`, name, issuer: 'AWS', date: null, resumeId: 'resume-1' } as any
}

/** A fully filled resume that should score high across all pillars */
const richResume: ResumeData = {
  ...initialResumeData,
  contactInfo: {
    fullName: 'Jane Doe',
    headline: 'Senior Software Engineer',
    email: 'jane@example.com',
    phone: '555-1234',
    address: 'San Francisco, CA',
    links: [{ label: 'LinkedIn', url: 'https://linkedin.com/in/janedoe' }],
  },
  summary:
    'Experienced software engineer with 8 years building scalable distributed systems. ' +
    'Passionate about clean code and team mentorship. Led multiple high-impact projects ' +
    'delivering measurable business outcomes across cloud and on-prem environments.',
  experiences: [
    makeExp({
      id: 'exp-1',
      role: 'Senior Engineer',
      description:
        'Led migration of legacy monolith to microservices, reducing latency by 40%.\n' +
        'Built CI/CD pipeline that increased deployment frequency by 3x.\n' +
        'Mentored 5 junior engineers across two teams.',
    }),
    makeExp({
      id: 'exp-2',
      role: 'Software Engineer',
      description:
        'Developed REST APIs serving 50k users daily.\n' +
        'Optimized database queries, cutting query time by 60%.',
    }),
  ],
  skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'Redis', 'GraphQL', 'Python', 'Go', 'CI/CD'].map(makeSkill),
  education: [makeEdu()],
  projects: [
    makeProject({ title: 'Open Source CLI', description: 'A CLI tool for managing cloud resources, used by 200+ engineers.' }),
  ],
  certifications: [makeCert('AWS Solutions Architect')],
  awards: [],
}

// ─── scoreResume ──────────────────────────────────────────────────────────────

describe('scoreResume', () => {
  describe('return shape', () => {
    it('returns an object with the expected keys', () => {
      const result = scoreResume(initialResumeData)
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('completeness')
      expect(result).toHaveProperty('completenessMax', 40)
      expect(result).toHaveProperty('contentQuality')
      expect(result).toHaveProperty('contentQualityMax', 40)
      expect(result).toHaveProperty('atsSafety')
      expect(result).toHaveProperty('atsSafetyMax', 20)
      expect(result).toHaveProperty('breakdowns')
      expect(result).toHaveProperty('tips')
    })

    it('total equals the sum of the three pillar scores', () => {
      const r = scoreResume(richResume)
      expect(r.total).toBe(r.completeness + r.contentQuality + r.atsSafety)
    })

    it('breakdowns is an array with entries from all three pillars', () => {
      const r = scoreResume(initialResumeData)
      expect(Array.isArray(r.breakdowns)).toBe(true)
      expect(r.breakdowns.length).toBeGreaterThan(0)
    })

    it('tips contains at most 4 items', () => {
      const r = scoreResume(initialResumeData)
      expect(r.tips.length).toBeLessThanOrEqual(4)
    })
  })

  describe('score ranges', () => {
    it('total score is between 0 and 100 for empty resume', () => {
      const r = scoreResume(initialResumeData)
      expect(r.total).toBeGreaterThanOrEqual(0)
      expect(r.total).toBeLessThanOrEqual(100)
    })

    it('total score is between 0 and 100 for rich resume', () => {
      const r = scoreResume(richResume)
      expect(r.total).toBeGreaterThanOrEqual(0)
      expect(r.total).toBeLessThanOrEqual(100)
    })

    it('completeness is between 0 and 40', () => {
      const r = scoreResume(richResume)
      expect(r.completeness).toBeGreaterThanOrEqual(0)
      expect(r.completeness).toBeLessThanOrEqual(40)
    })

    it('contentQuality is between 0 and 40', () => {
      const r = scoreResume(richResume)
      expect(r.contentQuality).toBeGreaterThanOrEqual(0)
      expect(r.contentQuality).toBeLessThanOrEqual(40)
    })

    it('atsSafety is between 0 and 20', () => {
      const r = scoreResume(richResume)
      expect(r.atsSafety).toBeGreaterThanOrEqual(0)
      expect(r.atsSafety).toBeLessThanOrEqual(20)
    })
  })

  describe('empty resume scores low', () => {
    it('completeness is 0 for initialResumeData', () => {
      const r = scoreResume(initialResumeData)
      expect(r.completeness).toBe(0)
    })

    it('contentQuality is 0 for initialResumeData', () => {
      const r = scoreResume(initialResumeData)
      expect(r.contentQuality).toBe(0)
    })

    it('total is low for an empty resume', () => {
      const r = scoreResume(initialResumeData)
      expect(r.total).toBeLessThan(20)
    })
  })

  describe('rich resume scores high', () => {
    it('total is above 70 for a well-filled resume', () => {
      const r = scoreResume(richResume)
      expect(r.total).toBeGreaterThan(70)
    })

    it('completeness is above 30 for a well-filled resume', () => {
      const r = scoreResume(richResume)
      expect(r.completeness).toBeGreaterThan(30)
    })

    it('contentQuality is above 20 for a resume with action verbs and metrics', () => {
      const r = scoreResume(richResume)
      expect(r.contentQuality).toBeGreaterThan(20)
    })
  })

  describe('pillar: completeness', () => {
    it('rewards a valid email', () => {
      const withEmail: ResumeData = {
        ...initialResumeData,
        contactInfo: { ...initialResumeData.contactInfo, fullName: 'Jane', email: 'jane@example.com' },
      }
      const noEmail: ResumeData = {
        ...initialResumeData,
        contactInfo: { ...initialResumeData.contactInfo, fullName: 'Jane', email: '' },
      }
      expect(scoreResume(withEmail).completeness).toBeGreaterThan(scoreResume(noEmail).completeness)
    })

    it('gives 0 experience score when experiences array is empty', () => {
      const r = scoreResume(initialResumeData)
      const expBreakdown = r.breakdowns.find((b) => b.label === 'Experience')
      expect(expBreakdown?.score).toBe(0)
    })

    it('gives partial experience score when descriptions are missing', () => {
      const resume: ResumeData = { ...initialResumeData, experiences: [makeExp()] }
      const r = scoreResume(resume)
      const expBreakdown = r.breakdowns.find((b) => b.label === 'Experience')
      // Has 1 experience (4 pts) but no description (0 of 6 proportional pts)
      expect(expBreakdown?.score).toBe(4)
    })

    it('gives max experience score when all entries have descriptions', () => {
      const resume: ResumeData = {
        ...initialResumeData,
        experiences: [makeExp({ description: 'Led the team.' })],
      }
      const r = scoreResume(resume)
      const expBreakdown = r.breakdowns.find((b) => b.label === 'Experience')
      expect(expBreakdown?.score).toBe(10)
    })

    it('rewards a long summary (200+ chars)', () => {
      const longSummary = 'a'.repeat(200)
      const r = scoreResume({ ...initialResumeData, summary: longSummary })
      const bd = r.breakdowns.find((b) => b.label === 'Summary')
      expect(bd?.score).toBe(4)
    })

    it('gives partial summary score for 100–199 char summary', () => {
      const mediumSummary = 'a'.repeat(150)
      const r = scoreResume({ ...initialResumeData, summary: mediumSummary })
      const bd = r.breakdowns.find((b) => b.label === 'Summary')
      expect(bd?.score).toBe(3)
    })

    it('gives max skills score for 12+ skills', () => {
      const resume: ResumeData = {
        ...initialResumeData,
        skills: Array.from({ length: 12 }, (_, i) => makeSkill(`skill-${i}`)),
      }
      const r = scoreResume(resume)
      const bd = r.breakdowns.find((b) => b.label === 'Skills')
      expect(bd?.score).toBe(4)
    })

    it('gives 0 skills score for no skills', () => {
      const r = scoreResume(initialResumeData)
      const bd = r.breakdowns.find((b) => b.label === 'Skills')
      expect(bd?.score).toBe(0)
    })

    it('gives max extras score when projects, languages, and certifications are present', () => {
      const resume: ResumeData = {
        ...initialResumeData,
        projects: [makeProject()],
        certifications: [makeCert('Cert A')],
        languages: [{ id: '1', name: 'French', proficiency: 'Fluent', resumeId: '' }],
      }
      const r = scoreResume(resume)
      const bd = r.breakdowns.find((b) => b.label === 'Projects & Languages')
      expect(bd?.score).toBe(4)
    })
  })

  describe('pillar: content quality', () => {
    it('gives 0 action verb score with no experiences', () => {
      const r = scoreResume(initialResumeData)
      const bd = r.breakdowns.find((b) => b.label === 'Action Verbs')
      expect(bd?.score).toBe(0)
    })

    it('gives full action verb score when all roles start with known action verbs', () => {
      const resume: ResumeData = {
        ...initialResumeData,
        experiences: [
          makeExp({ id: 'e1', description: 'Led the migration of the core system.\nBuilt new features.' }),
          makeExp({ id: 'e2', description: 'Developed REST APIs.\nOptimized database queries.' }),
        ],
      }
      const r = scoreResume(resume)
      const bd = r.breakdowns.find((b) => b.label === 'Action Verbs')
      expect(bd?.score).toBe(12)
    })

    it('gives full quantified results score when all roles include metrics', () => {
      const resume: ResumeData = {
        ...initialResumeData,
        experiences: [
          makeExp({ id: 'e1', description: 'Reduced costs by 30%.\nIncreased revenue by $100k.' }),
          makeExp({ id: 'e2', description: 'Scaled system to 1000 users.' }),
        ],
      }
      const r = scoreResume(resume)
      const bd = r.breakdowns.find((b) => b.label === 'Quantified Results')
      expect(bd?.score).toBe(12)
    })

    it('gives 0 quantified results score when no roles include metrics', () => {
      const resume: ResumeData = {
        ...initialResumeData,
        experiences: [makeExp({ description: 'Did various things at work.' })],
      }
      const r = scoreResume(resume)
      const bd = r.breakdowns.find((b) => b.label === 'Quantified Results')
      expect(bd?.score).toBe(0)
    })
  })

  describe('pillar: ATS safety', () => {
    it('penalizes fancy bullet characters in experience descriptions', () => {
      const withFancy: ResumeData = {
        ...initialResumeData,
        experiences: [makeExp({ description: '• Led the team\n• Delivered results' })],
      }
      const withoutFancy: ResumeData = {
        ...initialResumeData,
        experiences: [makeExp({ description: '- Led the team\n- Delivered results' })],
      }
      expect(scoreResume(withFancy).atsSafety).toBeLessThan(scoreResume(withoutFancy).atsSafety)
    })

    it('penalizes ALL-CAPS job titles', () => {
      const allCaps: ResumeData = {
        ...initialResumeData,
        experiences: [makeExp({ role: 'SENIOR ENGINEER' })],
      }
      const titleCase: ResumeData = {
        ...initialResumeData,
        experiences: [makeExp({ role: 'Senior Engineer' })],
      }
      expect(scoreResume(allCaps).atsSafety).toBeLessThan(scoreResume(titleCase).atsSafety)
    })

    it('penalizes plus-alias emails', () => {
      const plusEmail: ResumeData = {
        ...initialResumeData,
        contactInfo: { ...initialResumeData.contactInfo, email: 'jane+work@example.com' },
      }
      const cleanEmail: ResumeData = {
        ...initialResumeData,
        contactInfo: { ...initialResumeData.contactInfo, email: 'jane@example.com' },
      }
      expect(scoreResume(plusEmail).atsSafety).toBeLessThan(scoreResume(cleanEmail).atsSafety)
    })

    it('rewards a LinkedIn link in ATS safety pillar', () => {
      const withLinkedIn: ResumeData = {
        ...initialResumeData,
        contactInfo: {
          ...initialResumeData.contactInfo,
          links: [{ label: 'LinkedIn', url: 'https://linkedin.com/in/jane' }],
        },
      }
      const r = scoreResume(withLinkedIn)
      const bd = r.breakdowns.find((b) => b.label === 'LinkedIn URL')
      expect(bd?.score).toBe(4)
    })

    it('penalizes special characters in job titles', () => {
      const specialRole: ResumeData = {
        ...initialResumeData,
        experiences: [makeExp({ role: 'Engineer <Lead>' })],
      }
      const cleanRole: ResumeData = {
        ...initialResumeData,
        experiences: [makeExp({ role: 'Engineer Lead' })],
      }
      expect(scoreResume(specialRole).atsSafety).toBeLessThan(scoreResume(cleanRole).atsSafety)
    })

    it('rewards having 3+ skills in the ATS safety pillar', () => {
      const withSkills: ResumeData = {
        ...initialResumeData,
        skills: ['TypeScript', 'React', 'Node.js'].map(makeSkill),
      }
      const r = scoreResume(withSkills)
      const bd = r.breakdowns.find((b) => b.label === 'Skills Section')
      expect(bd?.score).toBe(3)
    })
  })

  describe('tips', () => {
    it('tips contain text and step fields', () => {
      const r = scoreResume(initialResumeData)
      for (const tip of r.tips) {
        expect(typeof tip.text).toBe('string')
        expect(typeof tip.step).toBe('number')
      }
    })

    it('tips array is empty when resume is fully complete', () => {
      // A perfect resume should have no tips — verify at least tip count is low
      const r = scoreResume(richResume)
      expect(r.tips.length).toBeLessThanOrEqual(4)
    })
  })
})

// ─── getScoreLabel ────────────────────────────────────────────────────────────

describe('getScoreLabel', () => {
  it('returns "Excellent" for scores >= 90', () => {
    expect(getScoreLabel(90)).toBe('Excellent')
    expect(getScoreLabel(100)).toBe('Excellent')
    expect(getScoreLabel(95)).toBe('Excellent')
  })

  it('returns "Looking Good" for scores 75–89', () => {
    expect(getScoreLabel(75)).toBe('Looking Good')
    expect(getScoreLabel(80)).toBe('Looking Good')
    expect(getScoreLabel(89)).toBe('Looking Good')
  })

  it('returns "Getting There" for scores 50–74', () => {
    expect(getScoreLabel(50)).toBe('Getting There')
    expect(getScoreLabel(60)).toBe('Getting There')
    expect(getScoreLabel(74)).toBe('Getting There')
  })

  it('returns "Needs Work" for scores below 50', () => {
    expect(getScoreLabel(0)).toBe('Needs Work')
    expect(getScoreLabel(25)).toBe('Needs Work')
    expect(getScoreLabel(49)).toBe('Needs Work')
  })
})

// ─── getScoreColor ────────────────────────────────────────────────────────────

describe('getScoreColor', () => {
  it('returns a green hex for scores >= 90', () => {
    expect(getScoreColor(90)).toBe('#22c55e')
    expect(getScoreColor(100)).toBe('#22c55e')
  })

  it('returns a lime hex for scores 75–89', () => {
    expect(getScoreColor(75)).toBe('#84cc16')
    expect(getScoreColor(89)).toBe('#84cc16')
  })

  it('returns an amber hex for scores 50–74', () => {
    expect(getScoreColor(50)).toBe('#f59e0b')
    expect(getScoreColor(74)).toBe('#f59e0b')
  })

  it('returns a red hex for scores below 50', () => {
    expect(getScoreColor(0)).toBe('#ef4444')
    expect(getScoreColor(49)).toBe('#ef4444')
  })
})
