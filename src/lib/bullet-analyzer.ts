// ─── Action verb dictionary (mirrors resume-scorer.ts) ───────────────────────

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
  /\b\d+\s*[%xX×]|\$\s*\d+|\b\d+[kKmMbB]\b|\b\d+\s*(percent|users|customers|engineers|employees|hours|days|months|years|requests|transactions|features?|services?|clients?|products?|repos?)\b/i

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BulletQuality {
  text: string
  hasActionVerb: boolean
  hasQuantified: boolean
  lengthStatus: 'good' | 'short' | 'long'
  score: 0 | 1 | 2 | 3
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function analyzeBullets(description: string | null | undefined): BulletQuality[] {
  if (!description?.trim()) return []

  return description
    .split('\n')
    .map((l) => l.replace(/^[\s\-–—•*]+/, '').trim())
    .filter(Boolean)
    .map((text) => {
      const firstWord = text.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
      const hasActionVerb = ACTION_VERBS.has(firstWord)
      const hasQuantified = QUANTIFIED_RE.test(text)
      const lengthStatus: BulletQuality['lengthStatus'] =
        text.length < 40 ? 'short' : text.length > 220 ? 'long' : 'good'
      const score = ((hasActionVerb ? 1 : 0) +
        (hasQuantified ? 1 : 0) +
        (lengthStatus === 'good' ? 1 : 0)) as 0 | 1 | 2 | 3
      return { text, hasActionVerb, hasQuantified, lengthStatus, score }
    })
}
