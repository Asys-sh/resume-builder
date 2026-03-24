import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────
// Hoisted mocks — must be declared before vi.mock() calls and
// before the module imports they control
// ─────────────────────────────────────────────────────────────────

const { mockGetServerUser } = vi.hoisted(() => ({
  mockGetServerUser: vi.fn(),
}))

vi.mock('@/lib/auth-helper', () => ({
  getServerUser: mockGetServerUser,
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => null),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    resume: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { prisma } from '@/lib/prisma'
// Import route handlers after mocks are registered
import { DELETE, GET, POST } from '../../../app/api/resumes/route'

// ─────────────────────────────────────────────────────────────────
// Shared test fixtures
// ─────────────────────────────────────────────────────────────────

const AUTHED_USER = { id: 'user-1', email: 'test@test.com' }

/** Minimal valid ResumeData payload the POST handler accepts */
const makeResumeData = (overrides: Record<string, unknown> = {}) => ({
  contactInfo: {
    fullName: 'Jane Doe',
    headline: 'Software Engineer',
    email: 'jane@example.com',
    phone: '555-0100',
    address: '123 Main St',
    linkedin: 'https://linkedin.com/in/janedoe',
    website: 'https://janedoe.dev',
  },
  summary: 'Experienced engineer.',
  experiences: [],
  skills: [],
  education: [],
  projects: [],
  certifications: [],
  languages: [],
  selectedTemplate: 'modern',
  ...overrides,
})

/** A resume row as Prisma would return it from findMany (list fields only) */
const makeResumeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'resume-1',
  title: 'My Resume',
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  template: 'modern',
  contactInfo: { fullName: 'Jane Doe' },
  ...overrides,
})

/** Full resume row as Prisma would return it from findUnique */
const makeFullResumeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'resume-1',
  userId: 'user-1',
  title: 'My Resume',
  summary: 'Experienced engineer.',
  contactInfo: { fullName: 'Jane Doe' },
  template: 'modern',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
})

// ─────────────────────────────────────────────────────────────────
// Request factory helpers
// ─────────────────────────────────────────────────────────────────

const makeGetRequest = (params: Record<string, string> = {}) => {
  const url = new URL('http://localhost/api/resumes')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new NextRequest(url.toString(), { method: 'GET' })
}

const makePostRequest = (body: Record<string, unknown>) =>
  new NextRequest('http://localhost/api/resumes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const makeDeleteRequest = (params: Record<string, string> = {}) => {
  const url = new URL('http://localhost/api/resumes')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new NextRequest(url.toString(), { method: 'DELETE' })
}

// ─────────────────────────────────────────────────────────────────
// Helpers that mock the $transaction call so syncRelated works
// ─────────────────────────────────────────────────────────────────

/**
 * Sets up prisma.$transaction to execute the callback with a tx object
 * whose sub-models all return empty arrays / no-ops by default.
 */
const setupTransactionMock = () => {
  vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
    const makeTxModel = () => ({
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      create: vi.fn().mockResolvedValue({}),
    })
    const tx = {
      experience: makeTxModel(),
      education: makeTxModel(),
      skill: makeTxModel(),
      project: makeTxModel(),
      certification: makeTxModel(),
      language: makeTxModel(),
    }
    return fn(tx)
  })
}

// ─────────────────────────────────────────────────────────────────
// GET /api/resumes — list mode (no resumeId)
// ─────────────────────────────────────────────────────────────────

describe('GET /api/resumes — list mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  it('returns paginated list with resumes, total and hasMore', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    const rows = [makeResumeRow(), makeResumeRow({ id: 'resume-2', title: 'Second Resume' })]
    vi.mocked(prisma.resume.findMany).mockResolvedValueOnce(rows as any)
    vi.mocked(prisma.resume.count).mockResolvedValueOnce(2)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      resumes: expect.arrayContaining([
        expect.objectContaining({ id: 'resume-1' }),
        expect.objectContaining({ id: 'resume-2' }),
      ]),
      total: 2,
      hasMore: false,
    })
  })

  it('sets hasMore to true when more pages exist beyond the current page', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    // Return 12 rows (a full page), but total is 25
    const rows = Array.from({ length: 12 }, (_, i) => makeResumeRow({ id: `resume-${i}` }))
    vi.mocked(prisma.resume.findMany).mockResolvedValueOnce(rows as any)
    vi.mocked(prisma.resume.count).mockResolvedValueOnce(25)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.hasMore).toBe(true)
    expect(body.total).toBe(25)
  })

  it('sets hasMore to false when all items fit on the first page', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    const rows = [makeResumeRow()]
    vi.mocked(prisma.resume.findMany).mockResolvedValueOnce(rows as any)
    vi.mocked(prisma.resume.count).mockResolvedValueOnce(1)

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.hasMore).toBe(false)
  })

  it('applies skip correctly for page 2', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.findMany).mockResolvedValueOnce([] as any)
    vi.mocked(prisma.resume.count).mockResolvedValueOnce(15)

    await GET(makeGetRequest({ page: '2' }))

    expect(prisma.resume.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 12, take: 12 }),
    )
  })

  it('clamps invalid page values to page 1', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.findMany).mockResolvedValueOnce([] as any)
    vi.mocked(prisma.resume.count).mockResolvedValueOnce(0)

    await GET(makeGetRequest({ page: '-5' }))

    expect(prisma.resume.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }))
  })

  it('returns 500 when prisma throws during list fetch', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.findMany).mockRejectedValueOnce(new Error('DB error'))

    const res = await GET(makeGetRequest())

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/internal server error/i)
  })
})

