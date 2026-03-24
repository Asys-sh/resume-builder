import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────
// Hoisted mocks — must be available inside vi.mock factory
// functions, which are hoisted above all imports by Vitest
// ─────────────────────────────────────────────────────────────────

const { mockGetServerUser, mockSanitizeText } = vi.hoisted(() => ({
  mockGetServerUser: vi.fn(),
  mockSanitizeText: vi.fn((v: string | undefined | null) => v ?? ''),
}))

vi.mock('@/lib/auth-helper', () => ({
  getServerUser: mockGetServerUser,
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => null),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    coverLetter: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    resume: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/sanitize', () => ({
  sanitizeText: mockSanitizeText,
}))

// ─────────────────────────────────────────────────────────────────
// Imports after mocks
// ─────────────────────────────────────────────────────────────────

import { prisma } from '@/lib/prisma'
import { GET, POST } from '../../../app/api/cover-letters/route'

// ─────────────────────────────────────────────────────────────────
// Shared fixtures
// ─────────────────────────────────────────────────────────────────

const AUTH_USER = { id: 'user1', email: 'test@test.com' }

const makeCoverLetter = (overrides: Record<string, unknown> = {}) => ({
  id: 'cl-1',
  userId: 'user1',
  title: 'Software Engineer Cover Letter',
  content: 'Dear Hiring Manager...',
  jobTitle: 'Software Engineer',
  companyName: 'Acme Corp',
  jobDescription: 'We are looking for...',
  resumeId: null,
  status: 'draft',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  ...overrides,
})

const makePostRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/cover-letters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

// ─────────────────────────────────────────────────────────────────
// GET /api/cover-letters
// ─────────────────────────────────────────────────────────────────

describe('GET /api/cover-letters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Pass-through sanitization by default so input == output
    mockSanitizeText.mockImplementation((v: string | undefined | null) => v ?? '')
  })

  it('returns 401 when the user is not authenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)

    const res = await GET()

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  it("returns the authenticated user's cover letters", async () => {
    const letters = [
      makeCoverLetter({ id: 'cl-1' }),
      makeCoverLetter({ id: 'cl-2', title: 'Marketing Cover Letter' }),
    ]
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findMany).mockResolvedValueOnce(letters as any)

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.coverLetters).toHaveLength(2)
    expect(body.coverLetters[0].id).toBe('cl-1')
    expect(body.coverLetters[1].id).toBe('cl-2')
  })

  it("queries only the authenticated user's records", async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findMany).mockResolvedValueOnce([])

    await GET()

    expect(prisma.coverLetter.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: AUTH_USER.id },
      }),
    )
  })

  it('returns an empty array when the user has no cover letters', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findMany).mockResolvedValueOnce([])

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.coverLetters).toEqual([])
  })

  it('returns 500 when the database throws', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findMany).mockRejectedValueOnce(new Error('DB error'))

    const res = await GET()

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/internal server error/i)
  })
})

// ─────────────────────────────────────────────────────────────────
// POST /api/cover-letters
// ─────────────────────────────────────────────────────────────────

