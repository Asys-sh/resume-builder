import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────
// Hoisted mocks
// ─────────────────────────────────────────────────────────────────

const { mockGetServerUser, mockSanitizeText } = vi.hoisted(() => ({
  mockGetServerUser: vi.fn(),
  mockSanitizeText: vi.fn((v: string | undefined | null) => v ?? ''),
}))

vi.mock('@/lib/auth-helper', () => ({
  getServerUser: mockGetServerUser,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    coverLetter: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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
import { DELETE, GET, PUT } from '../../../app/api/cover-letters/[id]/route'

// ─────────────────────────────────────────────────────────────────
// Shared fixtures
// ─────────────────────────────────────────────────────────────────

const AUTH_USER = { id: 'user1', email: 'test@test.com' }
const OTHER_USER_ID = 'other-user-99'
const COVER_LETTER_ID = 'cl-abc-123'

/** Builds a params object that matches Next.js 15 App Router's Promise<{id}> shape. */
const makeParams = (id: string) => ({ params: Promise.resolve({ id }) })

const makeCoverLetter = (overrides: Record<string, unknown> = {}) => ({
  id: COVER_LETTER_ID,
  userId: AUTH_USER.id,
  title: 'Software Engineer Cover Letter',
  content: 'Dear Hiring Manager...',
  jobTitle: 'Software Engineer',
  companyName: 'Acme Corp',
  jobDescription: 'We are looking for...',
  resumeId: null,
  resume: null,
  status: 'draft',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  ...overrides,
})

const makePutRequest = (body: Record<string, unknown>) =>
  new Request(`http://localhost/api/cover-letters/${COVER_LETTER_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const makeDeleteRequest = () =>
  new Request(`http://localhost/api/cover-letters/${COVER_LETTER_ID}`, {
    method: 'DELETE',
  })

// ─────────────────────────────────────────────────────────────────
// GET /api/cover-letters/[id]
// ─────────────────────────────────────────────────────────────────

describe('GET /api/cover-letters/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSanitizeText.mockImplementation((v: string | undefined | null) => v ?? '')
  })

  it('returns 401 when the user is not authenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)

    const res = await GET(
      new Request(`http://localhost/api/cover-letters/${COVER_LETTER_ID}`),
      makeParams(COVER_LETTER_ID),
    )

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  it('returns 404 when the cover letter does not exist', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce(null)

    const res = await GET(
      new Request(`http://localhost/api/cover-letters/${COVER_LETTER_ID}`),
      makeParams(COVER_LETTER_ID),
    )

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/not found/i)
  })

  it('returns 403 when the cover letter belongs to a different user', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce(
      makeCoverLetter({ userId: OTHER_USER_ID }) as any,
    )

    const res = await GET(
      new Request(`http://localhost/api/cover-letters/${COVER_LETTER_ID}`),
      makeParams(COVER_LETTER_ID),
    )

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  it('returns 200 with the cover letter data for a valid authenticated request', async () => {
    const letter = makeCoverLetter()
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce(letter as any)

    const res = await GET(
      new Request(`http://localhost/api/cover-letters/${COVER_LETTER_ID}`),
      makeParams(COVER_LETTER_ID),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.coverLetter).toBeDefined()
    expect(body.coverLetter.id).toBe(COVER_LETTER_ID)
    expect(body.coverLetter.title).toBe('Software Engineer Cover Letter')
  })

  it('queries by the correct id', async () => {
    const letter = makeCoverLetter()
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce(letter as any)

    await GET(
      new Request(`http://localhost/api/cover-letters/${COVER_LETTER_ID}`),
      makeParams(COVER_LETTER_ID),
    )

    expect(prisma.coverLetter.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: COVER_LETTER_ID } }),
    )
  })

  it('returns 500 when the database throws', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockRejectedValueOnce(new Error('DB error'))

    const res = await GET(
      new Request(`http://localhost/api/cover-letters/${COVER_LETTER_ID}`),
      makeParams(COVER_LETTER_ID),
    )

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/internal server error/i)
  })
})

// ─────────────────────────────────────────────────────────────────
// PUT /api/cover-letters/[id]
// ─────────────────────────────────────────────────────────────────