// ─────────────────────────────────────────────────────────────────
// GET /api/resumes?resumeId=… — single resume mode
// ─────────────────────────────────────────────────────────────────

describe('GET /api/resumes — single resume mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)

    const res = await GET(makeGetRequest({ resumeId: 'resume-1' }))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  it('returns 404 when resume does not exist', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce(null)

    const res = await GET(makeGetRequest({ resumeId: 'nonexistent' }))

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/not found/i)
  })

  it('returns 404 when resume belongs to a different user', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    // Prisma's WHERE clause includes userId, so if it belongs to another user
    // the query returns null — matching real DB behaviour
    vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce(null)

    const res = await GET(makeGetRequest({ resumeId: 'resume-other' }))

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/not found/i)
  })

  it('queries with both id and userId to prevent cross-user access', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce(makeFullResumeRow() as any)

    await GET(makeGetRequest({ resumeId: 'resume-1' }))

    expect(prisma.resume.findUnique).toHaveBeenCalledWith({
      where: { id: 'resume-1', userId: AUTHED_USER.id },
    })
  })

  it('returns 200 with the full resume on a valid request', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    const row = makeFullResumeRow()
    vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce(row as any)

    const res = await GET(makeGetRequest({ resumeId: 'resume-1' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      id: 'resume-1',
      title: 'My Resume',
      summary: 'Experienced engineer.',
    })
  })

  it('returns 500 when prisma throws during single resume fetch', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.findUnique).mockRejectedValueOnce(new Error('DB error'))

    const res = await GET(makeGetRequest({ resumeId: 'resume-1' }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/internal server error/i)
  })
})

// ─────────────────────────────────────────────────────────────────
// POST /api/resumes — create and update
// ─────────────────────────────────────────────────────────────────

describe('POST /api/resumes — create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)

    const res = await POST(makePostRequest({ data: makeResumeData() }))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  it('returns 400 when resume data is missing from the body', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)

    const res = await POST(makePostRequest({ title: 'No data field' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/validation error/i)
  })

  it('returns 400 when the title exceeds 200 characters', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)

    const res = await POST(
      makePostRequest({
        data: makeResumeData(),
        title: 'a'.repeat(201),
      }),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/title too long/i)
  })

  it('returns 400 when the summary exceeds 5000 characters', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)

    const res = await POST(
      makePostRequest({
        data: makeResumeData({ summary: 's'.repeat(5001) }),
      }),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/summary too long/i)
  })

  it('creates a new resume and returns success with the new resumeId', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    const created = makeFullResumeRow({ id: 'new-resume-id' })
    vi.mocked(prisma.resume.create).mockResolvedValueOnce(created as any)
    setupTransactionMock()

    const res = await POST(makePostRequest({ data: makeResumeData(), title: 'My New Resume' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ success: true, resumeId: 'new-resume-id' })
  })

  it('uses contactInfo.fullName as title when no title is provided', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.create).mockResolvedValueOnce(makeFullResumeRow() as any)
    setupTransactionMock()

    await POST(makePostRequest({ data: makeResumeData() }))

    expect(prisma.resume.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Jane Doe',
        }),
      }),
    )
  })

  it('falls back to "Untitled Resume" when fullName is empty', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.create).mockResolvedValueOnce(makeFullResumeRow() as any)
    setupTransactionMock()

    const data = makeResumeData({
      contactInfo: {
        fullName: '',
        headline: '',
        email: '',
        phone: '',
        address: '',
        linkedin: '',
        website: '',
      },
    })
    await POST(makePostRequest({ data }))

    expect(prisma.resume.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Untitled Resume',
        }),
      }),
    )
  })

  it('connects the new resume to the authenticated user', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.create).mockResolvedValueOnce(makeFullResumeRow() as any)
    setupTransactionMock()

    await POST(makePostRequest({ data: makeResumeData(), title: 'Test' }))

    expect(prisma.resume.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          user: { connect: { id: AUTHED_USER.id } },
        }),
      }),
    )
  })

  it('returns 500 when prisma.resume.create throws', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.create).mockRejectedValueOnce(new Error('DB error'))

    const res = await POST(makePostRequest({ data: makeResumeData(), title: 'Test' }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/internal server error/i)
  })
})

