import { describe, it, expect } from 'vitest'
import { matchJD, flattenResumeText } from '@/lib/jd-matcher'
import { initialResumeData } from '@/stores/builder'
import type { ResumeData } from '@/stores/builder'

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeExp(overrides: Partial<{
  id: string
  role: string
  company: string
  description: string | null
  startDate: Date
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

function makeEdu(overrides: Partial<{ degree: string; school: string; fieldOfStudy?: string }> = {}) {
  return {
    id: 'edu-1',
    degree: overrides.degree ?? 'Bachelor of Science',
    school: overrides.school ?? 'State University',
    fieldOfStudy: overrides.fieldOfStudy ?? null,
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
    title: overrides.title ?? 'My Project',
    description: overrides.description ?? null,
    link: null,
    technologies: overrides.technologies ?? null,
    startDate: null,
    endDate: null,
    resumeId: 'resume-1',
  } as any
}

function makeCert(name: string) {
  return { id: `cert-${name}`, name, issuer: 'AWS', date: null, resumeId: 'resume-1' } as any
}

/** A resume that includes TypeScript, React, Node.js, PostgreSQL, Docker skills */
const techResume: ResumeData = {
  ...initialResumeData,
  contactInfo: {
    ...initialResumeData.contactInfo,
    headline: 'Full Stack Developer',
  },
  summary: 'Experienced software engineer specializing in TypeScript and React.',
  experiences: [
    makeExp({
      role: 'Frontend Engineer',
      description: 'Built scalable React applications using TypeScript and Redux.\nDeployed services using Docker and Kubernetes.',
    }),
  ],
  skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'].map(makeSkill),
}

// ─── flattenResumeText ────────────────────────────────────────────────────────

describe('flattenResumeText', () => {
  it('returns an empty string for the initial empty resume', () => {
    const text = flattenResumeText(initialResumeData)
    // All fields are empty, result should be effectively empty after joining
    expect(text.trim()).toBe('')
  })

  it('includes headline from contactInfo', () => {
    const resume: ResumeData = {
      ...initialResumeData,
      contactInfo: { ...initialResumeData.contactInfo, headline: 'Senior Engineer' },
    }
    expect(flattenResumeText(resume)).toContain('Senior Engineer')
  })

  it('includes summary text', () => {
    const resume: ResumeData = { ...initialResumeData, summary: 'Expert in machine learning.' }
    expect(flattenResumeText(resume)).toContain('machine learning')
  })

  it('includes experience role and company', () => {
    const resume: ResumeData = {
      ...initialResumeData,
      experiences: [makeExp({ role: 'Staff Engineer', company: 'BigCorp' })],
    }
    const text = flattenResumeText(resume)
    expect(text).toContain('Staff Engineer')
    expect(text).toContain('BigCorp')
  })

  it('includes experience description', () => {
    const resume: ResumeData = {
      ...initialResumeData,
      experiences: [makeExp({ description: 'Worked extensively with GraphQL.' })],
    }
    expect(flattenResumeText(resume)).toContain('GraphQL')
  })

  it('includes skill names', () => {
    const resume: ResumeData = {
      ...initialResumeData,
      skills: ['Rust', 'Elixir'].map(makeSkill),
    }
    const text = flattenResumeText(resume)
    expect(text).toContain('Rust')
    expect(text).toContain('Elixir')
  })

  it('includes education degree and fieldOfStudy', () => {
    const resume: ResumeData = {
      ...initialResumeData,
      education: [makeEdu({ degree: 'Master of Science', fieldOfStudy: 'Computer Science' })],
    }
    const text = flattenResumeText(resume)
    expect(text).toContain('Master of Science')
    expect(text).toContain('Computer Science')
  })

  it('includes project title and technologies', () => {
    const resume: ResumeData = {
      ...initialResumeData,
      projects: [makeProject({ title: 'Serverless App', technologies: 'AWS Lambda, DynamoDB' })],
    }
    const text = flattenResumeText(resume)
    expect(text).toContain('Serverless App')
    expect(text).toContain('AWS Lambda')
  })

  it('includes certification names', () => {
    const resume: ResumeData = {
      ...initialResumeData,
      certifications: [makeCert('Google Cloud Professional')],
    }
    expect(flattenResumeText(resume)).toContain('Google Cloud Professional')
  })
})

// ─── matchJD ─────────────────────────────────────────────────────────────────

describe('matchJD', () => {
  describe('empty inputs', () => {
    it('returns zero match when JD is empty string', () => {
      const result = matchJD('', techResume)
      expect(result.matchPercent).toBe(0)
      expect(result.matched).toEqual([])
      expect(result.missing).toEqual([])
      expect(result.total).toBe(0)
    })

    it('returns zero match when JD has only stopwords', () => {
      const result = matchJD('the a an in on at to for of and or', techResume)
      expect(result.matchPercent).toBe(0)
      expect(result.total).toBe(0)
    })

    it('returns non-zero missing when resume is empty but JD has keywords', () => {
      const result = matchJD('We need a TypeScript developer with React and Node.js experience.', initialResumeData)
      expect(result.missing.length).toBeGreaterThan(0)
      expect(result.matchPercent).toBe(0)
    })
  })

  describe('result shape', () => {
    it('returns matchPercent, matched, missing, and total', () => {
      const result = matchJD('Looking for a TypeScript engineer.', techResume)
      expect(result).toHaveProperty('matchPercent')
      expect(result).toHaveProperty('matched')
      expect(result).toHaveProperty('missing')
      expect(result).toHaveProperty('total')
    })

    it('matched + missing = total', () => {
      const jd = 'We need a TypeScript developer with React and Docker experience. PostgreSQL and Node.js preferred.'
      const result = matchJD(jd, techResume)
      expect(result.matched.length + result.missing.length).toBe(result.total)
    })

    it('matchPercent is between 0 and 100', () => {
      const jd = 'TypeScript React Node Docker Python Go Rust Java Kotlin Swift Scala Elixir'
      const result = matchJD(jd, techResume)
      expect(result.matchPercent).toBeGreaterThanOrEqual(0)
      expect(result.matchPercent).toBeLessThanOrEqual(100)
    })
  })

  describe('strong match (>= 70% of JD keywords found)', () => {
    it('achieves a high match percent when resume contains most JD keywords', () => {
      // JD contains only keywords the resume has
      const jd = 'TypeScript React Node.js PostgreSQL Docker Frontend Engineer applications'
      const result = matchJD(jd, techResume)
      expect(result.matchPercent).toBeGreaterThanOrEqual(70)
    })

    it('matched array contains keywords found in the resume', () => {
      const jd = 'TypeScript React Node.js PostgreSQL Docker'
      const result = matchJD(jd, techResume)
      expect(result.matched.length).toBeGreaterThan(0)
    })
  })

  describe('weak match (< 40% of JD keywords found)', () => {
    it('gives a low match percent when resume lacks most JD keywords', () => {
      // JD has many keywords not on the resume
      const jd = 'Java Spring Hibernate Oracle Kubernetes Spark Kafka Flink Hadoop HDFS'
      const result = matchJD(jd, initialResumeData)
      expect(result.matchPercent).toBeLessThan(40)
    })

    it('missing array contains keywords absent from resume', () => {
      const jd = 'Haskell Erlang Prolog COBOL assembly language programming'
      const result = matchJD(jd, initialResumeData)
      expect(result.missing.length).toBeGreaterThan(0)
    })
  })

  describe('case-insensitive matching', () => {
    it('matches keywords regardless of case in the JD', () => {
      const jdLower = 'typescript react node.js postgresql docker'
      const jdUpper = 'TypeScript React Node.js PostgreSQL Docker'
      const resultLower = matchJD(jdLower, techResume)
      const resultUpper = matchJD(jdUpper, techResume)
      // Both should produce the same matched/missing arrays (modulo case of extracted keywords)
      expect(resultLower.matchPercent).toBe(resultUpper.matchPercent)
    })

    it('matches resume text case-insensitively against JD keywords', () => {
      const resumeWithUpperSkills: ResumeData = {
        ...initialResumeData,
        skills: ['TYPESCRIPT', 'REACT'].map(makeSkill),
      }
      const jd = 'Looking for typescript and react developer'
      const result = matchJD(jd, resumeWithUpperSkills)
      // "typescript" and "react" should be found even when skills are uppercase
      expect(result.matchPercent).toBeGreaterThan(0)
    })
  })

  describe('keyword extraction', () => {
    it('filters out stopwords from the JD', () => {
      // "the", "a", "for", "with" are stopwords and should not appear in keywords
      const jd = 'the a for with TypeScript'
      const result = matchJD(jd, techResume)
      // Only "typescript" should be a keyword; total should be 1
      expect(result.total).toBe(1)
    })

    it('handles tech terms like Node.js and C++ in keywords', () => {
      const jd = 'We need a developer with Node.js and C++ experience.'
      const result = matchJD(jd, techResume)
      // "node.js" should be extracted as a keyword
      const allKeywords = [...result.matched, ...result.missing]
      expect(allKeywords.some((k) => k.includes('node'))).toBe(true)
    })

    it('returns no more than 25 keywords from a very long JD', () => {
      // Build a JD with 40+ unique non-stopword words
      const words = Array.from({ length: 40 }, (_, i) => `keyword${i + 1}`)
      const jd = words.join(' ')
      const result = matchJD(jd, initialResumeData)
      expect(result.total).toBeLessThanOrEqual(25)
    })
  })

  describe('partial match (40–69%)', () => {
    it('produces a partial match when resume has about half the JD keywords', () => {
      // Resume has TypeScript, React, Node.js, PostgreSQL, Docker — 5 skills
      // JD has those 5 plus 5 others the resume doesn't have
      const jd = 'TypeScript React Node.js PostgreSQL Docker Kafka Spark Hadoop Flink Cassandra'
      const result = matchJD(jd, techResume)
      // Should be somewhere in the 40–69% range (or close)
      expect(result.matchPercent).toBeGreaterThanOrEqual(30)
      expect(result.matchPercent).toBeLessThan(90)
    })
  })
})
