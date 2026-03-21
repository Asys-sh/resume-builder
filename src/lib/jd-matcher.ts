import type { ResumeData } from '@/stores/builder'

// ─── Stopwords ────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is',
  'are', 'will', 'be', 'has', 'have', 'had', 'with', 'as', 'by', 'from', 'that',
  'this', 'we', 'you', 'our', 'your', 'they', 'their', 'its', 'not', 'but',
  'if', 'do', 'did', 'can', 'could', 'would', 'should', 'may', 'might', 'must',
  'also', 'about', 'than', 'more', 'other', 'such', 'into', 'out', 'so',
  'all', 'any', 'each', 'new', 'high', 'strong', 'well', 'able', 'within',
  'across', 'through', 'over', 'under', 'some', 'what', 'when', 'where',
  'how', 'who', 'which', 'being', 'been', 'were', 'was', 'am', 'us', 'me',
  'role', 'position', 'work', 'team', 'using', 'use', 'used', 'including',
  'required', 'preferred', 'minimum', 'plus', 'least', 'most', 'very', 'highly',
  'etc', 'candidate', 'responsibilities', 'qualifications', 'requirement',
  'requirements', 'ability', 'understanding', 'environment', 'provide',
  'ensure', 'support', 'help', 'develop', 'build', 'create', 'manage',
  'maintain', 'implement', 'looking', 'seeking', 'join', 'working', 'apply',
])

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JDMatchResult {
  matchPercent: number
  matched: string[]
  missing: string[]
  total: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractKeywords(text: string, topN = 25): string[] {
  const freq: Record<string, number> = {}
  // Include tech-term chars like C++, .NET, Node.js, C#
  const tokens = text.toLowerCase().match(/[a-z][a-z0-9+#.]*[a-z0-9]|[a-z]{3,}/g) ?? []

  for (const token of tokens) {
    if (token.length < 3) continue
    if (STOPWORDS.has(token)) continue
    if (/^\d+$/.test(token)) continue
    freq[token] = (freq[token] ?? 0) + 1
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word)
}

export function flattenResumeText(data: ResumeData): string {
  const parts: string[] = []
  if (data.contactInfo?.headline) parts.push(data.contactInfo.headline)
  if (data.summary) parts.push(data.summary)
  for (const exp of data.experiences) {
    if (exp.role) parts.push(exp.role)
    if (exp.company) parts.push(exp.company)
    if (exp.description) parts.push(exp.description)
  }
  for (const skill of data.skills) {
    parts.push(skill.name)
  }
  for (const edu of data.education) {
    parts.push(edu.degree)
    if (edu.fieldOfStudy) parts.push(edu.fieldOfStudy)
  }
  for (const proj of data.projects) {
    if (proj.title) parts.push(proj.title)
    if (proj.description) parts.push(proj.description)
    if (proj.technologies) parts.push(proj.technologies)
  }
  for (const cert of data.certifications) {
    parts.push(cert.name)
  }
  return parts.join(' ')
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function matchJD(jd: string, resumeData: ResumeData): JDMatchResult {
  const jdKeywords = extractKeywords(jd, 25)
  if (jdKeywords.length === 0) {
    return { matchPercent: 0, matched: [], missing: [], total: 0 }
  }

  const resumeText = flattenResumeText(resumeData).toLowerCase()

  const matched: string[] = []
  const missing: string[] = []

  for (const kw of jdKeywords) {
    // Escape special regex chars (C++, .NET etc.) then do word-boundary check
    const escaped = kw.replace(/[.+#]/g, '\\$&')
    const re = new RegExp(`\\b${escaped}`, 'i')
    if (re.test(resumeText)) {
      matched.push(kw)
    } else {
      missing.push(kw)
    }
  }

  const matchPercent = Math.round((matched.length / jdKeywords.length) * 100)
  return { matchPercent, matched, missing, total: jdKeywords.length }
}