describe('POST /api/resumes — update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates an existing resume when resumeId is provided', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    const updated = makeFullResumeRow({ id: 'resume-1', title: 'Updated Title' })
    vi.mocked(prisma.resume.update).mockResolvedValueOnce(updated as any)
    setupTransactionMock()

    const res = await POST(
      makePostRequest({
        resumeId: 'resume-1',
        data: makeResumeData(),
        title: 'Updated Title',
      }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ success: true, resumeId: 'resume-1' })
  })

  it('does not call prisma.resume.create when a resumeId is present', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.update).mockResolvedValueOnce(makeFullResumeRow() as any)
    setupTransactionMock()

    await POST(makePostRequest({ resumeId: 'resume-1', data: makeResumeData() }))

    expect(prisma.resume.create).not.toHaveBeenCalled()
    expect(prisma.resume.update).toHaveBeenCalledTimes(1)
  })

  it('scopes the update WHERE clause to both id and userId', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.update).mockResolvedValueOnce(makeFullResumeRow() as any)
    setupTransactionMock()

    await POST(
      makePostRequest({ resumeId: 'resume-1', data: makeResumeData(), title: 'New Title' }),
    )

    expect(prisma.resume.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'resume-1', userId: AUTHED_USER.id },
      }),
    )
  })

  it('returns 500 when updating a resume that belongs to a different user (Prisma throws)', async () => {
    // Prisma throws P2025 (record not found) when the WHERE clause finds no row.
    // The route catches all errors and returns 500.
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.update).mockRejectedValueOnce(
      Object.assign(new Error('Record to update not found'), { code: 'P2025' }),
    )

    const res = await POST(
      makePostRequest({ resumeId: 'resume-belongs-to-other', data: makeResumeData() }),
    )

    expect(res.status).toBe(500)
  })

  it('persists the correct fields on update', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.update).mockResolvedValueOnce(makeFullResumeRow() as any)
    setupTransactionMock()

    await POST(
      makePostRequest({
        resumeId: 'resume-1',
        data: makeResumeData({ summary: 'Updated summary', selectedTemplate: 'classic' }),
        title: 'New Title',
      }),
    )

    expect(prisma.resume.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'New Title',
          summary: 'Updated summary',
          template: 'classic',
        }),
      }),
    )
  })
})

// ─────────────────────────────────────────────────────────────────
// DELETE /api/resumes?resumeId=…
// ─────────────────────────────────────────────────────────────────

describe('DELETE /api/resumes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)

    const res = await DELETE(makeDeleteRequest({ resumeId: 'resume-1' }))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  it('returns 400 when resumeId query parameter is missing', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)

    const res = await DELETE(makeDeleteRequest())

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/missing resume id/i)
  })

  it('returns 404 when resume does not exist or belongs to another user', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce(null)

    const res = await DELETE(makeDeleteRequest({ resumeId: 'nonexistent' }))

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/not found/i)
  })

  it('deletes the resume and returns success when the owner requests deletion', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce({ id: 'resume-1' } as any)
    vi.mocked(prisma.resume.delete).mockResolvedValueOnce(makeFullResumeRow() as any)

    const res = await DELETE(makeDeleteRequest({ resumeId: 'resume-1' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ success: true })
  })

  it('calls findUnique with both id and userId before deleting', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce({ id: 'resume-1' } as any)
    vi.mocked(prisma.resume.delete).mockResolvedValueOnce(makeFullResumeRow() as any)

    await DELETE(makeDeleteRequest({ resumeId: 'resume-1' }))

    expect(prisma.resume.findUnique).toHaveBeenCalledWith({
      where: { id: 'resume-1', userId: AUTHED_USER.id },
      select: { id: true },
    })
  })

  it('does not call prisma.resume.delete when the ownership check fails', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce(null)

    await DELETE(makeDeleteRequest({ resumeId: 'resume-1' }))

    expect(prisma.resume.delete).not.toHaveBeenCalled()
  })

  it('returns 500 when prisma.resume.delete throws', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTHED_USER)
    vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce({ id: 'resume-1' } as any)
    vi.mocked(prisma.resume.delete).mockRejectedValueOnce(new Error('DB error'))

    const res = await DELETE(makeDeleteRequest({ resumeId: 'resume-1' }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/internal server error/i)
  })
})
