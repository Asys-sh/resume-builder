import type { ResumeData } from '@/stores/builder'

// ─── Action verb dictionary ───────────────────────────────────────────────────

const ACTION_VERBS = new Set([
  'accelerated', 'achieved', 'acquired', 'administered', 'advised', 'analyzed', 'architected',
  'automated', 'built', 'championed', 'collaborated', 'consolidated', 'constructed',
  'coordinated', 'created', 'cut', 'decreased', 'defined', 'delivered', 'deployed', 'designed',
  'developed', 'directed', 'drove', 'engineered', 'established', 'evaluated', 'executed',
  'expanded', 'generated', 'grew', 'guided', 'implemented', 'improved', 'increased',
  'integrated', 'introduced', 'launched', 'led', 'maintained', 'managed', 'mentored',
  'migrated', 'modernized', 'monitored', 'negotiated', 'optimized', 'owned', 'partnered',
  'pioneered', 'planned', 'produced', 'reduced', 'refactored', 'resolved', 'scaled', 'shipped',
  'simplified', 'spearheaded', 'streamlined', 'trained', 'transformed', 'upgraded',
])

const QUANTIFIED_RE =
  /\b\d+\s*[%xX×]\b|\$\s*\d+|\b\d+[kKmMbB]\b|\b\d+\s*(percent|users|customers|engineers|employees|hours|days|months|years|requests|transactions|features?|services?|clients?|products?|repos?)\b/i

