import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────
// Hoisted mocks
// ─────────────────────────────────────────────────────────────────

const { mockGetServerUser } = vi.hoisted(() => ({
  mockGetServerUser: vi.fn(),
}))

vi.mock('@/lib/auth-helper', () => ({
  getServerUser: mockGetServerUser,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    resume: {
      findUnique: vi.fn(),
    },
    resumeView: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { GET } from '../../../app/api/resumes/[id]/analytics/route'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const AUTHED_USER = { id: 'user-1', email: 'test@test.com' }
const RESUME = { id: 'resume-1', userId: 'user-1', title: 'My Resume' }

function makeRequest(id: string, params: Record<string, string> = {}) {
  const url = new URL(`http://localhost/api/resumes/${id}/analytics`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString(), { method: 'GET' })
}

/** Build fake ResumeView rows with viewedAt N days ago */
function makeViews(daysAgoAndCounts: Array<[number, number]>): Array<{ viewedAt: Date }> {
  const rows: Array<{ viewedAt: Date }> = []
  for (const [daysAgo, count] of daysAgoAndCounts) {
    for (let i = 0; i < count; i++) {
      const d = new Date()
      d.setDate(d.getDate() - daysAgo)
      rows.push({ viewedAt: d })
    }
  }
  return rows
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('GET /api/resumes/[id]/analytics', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetServerUser.mockResolvedValue(AUTHED_USER)
    vi.mocked(prisma.resume.findUnique).mockResolvedValue(RESUME as any)
    vi.mocked(prisma.resumeView.findMany).mockResolvedValue([])
  })

  // ── Authentication ───────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    mockGetServerUser.mockResolvedValue(null)
    const res = await GET(makeRequest('resume-1'), { params: Promise.resolve({ id: 'resume-1' }) })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  // ── Validation ───────────────────────────────────────────────

  it('returns 400 for ?days=67', async () => {
    const res = await GET(makeRequest('resume-1', { days: '67' }), { params: Promise.resolve({ id: 'resume-1' }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid range. Allowed values: 30, 60, 90')
  })

  it('returns 400 for ?days=3000000', async () => {
    const res = await GET(makeRequest('resume-1', { days: '3000000' }), { params: Promise.resolve({ id: 'resume-1' }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid range. Allowed values: 30, 60, 90')
  })

  it('returns 400 for ?days=abc', async () => {
    const res = await GET(makeRequest('resume-1', { days: 'abc' }), { params: Promise.resolve({ id: 'resume-1' }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid range. Allowed values: 30, 60, 90')
  })

  // ── Valid days values ─────────────────────────────────────────

  it('returns 200 for ?days=30', async () => {
    const res = await GET(makeRequest('resume-1', { days: '30' }), { params: Promise.resolve({ id: 'resume-1' }) })
    expect(res.status).toBe(200)
  })

  it('returns 200 for ?days=60', async () => {
    const res = await GET(makeRequest('resume-1', { days: '60' }), { params: Promise.resolve({ id: 'resume-1' }) })
    expect(res.status).toBe(200)
  })

  it('returns 200 for ?days=90', async () => {
    const res = await GET(makeRequest('resume-1', { days: '90' }), { params: Promise.resolve({ id: 'resume-1' }) })
    expect(res.status).toBe(200)
  })

  // ── Ownership ────────────────────────────────────────────────

  it('returns 404 when resume not found or wrong owner', async () => {
    vi.mocked(prisma.resume.findUnique).mockResolvedValue(null)
    const res = await GET(makeRequest('resume-1'), { params: Promise.resolve({ id: 'resume-1' }) })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/not found/i)
  })

  // ── Response shape ───────────────────────────────────────────

  it('returns 200 with { total, peak, trend, daily } shape', async () => {
    const res = await GET(makeRequest('resume-1', { days: '30' }), { params: Promise.resolve({ id: 'resume-1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      total: expect.any(Number),
      peak: expect.objectContaining({ date: expect.any(String), count: expect.any(Number) }),
      trend: expect.stringMatching(/^(up|down|flat)$/),
      daily: expect.any(Array),
    })
  })

  // ── Daily array completeness ──────────────────────────────────

  it('daily array contains an entry for every day in the range (zero-filled)', async () => {
    const res = await GET(makeRequest('resume-1', { days: '30' }), { params: Promise.resolve({ id: 'resume-1' }) })
    const body = await res.json()
    // days=30: 31 entries (today inclusive)
    expect(body.daily).toHaveLength(31)
    for (const entry of body.daily) {
      expect(entry).toMatchObject({ date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), count: expect.any(Number) })
    }
  })

  // ── Trend calculation ─────────────────────────────────────────

  it('trend is "up" when last 7 days sum > prev 7 days sum', async () => {
    // 5 views today (within last 7 days), 1 view 10 days ago (in prev 7)
    const views = [...makeViews([[0, 5]]), ...makeViews([[10, 1]])]
    vi.mocked(prisma.resumeView.findMany).mockResolvedValue(views as any)

    const res = await GET(makeRequest('resume-1', { days: '30' }), { params: Promise.resolve({ id: 'resume-1' }) })
    const body = await res.json()
    expect(body.trend).toBe('up')
  })

  it('trend is "down" when last 7 days sum < prev 7 days sum', async () => {
    // 1 view today (within last 7 days), 5 views 10 days ago (in prev 7)
    const views = [...makeViews([[0, 1]]), ...makeViews([[10, 5]])]
    vi.mocked(prisma.resumeView.findMany).mockResolvedValue(views as any)

    const res = await GET(makeRequest('resume-1', { days: '30' }), { params: Promise.resolve({ id: 'resume-1' }) })
    const body = await res.json()
    expect(body.trend).toBe('down')
  })

  it('trend is "flat" when last 7 days sum equals prev 7 days sum', async () => {
    // 3 views today and 3 views 10 days ago
    const views = [...makeViews([[0, 3]]), ...makeViews([[10, 3]])]
    vi.mocked(prisma.resumeView.findMany).mockResolvedValue(views as any)

    const res = await GET(makeRequest('resume-1', { days: '30' }), { params: Promise.resolve({ id: 'resume-1' }) })
    const body = await res.json()
    expect(body.trend).toBe('flat')
  })

  // ── Default days ──────────────────────────────────────────────

  it('defaults to days=30 when param is absent', async () => {
    const res = await GET(makeRequest('resume-1'), { params: Promise.resolve({ id: 'resume-1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    // 31 entries = 30 days range + today
    expect(body.daily).toHaveLength(31)
  })
})
