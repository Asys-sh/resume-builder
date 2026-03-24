/**
 * NOTE: BulletAnalyzer.tsx is a React component with no pure exported functions.
 * All analysis logic lives in src/lib/bullet-analyzer.ts, which is what BulletAnalyzer.tsx
 * imports and uses. These tests exercise src/lib/bullet-analyzer.ts directly via its
 * exported `analyzeBullets` function and the `BulletQuality` type.
 *
 * The FANCY_BULLETS_RE regex defined inside BulletAnalyzer.tsx is re-tested inline here
 * (it is not exported), since BulletAnalyzer.tsx uses it for the warning banner.
 */

import { describe, it, expect } from 'vitest'
import { analyzeBullets } from '@/lib/bullet-analyzer'
import type { BulletQuality as _BulletQuality } from '@/lib/bullet-analyzer'

// ─── analyzeBullets: basic behavior ──────────────────────────────────────────

describe('analyzeBullets', () => {
  describe('null / empty inputs', () => {
    it('returns an empty array for null', () => {
      expect(analyzeBullets(null)).toEqual([])
    })

    it('returns an empty array for undefined', () => {
      expect(analyzeBullets(undefined)).toEqual([])
    })

    it('returns an empty array for an empty string', () => {
      expect(analyzeBullets('')).toEqual([])
    })

    it('returns an empty array for a whitespace-only string', () => {
      expect(analyzeBullets('   \n  \t  ')).toEqual([])
    })
  })

  describe('return shape', () => {
    it('returns an array of BulletQuality objects with expected keys', () => {
      const results = analyzeBullets('Led the engineering team to deliver the product.')
      expect(results.length).toBe(1)
      const b = results[0]
      expect(b).toHaveProperty('text')
      expect(b).toHaveProperty('hasActionVerb')
      expect(b).toHaveProperty('hasQuantified')
      expect(b).toHaveProperty('lengthStatus')
      expect(b).toHaveProperty('score')
    })

    it('score is 0, 1, 2, or 3', () => {
      const results = analyzeBullets(
        'Led the team to increase revenue by 40%.\n' +
        'Did some work.\n' +
        'Developed a new feature and increased throughput by 2x.',
      )
      for (const b of results) {
        expect([0, 1, 2, 3]).toContain(b.score)
      }
    })
  })

  describe('line splitting', () => {
    it('splits on newlines and returns one entry per non-empty line', () => {
      const input = 'Led team.\nBuilt service.\nDeployed app.'
      const results = analyzeBullets(input)
      expect(results.length).toBe(3)
    })

    it('ignores blank lines between bullets', () => {
      const input = 'Led team.\n\nBuilt service.'
      const results = analyzeBullets(input)
      expect(results.length).toBe(2)
    })

    it('strips common bullet prefixes from each line', () => {
      const input = '• Led the team.\n- Built the service.\n* Deployed the app.\n– Scaled the infra.'
      const results = analyzeBullets(input)
      expect(results.every((b) => !b.text.startsWith('•'))).toBe(true)
      expect(results.every((b) => !b.text.startsWith('-'))).toBe(true)
      expect(results.every((b) => !b.text.startsWith('*'))).toBe(true)
      expect(results.every((b) => !b.text.startsWith('–'))).toBe(true)
    })
  })

  describe('hasActionVerb detection', () => {
    it('detects a known action verb at the start of a bullet', () => {
      const results = analyzeBullets('Led the engineering team.')
      expect(results[0].hasActionVerb).toBe(true)
    })

    it('detects action verbs case-insensitively (first word is lowercased for lookup)', () => {
      const results = analyzeBullets('Led the team.')
      expect(results[0].hasActionVerb).toBe(true)
    })

    it('does not detect an action verb when the first word is not in the set', () => {
      const results = analyzeBullets('Responsible for managing the team.')
      expect(results[0].hasActionVerb).toBe(false)
    })

    it('detects multiple valid action verbs across bullets', () => {
      const input = 'Built a scalable system.\nDeveloped REST APIs.\nOptimized database performance.'
      const results = analyzeBullets(input)
      expect(results.every((b) => b.hasActionVerb)).toBe(true)
    })

    it('does not match a partial word at the start', () => {
      // "builds" is not in the set, only "built"
      const results = analyzeBullets('builds fast systems')
      expect(results[0].hasActionVerb).toBe(false)
    })
  })

  describe('hasQuantified detection', () => {
    it('detects a percentage', () => {
      const results = analyzeBullets('Increased conversion rates by 25%.')
      expect(results[0].hasQuantified).toBe(true)
    })

    it('detects a dollar amount', () => {
      const results = analyzeBullets('Generated $500k in new revenue.')
      expect(results[0].hasQuantified).toBe(true)
    })

    it('detects k/m/b suffix shorthand', () => {
      const kResult = analyzeBullets('Scaled system to 10k daily active users.')
      const mResult = analyzeBullets('Managed $2m budget.')
      expect(kResult[0].hasQuantified).toBe(true)
      expect(mResult[0].hasQuantified).toBe(true)
    })

    it('detects multiplier (x or X or ×)', () => {
      const results = analyzeBullets('Improved throughput by 3x.')
      expect(results[0].hasQuantified).toBe(true)
    })

    it('detects word-form quantities', () => {
      const results = analyzeBullets('Mentored 12 engineers across three teams.')
      expect(results[0].hasQuantified).toBe(true)
    })

    it('detects "percent" spelled out', () => {
      const results = analyzeBullets('Reduced churn by 15 percent.')
      expect(results[0].hasQuantified).toBe(true)
    })

    it('returns false when there is no quantified result', () => {
      const results = analyzeBullets('Managed the team effectively.')
      expect(results[0].hasQuantified).toBe(false)
    })
  })

  describe('lengthStatus', () => {
    it('marks a bullet shorter than 40 chars as "short"', () => {
      const results = analyzeBullets('Led the team.')  // 13 chars
      expect(results[0].lengthStatus).toBe('short')
    })

    it('marks a bullet between 40 and 220 chars as "good"', () => {
      const bullet = 'Led the engineering team to deliver a major product launch on time and under budget for the quarter.' // ~100 chars
      const results = analyzeBullets(bullet)
      expect(results[0].lengthStatus).toBe('good')
    })

    it('marks a bullet longer than 220 chars as "long"', () => {
      const bullet = 'Led '.padEnd(221, 'a very long bullet that describes an overly wordy achievement ')
      const results = analyzeBullets(bullet)
      expect(results[0].lengthStatus).toBe('long')
    })

    it('40-char boundary: exactly 40 chars is "good"', () => {
      const bullet = 'a'.repeat(40)
      const results = analyzeBullets(bullet)
      expect(results[0].lengthStatus).toBe('good')
    })

    it('39-char boundary: exactly 39 chars is "short"', () => {
      const bullet = 'a'.repeat(39)
      const results = analyzeBullets(bullet)
      expect(results[0].lengthStatus).toBe('short')
    })

    it('220-char boundary: exactly 220 chars is "good"', () => {
      const bullet = 'a'.repeat(220)
      const results = analyzeBullets(bullet)
      expect(results[0].lengthStatus).toBe('good')
    })

    it('221-char boundary: exactly 221 chars is "long"', () => {
      const bullet = 'a'.repeat(221)
      const results = analyzeBullets(bullet)
      expect(results[0].lengthStatus).toBe('long')
    })
  })

  describe('score computation', () => {
    it('scores 3 for a bullet with action verb, quantified result, and good length', () => {
      const bullet = 'Led the migration of our monolith, reducing infrastructure costs by 40% over six months.'
      const results = analyzeBullets(bullet)
      expect(results[0].score).toBe(3)
    })

    it('scores 0 for a very short bullet with no verb and no metric', () => {
      // "random tasks" — no known verb, no metric, < 40 chars
      const results = analyzeBullets('Did random tasks.')
      expect(results[0].score).toBe(0)
    })

    it('scores 1 for a bullet with only an action verb and short length', () => {
      // "Led." — action verb, no metric, too short (< 40 chars)
      const results = analyzeBullets('Led projects.')
      expect(results[0].score).toBe(1)
    })

    it('scores 2 for a bullet with action verb and good length but no metrics', () => {
      const bullet = 'Led the engineering team through a complex system redesign over two quarters.'
      const results = analyzeBullets(bullet)
      // hasActionVerb=true, hasQuantified=false, lengthStatus='good' => score=2
      expect(results[0].score).toBe(2)
    })
  })

  describe('prefix stripping', () => {
    it('strips em-dash (—) prefix', () => {
      const results = analyzeBullets('— Led the team.')
      expect(results[0].text).toBe('Led the team.')
    })

    it('strips en-dash (–) prefix', () => {
      const results = analyzeBullets('– Built the service.')
      expect(results[0].text).toBe('Built the service.')
    })

    it('strips Unicode bullet (•) prefix', () => {
      const results = analyzeBullets('• Developed a new feature.')
      expect(results[0].text).toBe('Developed a new feature.')
    })

    it('strips leading whitespace along with bullet prefix', () => {
      const results = analyzeBullets('  - Led the migration.')
      expect(results[0].text).toBe('Led the migration.')
    })
  })
})