describe('PUT /api/cover-letters/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSanitizeText.mockImplementation((v: string | undefined | null) => v ?? '')
  })

  // ── Auth ───────────────────────────────────────────────────

  it('returns 401 when the user is not authenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)

    const res = await PUT(makePutRequest({ title: 'Updated Title' }), makeParams(COVER_LETTER_ID))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  // ── Input length validation ────────────────────────────────

  it('returns 400 when title exceeds 200 characters', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)

    const res = await PUT(makePutRequest({ title: 'A'.repeat(201) }), makeParams(COVER_LETTER_ID))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/title too long/i)
  })

  it('returns 400 when content exceeds 50 000 characters', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)

    const res = await PUT(
      makePutRequest({ content: 'A'.repeat(50001) }),
      makeParams(COVER_LETTER_ID),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/content too long/i)
  })

  it('returns 400 when jobDescription exceeds 10 000 characters', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)

    const res = await PUT(
      makePutRequest({ jobDescription: 'A'.repeat(10001) }),
      makeParams(COVER_LETTER_ID),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/job description too long/i)
  })

  // ── Ownership checks ───────────────────────────────────────

  it('returns 404 when the cover letter does not exist', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce(null)

    const res = await PUT(makePutRequest({ title: 'Updated Title' }), makeParams(COVER_LETTER_ID))

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/not found/i)
  })

  it('returns 403 when the cover letter belongs to a different user', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce({
      userId: OTHER_USER_ID,
    } as any)

    const res = await PUT(makePutRequest({ title: 'Updated Title' }), makeParams(COVER_LETTER_ID))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  // ── Successful update ──────────────────────────────────────

  it('returns 200 with the updated cover letter for a valid request', async () => {
    const updated = makeCoverLetter({ title: 'Updated Title' })
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce({
      userId: AUTH_USER.id,
    } as any)
    vi.mocked(prisma.coverLetter.update).mockResolvedValueOnce(updated as any)

    const res = await PUT(makePutRequest({ title: 'Updated Title' }), makeParams(COVER_LETTER_ID))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.coverLetter).toBeDefined()
    expect(body.coverLetter.title).toBe('Updated Title')
  })

  it('updates only the specified fields, leaving others undefined', async () => {
    const updated = makeCoverLetter({ title: 'New Title' })
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce({
      userId: AUTH_USER.id,
    } as any)
    vi.mocked(prisma.coverLetter.update).mockResolvedValueOnce(updated as any)

    await PUT(makePutRequest({ title: 'New Title' }), makeParams(COVER_LETTER_ID))

    const updateCall = vi.mocked(prisma.coverLetter.update).mock.calls[0][0]
    expect(updateCall.data.title).toBe('New Title')
    // Fields not supplied should remain undefined (not overwrite existing data)
    expect(updateCall.data.content).toBeUndefined()
    expect(updateCall.data.jobTitle).toBeUndefined()
  })

  it('updates status without sanitization', async () => {
    const updated = makeCoverLetter({ status: 'sent' })
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce({
      userId: AUTH_USER.id,
    } as any)
    vi.mocked(prisma.coverLetter.update).mockResolvedValueOnce(updated as any)

    await PUT(makePutRequest({ status: 'sent' }), makeParams(COVER_LETTER_ID))

    const updateCall = vi.mocked(prisma.coverLetter.update).mock.calls[0][0]
    expect(updateCall.data.status).toBe('sent')
  })

  // ── Sanitization ───────────────────────────────────────────

  it('passes updated content through sanitizeText before persisting', async () => {
    const updated = makeCoverLetter({ content: 'Clean content' })
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce({
      userId: AUTH_USER.id,
    } as any)
    mockSanitizeText.mockImplementation((v: string | undefined | null) => {
      if (v === '<img src=x onerror=alert(1)>Clean content') return 'Clean content'
      return v ?? ''
    })
    vi.mocked(prisma.coverLetter.update).mockResolvedValueOnce(updated as any)

    await PUT(
      makePutRequest({ content: '<img src=x onerror=alert(1)>Clean content' }),
      makeParams(COVER_LETTER_ID),
    )

    expect(mockSanitizeText).toHaveBeenCalledWith('<img src=x onerror=alert(1)>Clean content')
    const updateCall = vi.mocked(prisma.coverLetter.update).mock.calls[0][0]
    expect(updateCall.data.content).toBe('Clean content')
  })

  it('passes updated title through sanitizeText before persisting', async () => {
    const updated = makeCoverLetter({ title: 'Clean Title' })
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce({
      userId: AUTH_USER.id,
    } as any)
    mockSanitizeText.mockImplementation((v: string | undefined | null) => {
      if (v === '<b>Clean Title</b>') return 'Clean Title'
      return v ?? ''
    })
    vi.mocked(prisma.coverLetter.update).mockResolvedValueOnce(updated as any)

    await PUT(makePutRequest({ title: '<b>Clean Title</b>' }), makeParams(COVER_LETTER_ID))

    expect(mockSanitizeText).toHaveBeenCalledWith('<b>Clean Title</b>')
    const updateCall = vi.mocked(prisma.coverLetter.update).mock.calls[0][0]
    expect(updateCall.data.title).toBe('Clean Title')
  })

  it('passes updated jobDescription through sanitizeText before persisting', async () => {
    const updated = makeCoverLetter({ jobDescription: 'We need a developer' })
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce({
      userId: AUTH_USER.id,
    } as any)
    mockSanitizeText.mockImplementation((v: string | undefined | null) => {
      if (v === 'javascript:alert(1) We need a developer') return 'We need a developer'
      return v ?? ''
    })
    vi.mocked(prisma.coverLetter.update).mockResolvedValueOnce(updated as any)

    await PUT(
      makePutRequest({ jobDescription: 'javascript:alert(1) We need a developer' }),
      makeParams(COVER_LETTER_ID),
    )

    expect(mockSanitizeText).toHaveBeenCalledWith('javascript:alert(1) We need a developer')
    const updateCall = vi.mocked(prisma.coverLetter.update).mock.calls[0][0]
    expect(updateCall.data.jobDescription).toBe('We need a developer')
  })

  // ── Error handling ─────────────────────────────────────────

  it('returns 500 when the database throws during update', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce({
      userId: AUTH_USER.id,
    } as any)
    vi.mocked(prisma.coverLetter.update).mockRejectedValueOnce(new Error('DB error'))

    const res = await PUT(makePutRequest({ title: 'Updated Title' }), makeParams(COVER_LETTER_ID))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/internal server error/i)
  })
})