describe('POST /api/cover-letters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSanitizeText.mockImplementation((v: string | undefined | null) => v ?? '')
  })

  // ── Auth ───────────────────────────────────────────────────

  it('returns 401 when the user is not authenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)

    const res = await POST(makePostRequest({ title: 'My Letter', content: 'Hello...' }))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  // ── Input length validation ────────────────────────────────

  it('returns 400 when title exceeds 200 characters', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)

    const res = await POST(makePostRequest({ title: 'A'.repeat(201), content: 'Hello' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/title too long/i)
  })

  it('returns 400 when content exceeds 50 000 characters', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)

    const res = await POST(makePostRequest({ title: 'My Letter', content: 'A'.repeat(50001) }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/content too long/i)
  })

  it('returns 400 when jobDescription exceeds 10 000 characters', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)

    const res = await POST(
      makePostRequest({
        title: 'My Letter',
        content: 'Hello',
        jobDescription: 'A'.repeat(10001),
      }),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/job description too long/i)
  })

  // ── Resume ownership check ─────────────────────────────────

  it('returns 404 when the specified resumeId does not belong to the user', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce(null)

    const res = await POST(
      makePostRequest({ title: 'My Letter', content: 'Hello', resumeId: 'resume-other' }),
    )

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/resume not found/i)
  })

  it('creates the cover letter when the resumeId belongs to the user', async () => {
    const created = makeCoverLetter({ resumeId: 'resume-1' })
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce({ id: 'resume-1' } as any)
    vi.mocked(prisma.coverLetter.create).mockResolvedValueOnce(created as any)

    const res = await POST(
      makePostRequest({
        title: 'My Letter',
        content: 'Hello',
        resumeId: 'resume-1',
      }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.coverLetter.resumeId).toBe('resume-1')
  })

  // ── Successful creation ────────────────────────────────────

  it('creates and returns the cover letter for a valid request', async () => {
    const created = makeCoverLetter()
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.create).mockResolvedValueOnce(created as any)

    const res = await POST(
      makePostRequest({
        title: 'Software Engineer Cover Letter',
        content: 'Dear Hiring Manager...',
        jobTitle: 'Software Engineer',
        companyName: 'Acme Corp',
      }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.coverLetter).toBeDefined()
    expect(body.coverLetter.id).toBe('cl-1')
    expect(body.coverLetter.title).toBe('Software Engineer Cover Letter')
  })

  it('associates the cover letter with the authenticated user', async () => {
    const created = makeCoverLetter()
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.create).mockResolvedValueOnce(created as any)

    await POST(makePostRequest({ title: 'My Letter', content: 'Hello' }))

    expect(prisma.coverLetter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: AUTH_USER.id }),
      }),
    )
  })

  it('falls back to "Untitled Cover Letter" when no title is supplied', async () => {
    const created = makeCoverLetter({ title: 'Untitled Cover Letter' })
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.create).mockResolvedValueOnce(created as any)

    await POST(makePostRequest({ content: 'Hello' }))

    expect(prisma.coverLetter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: 'Untitled Cover Letter' }),
      }),
    )
  })

  it('defaults status to "draft" when no status is provided', async () => {
    const created = makeCoverLetter()
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.create).mockResolvedValueOnce(created as any)

    await POST(makePostRequest({ title: 'My Letter', content: 'Hello' }))

    expect(prisma.coverLetter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'draft' }),
      }),
    )
  })

  it('uses the provided status when one is supplied', async () => {
    const created = makeCoverLetter({ status: 'sent' })
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.create).mockResolvedValueOnce(created as any)

    await POST(makePostRequest({ title: 'My Letter', content: 'Hello', status: 'sent' }))

    expect(prisma.coverLetter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'sent' }),
      }),
    )
  })

  // ── Sanitization ───────────────────────────────────────────

  it('passes title through sanitizeText before persisting', async () => {
    const created = makeCoverLetter({ title: 'Clean Title' })
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    mockSanitizeText.mockImplementation((v: string | undefined | null) => {
      if (v === '<b>Dirty Title</b>') return 'Dirty Title'
      return v ?? ''
    })
    vi.mocked(prisma.coverLetter.create).mockResolvedValueOnce(created as any)

    await POST(makePostRequest({ title: '<b>Dirty Title</b>', content: 'Hello' }))

    expect(mockSanitizeText).toHaveBeenCalledWith('<b>Dirty Title</b>')
    const createCall = vi.mocked(prisma.coverLetter.create).mock.calls[0][0]
    expect(createCall.data.title).toBe('Dirty Title')
  })

  it('passes content through sanitizeText before persisting', async () => {
    const created = makeCoverLetter({ content: 'Dear Hiring Manager' })
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    mockSanitizeText.mockImplementation((v: string | undefined | null) => {
      if (v === '<script>alert(1)</script>Dear Hiring Manager') return 'Dear Hiring Manager'
      return v ?? ''
    })
    vi.mocked(prisma.coverLetter.create).mockResolvedValueOnce(created as any)

    await POST(
      makePostRequest({
        title: 'My Letter',
        content: '<script>alert(1)</script>Dear Hiring Manager',
      }),
    )

    expect(mockSanitizeText).toHaveBeenCalledWith('<script>alert(1)</script>Dear Hiring Manager')
    const createCall = vi.mocked(prisma.coverLetter.create).mock.calls[0][0]
    expect(createCall.data.content).toBe('Dear Hiring Manager')
  })

  it('passes companyName through sanitizeText before persisting', async () => {
    const created = makeCoverLetter({ companyName: 'Acme Corp' })
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    mockSanitizeText.mockImplementation((v: string | undefined | null) => {
      if (v === '<em>Acme Corp</em>') return 'Acme Corp'
      return v ?? ''
    })
    vi.mocked(prisma.coverLetter.create).mockResolvedValueOnce(created as any)

    await POST(
      makePostRequest({
        title: 'My Letter',
        content: 'Hello',
        companyName: '<em>Acme Corp</em>',
      }),
    )

    expect(mockSanitizeText).toHaveBeenCalledWith('<em>Acme Corp</em>')
    const createCall = vi.mocked(prisma.coverLetter.create).mock.calls[0][0]
    expect(createCall.data.companyName).toBe('Acme Corp')
  })

  // ── Error handling ─────────────────────────────────────────

  it('returns 500 when the database throws during creation', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.create).mockRejectedValueOnce(new Error('DB error'))

    const res = await POST(makePostRequest({ title: 'My Letter', content: 'Hello' }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/internal server error/i)
  })
})