const FANCY_BULLETS_RE = /[•◆★♦◉▶►●■□▪▫]/
const ALLCAPS_RE = /\b[A-Z]{4,}\b/
const SPECIAL_ROLE_RE = /[<>{}\[\]|\\^~`]/

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SectionBreakdown {
  label: string
  score: number
  maxScore: number
  tip: string | null
  detail: string
  step: number
}

export interface ResumeScore {
  total: number
  completeness: number
  completenessMax: number
  contentQuality: number
  contentQualityMax: number
  atsSafety: number
  atsSafetyMax: number
  breakdowns: SectionBreakdown[]
  tips: Array<{ text: string; step: number }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBullets(description: string | null | undefined): string[] {
  if (!description) return []
  return description
    .split('\n')
    .map((l) => l.replace(/^[\s\-–—•*]+/, '').trim())
    .filter(Boolean)
}

function hasActionVerb(text: string): boolean {
  const firstWord = text.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
  return ACTION_VERBS.has(firstWord)
}

function hasQuantifiedResult(text: string): boolean {
  return QUANTIFIED_RE.test(text)
}

function expHasActionVerb(description: string | null | undefined): boolean {
  const bullets = getBullets(description)
  if (bullets.length > 0) return bullets.some(hasActionVerb)
  return hasActionVerb(description ?? '')
}

function expHasQuantifiedResult(description: string | null | undefined): boolean {
  const bullets = getBullets(description)
  if (bullets.length > 0) return bullets.some(hasQuantifiedResult)
  return hasQuantifiedResult(description ?? '')
}

// ─── Pillar 1: Completeness (max 40) ─────────────────────────────────────────

function scoreCompleteness(data: ResumeData): { score: number; breakdowns: SectionBreakdown[] } {
  const { contactInfo, experiences, skills, summary, education, projects, certifications, languages, awards } = data
  const breakdowns: SectionBreakdown[] = []
  let score = 0

  // Contact info — 14 pts
  const hasName = contactInfo.fullName.trim().length > 0
  const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)
  const hasPhone = contactInfo.phone.trim().length > 0
  const hasLinkedIn = contactInfo.links?.some((l) => l.label === 'LinkedIn' && l.url.trim()) ?? false
  const hasAnyLink = (contactInfo.links?.length ?? 0) > 0
  const hasHeadline = contactInfo.headline.trim().length > 0
  const hasAddress = contactInfo.address.trim().length > 0
  const contactScore =
    (hasName ? 4 : 0) + (hasEmail ? 4 : 0) + (hasPhone ? 2 : 0) + (hasLinkedIn ? 2 : 0) + (hasHeadline ? 2 : 0)
  score += contactScore + (hasAnyLink || hasAddress ? 2 : 0)

  const contactTip = !hasName
    ? 'Add your full name'
    : !hasEmail
      ? 'Add a valid email address'
      : !hasPhone
        ? 'Add your phone number'
        : !hasLinkedIn
          ? 'Add a LinkedIn link'
          : !hasHeadline
            ? 'Add a professional headline'
            : null
  const contactFilled = [hasName, hasEmail, hasPhone, hasLinkedIn, hasHeadline, hasAnyLink || hasAddress].filter(
    Boolean,
  ).length
  breakdowns.push({
    label: 'Contact Info',
    score: Math.min(contactScore + (hasAnyLink || hasAddress ? 2 : 0), 14),
    maxScore: 14,
    tip: contactTip,
    detail: `${contactFilled}/6 fields filled`,
    step: 1,
  })

  // Experience — 10 pts
  const hasExps = experiences.length >= 1
  const expsWithDesc = experiences.filter((e) => e.description?.trim()).length
  const expScore = hasExps
    ? 4 + (experiences.length > 0 ? Math.round((expsWithDesc / experiences.length) * 6) : 0)
    : 0
  score += expScore
  breakdowns.push({
    label: 'Experience',
    score: expScore,
    maxScore: 10,
    tip: !hasExps
      ? 'Add at least one work experience'
      : expsWithDesc < experiences.length
        ? `Add descriptions to all experience entries (${experiences.length - expsWithDesc} missing)`
        : null,
    detail: hasExps
      ? `${experiences.length} entr${experiences.length === 1 ? 'y' : 'ies'}, ${expsWithDesc}/${experiences.length} with descriptions`
      : 'No experience added',
    step: 2,
  })

  // Summary — 4 pts
  const summaryLen = summary.trim().length
  const summaryScore =
    summaryLen >= 200 ? 4 : summaryLen >= 100 ? 3 : summaryLen >= 50 ? 2 : summaryLen > 0 ? 1 : 0
  score += summaryScore
  breakdowns.push({
    label: 'Summary',
    score: summaryScore,
    maxScore: 4,
    tip:
      summaryLen === 0
        ? null
        : summaryLen < 100
          ? 'Expand your summary to at least 100 characters'
          : summaryLen < 200
            ? 'Aim for 200+ characters for a stronger summary'
            : null,
    detail: summaryLen > 0 ? `${summaryLen} characters` : 'No summary written',
    step: 3,
  })

  // Education — 4 pts
  const hasEdu = education.length >= 1
  const eduWithFields = education.filter((e) => e.degree?.trim() && e.school?.trim()).length
  const eduScore = hasEdu ? (eduWithFields === education.length ? 4 : 2) : 0
  score += eduScore
  breakdowns.push({
    label: 'Education',
    score: eduScore,
    maxScore: 4,
    tip: !hasEdu
      ? 'Add your education'
      : eduWithFields < education.length
        ? 'Fill in degree and school for all education entries'
        : null,
    detail: hasEdu ? `${education.length} entr${education.length === 1 ? 'y' : 'ies'}` : 'No education added',
    step: 4,
  })

  // Skills — 4 pts
  const skillsScore =
    skills.length >= 12 ? 4 : skills.length >= 8 ? 3 : skills.length >= 5 ? 2 : skills.length >= 3 ? 1 : 0
  score += skillsScore
  breakdowns.push({
    label: 'Skills',
    score: skillsScore,
    maxScore: 4,
    tip:
      skills.length === 0
        ? 'Add your skills'
        : skills.length < 5
          ? `Add ${5 - skills.length} more skills (aim for 8+)`
          : skills.length < 8
            ? `Add ${8 - skills.length} more skills for a stronger profile`
            : null,
    detail: `${skills.length} skill${skills.length !== 1 ? 's' : ''}`,
    step: 2,
  })

  // Projects & languages — 4 pts
  const extrasScore = (projects.length >= 1 ? 2 : 0) + (languages.length >= 1 ? 1 : 0) + (certifications.length >= 1 || awards.length >= 1 ? 1 : 0)
  score += extrasScore
  breakdowns.push({
    label: 'Projects & Languages',
    score: extrasScore,
    maxScore: 4,
    tip:
      projects.length === 0
        ? 'Add at least one project to stand out'
        : languages.length === 0
          ? 'Add languages you speak'
          : null,
    detail: `${projects.length} project${projects.length !== 1 ? 's' : ''}, ${languages.length} language${languages.length !== 1 ? 's' : ''}`,
    step: 5,
  })

  return { score: Math.min(score, 40), breakdowns }
}

// ─── Pillar 2: Content Quality (max 40) ──────────────────────────────────────

function scoreContentQuality(data: ResumeData): { score: number; breakdowns: SectionBreakdown[] } {
  const { experiences, skills, summary, projects } = data
  const breakdowns: SectionBreakdown[] = []
  let score = 0

  // Action verbs — 12 pts
  const verbCount = experiences.filter((e) => expHasActionVerb(e.description)).length
  const verbScore = experiences.length > 0 ? Math.round((verbCount / experiences.length) * 12) : 0
  score += verbScore
  breakdowns.push({
    label: 'Action Verbs',
    score: verbScore,
    maxScore: 12,
    tip:
      experiences.length === 0
        ? null
        : verbCount < experiences.length
          ? `Start bullets with strong verbs like "Led", "Built", "Increased" — ${experiences.length - verbCount} role${experiences.length - verbCount !== 1 ? 's' : ''} missing this`
          : null,
    detail:
      experiences.length > 0 ? `${verbCount}/${experiences.length} roles use action verbs` : 'No experience to evaluate',
    step: 2,
  })

  // Quantified results — 12 pts
  const quantCount = experiences.filter((e) => expHasQuantifiedResult(e.description)).length
  const quantScore = experiences.length > 0 ? Math.round((quantCount / experiences.length) * 12) : 0
  score += quantScore
  breakdowns.push({
    label: 'Quantified Results',
    score: quantScore,
    maxScore: 12,
    tip:
      experiences.length === 0
        ? null
        : quantCount < experiences.length
          ? `Add numbers to your impact — %, $, or counts like "increased sales by 30%" in ${experiences.length - quantCount} role${experiences.length - quantCount !== 1 ? 's' : ''}`
          : null,
    detail:
      experiences.length > 0 ? `${quantCount}/${experiences.length} roles have metrics` : 'No experience to evaluate',
    step: 2,
  })

  // Summary quality — 8 pts
  const summaryLen = summary.trim().length
  const summaryQualScore =
    summaryLen >= 200 ? 8 : summaryLen >= 150 ? 6 : summaryLen >= 100 ? 4 : summaryLen >= 50 ? 2 : 0
  score += summaryQualScore
  breakdowns.push({
    label: 'Summary Quality',
    score: summaryQualScore,
    maxScore: 8,
    tip:
      summaryLen === 0
        ? "Write a professional summary — it's the first thing recruiters read"
        : summaryLen < 150
          ? 'Expand your summary to 150+ characters for stronger impact'
          : null,
    detail:
      summaryLen > 0
        ? `${summaryLen} chars — ${summaryLen >= 200 ? 'excellent' : summaryLen >= 150 ? 'good' : summaryLen >= 100 ? 'could be longer' : 'too short'}`
        : 'No summary',
    step: 3,
  })

  // Skills breadth — 4 pts
  const skillsQualScore =
    skills.length >= 12 ? 4 : skills.length >= 8 ? 3 : skills.length >= 5 ? 2 : skills.length >= 3 ? 1 : 0
  score += skillsQualScore
  breakdowns.push({
    label: 'Skills Breadth',
    score: skillsQualScore,
    maxScore: 4,
    tip:
      skills.length < 8
        ? `Recruiters scan skills quickly — aim for 8–12 (currently ${skills.length})`
        : null,
    detail: `${skills.length} skill${skills.length !== 1 ? 's' : ''} listed`,
    step: 2,
  })

  // Project descriptions — 4 pts
  const projWithDesc = projects.filter((p) => p.description?.trim()).length
  const projQualScore =
    projects.length === 0 ? 0 : Math.round((projWithDesc / projects.length) * 4)
  score += projQualScore
  breakdowns.push({
    label: 'Project Descriptions',
    score: projQualScore,
    maxScore: 4,
    tip:
      projects.length > 0 && projWithDesc < projects.length
        ? `Add descriptions to all projects (${projects.length - projWithDesc} missing)`
        : null,
    detail:
      projects.length > 0
        ? `${projWithDesc}/${projects.length} projects have descriptions`
        : 'No projects',
    step: 5,
  })

  return { score: Math.min(score, 40), breakdowns }
}

// ─── Pillar 3: ATS Safety (max 20) ───────────────────────────────────────────

function scoreAtsSafety(data: ResumeData): { score: number; breakdowns: SectionBreakdown[] } {
  const { contactInfo, experiences, skills } = data
  const breakdowns: SectionBreakdown[] = []
  let score = 0

  // LinkedIn — 4 pts
  const hasLinkedIn = contactInfo.links?.some((l) => l.label === 'LinkedIn' && l.url.trim()) ?? false
  score += hasLinkedIn ? 4 : 0
  breakdowns.push({
    label: 'LinkedIn URL',
    score: hasLinkedIn ? 4 : 0,
    maxScore: 4,
    tip: !hasLinkedIn ? 'Add a LinkedIn profile link — ATS systems and recruiters always check this' : null,
    detail: hasLinkedIn ? 'LinkedIn URL present' : 'No LinkedIn URL',
    step: 1,
  })

  // No fancy Unicode bullets — 4 pts
  const hasFancy = experiences.some((e) => FANCY_BULLETS_RE.test(e.description ?? ''))
  score += hasFancy ? 0 : 4
  breakdowns.push({
    label: 'ATS-Safe Characters',
    score: hasFancy ? 0 : 4,
    maxScore: 4,
    tip: hasFancy
      ? 'Remove special bullet characters (•, ★, ◆) from descriptions — use plain dashes or newlines'
      : null,
    detail: hasFancy ? 'Fancy characters detected in descriptions' : 'No problematic characters',
    step: 2,
  })

  // No ALL-CAPS job titles — 4 pts
  const hasAllCaps = experiences.some((e) => ALLCAPS_RE.test(e.role ?? ''))
  score += hasAllCaps ? 0 : 4
  breakdowns.push({
    label: 'Professional Casing',
    score: hasAllCaps ? 0 : 4,
    maxScore: 4,
    tip: hasAllCaps
      ? 'Avoid ALL-CAPS in job titles — use Title Case (e.g. "Senior Engineer" not "SENIOR ENGINEER")'
      : null,
    detail: hasAllCaps ? 'ALL-CAPS detected in job titles' : 'Job titles look good',
    step: 2,
  })

  // Email format — 3 pts
  const hasEmailPlus = contactInfo.email.includes('+')
  score += hasEmailPlus ? 1 : 3
  breakdowns.push({
    label: 'Email Format',
    score: hasEmailPlus ? 1 : 3,
    maxScore: 3,
    tip: hasEmailPlus
      ? 'Some ATS systems mishandle "+" aliases in emails — consider a plain address'
      : null,
    detail: contactInfo.email
      ? hasEmailPlus
        ? 'Plus-alias email detected'
        : 'Email looks clean'
      : 'No email',
    step: 1,
  })

  // Skills present — 3 pts
  score += skills.length >= 3 ? 3 : skills.length >= 1 ? 1 : 0
  breakdowns.push({
    label: 'Skills Section',
    score: skills.length >= 3 ? 3 : skills.length >= 1 ? 1 : 0,
    maxScore: 3,
    tip:
      skills.length === 0
        ? 'Add skills — ATS systems keyword-match your skills section'
        : skills.length < 3
          ? 'Add at least 3 skills for ATS keyword matching'
          : null,
    detail: `${skills.length} skill${skills.length !== 1 ? 's' : ''} listed`,
    step: 2,
  })

  // Clean job titles — 2 pts
  const hasSpecialRole = experiences.some((e) => SPECIAL_ROLE_RE.test(e.role ?? ''))
  score += hasSpecialRole ? 0 : 2
  breakdowns.push({
    label: 'Clean Job Titles',
    score: hasSpecialRole ? 0 : 2,
    maxScore: 2,
    tip: hasSpecialRole ? 'Remove special characters (<, >, {}, []) from job titles' : null,
    detail: hasSpecialRole ? 'Special characters in job titles' : 'Job titles are clean',
    step: 2,
  })

  return { score: Math.min(score, 20), breakdowns }
}

// ─── Main scorer ──────────────────────────────────────────────────────────────

export function scoreResume(data: ResumeData): ResumeScore {
  const { score: completeness, breakdowns: cb } = scoreCompleteness(data)
  const { score: contentQuality, breakdowns: qb } = scoreContentQuality(data)
  const { score: atsSafety, breakdowns: ab } = scoreAtsSafety(data)

  const total = completeness + contentQuality + atsSafety

  const tips = [...cb, ...qb, ...ab]
    .filter((b) => b.tip !== null)
    .sort((a, b) => b.maxScore - b.score - (a.maxScore - a.score))
    .slice(0, 4)
    .map((b) => ({ text: b.tip as string, step: b.step }))

  return {
    total,
    completeness,
    completenessMax: 40,
    contentQuality,
    contentQualityMax: 40,
    atsSafety,
    atsSafetyMax: 20,
    breakdowns: [...cb, ...qb, ...ab],
    tips,
  }
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Looking Good'
  if (score >= 50) return 'Getting There'
  return 'Needs Work'
}

export function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e'
  if (score >= 75) return '#84cc16'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}