// ─────────────────────────────────────────────────────────────────
// DELETE /api/cover-letters/[id]
// ─────────────────────────────────────────────────────────────────

describe('DELETE /api/cover-letters/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when the user is not authenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)

    const res = await DELETE(makeDeleteRequest(), makeParams(COVER_LETTER_ID))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  it('returns 404 when the cover letter does not exist', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce(null)

    const res = await DELETE(makeDeleteRequest(), makeParams(COVER_LETTER_ID))

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/not found/i)
  })

  it('returns 403 when the cover letter belongs to a different user', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce({
      userId: OTHER_USER_ID,
    } as any)

    const res = await DELETE(makeDeleteRequest(), makeParams(COVER_LETTER_ID))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  it('returns 200 with success:true after a valid deletion', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce({
      userId: AUTH_USER.id,
    } as any)
    vi.mocked(prisma.coverLetter.delete).mockResolvedValueOnce({} as any)

    const res = await DELETE(makeDeleteRequest(), makeParams(COVER_LETTER_ID))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('deletes the record with the correct id', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce({
      userId: AUTH_USER.id,
    } as any)
    vi.mocked(prisma.coverLetter.delete).mockResolvedValueOnce({} as any)

    await DELETE(makeDeleteRequest(), makeParams(COVER_LETTER_ID))

    expect(prisma.coverLetter.delete).toHaveBeenCalledWith({
      where: { id: COVER_LETTER_ID },
    })
  })

  it('does not call delete when the ownership check fails', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce({
      userId: OTHER_USER_ID,
    } as any)

    await DELETE(makeDeleteRequest(), makeParams(COVER_LETTER_ID))

    expect(prisma.coverLetter.delete).not.toHaveBeenCalled()
  })

  it('returns 500 when the database throws during deletion', async () => {
    mockGetServerUser.mockResolvedValueOnce(AUTH_USER)
    vi.mocked(prisma.coverLetter.findUnique).mockResolvedValueOnce({
      userId: AUTH_USER.id,
    } as any)
    vi.mocked(prisma.coverLetter.delete).mockRejectedValueOnce(new Error('DB error'))

    const res = await DELETE(makeDeleteRequest(), makeParams(COVER_LETTER_ID))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/internal server error/i)
  })
})