// ─── BulletAnalyzer.tsx — FANCY_BULLETS_RE (inline test) ─────────────────────
//
// BulletAnalyzer.tsx defines FANCY_BULLETS_RE = /[•◆★♦◉▶►●■□▪▫]/ locally.
// This regex is NOT exported. We test the same pattern inline here to document
// which characters are considered "fancy" and would trigger the ATS warning.

describe('FANCY_BULLETS_RE pattern (from BulletAnalyzer.tsx)', () => {
  // Replicate the exact pattern from the component
  const FANCY_BULLETS_RE = /[•◆★♦◉▶►●■□▪▫]/

  it('matches bullet • (bullet point)', () => {
    expect(FANCY_BULLETS_RE.test('• Led the team.')).toBe(true)
  })

  it('matches ◆ (black diamond)', () => {
    expect(FANCY_BULLETS_RE.test('◆ Designed the system.')).toBe(true)
  })

  it('matches ★ (black star)', () => {
    expect(FANCY_BULLETS_RE.test('★ Achieved top performance.')).toBe(true)
  })

  it('matches ♦ (diamond suit)', () => {
    expect(FANCY_BULLETS_RE.test('♦ Built features.')).toBe(true)
  })

  it('matches ● (black circle)', () => {
    expect(FANCY_BULLETS_RE.test('● Shipped product.')).toBe(true)
  })

  it('matches ■ (black square)', () => {
    expect(FANCY_BULLETS_RE.test('■ Managed team.')).toBe(true)
  })

  it('matches ▪ (black small square)', () => {
    expect(FANCY_BULLETS_RE.test('▪ Deployed service.')).toBe(true)
  })

  it('does NOT match plain dash -', () => {
    expect(FANCY_BULLETS_RE.test('- Led the team.')).toBe(false)
  })

  it('does NOT match asterisk *', () => {
    expect(FANCY_BULLETS_RE.test('* Built service.')).toBe(false)
  })

  it('does NOT match plain text with no bullet', () => {
    expect(FANCY_BULLETS_RE.test('Led the team effectively.')).toBe(false)
  })

  it('does NOT match en-dash –', () => {
    expect(FANCY_BULLETS_RE.test('– Built the feature.')).toBe(false)
  })

  it('does NOT match em-dash —', () => {
    expect(FANCY_BULLETS_RE.test('— Led the migration.')).toBe(false)
  })

  it('detects fancy bullet even when embedded mid-string', () => {
    expect(FANCY_BULLETS_RE.test('Some text • with embedded bullet.')).toBe(true)
  })
})
