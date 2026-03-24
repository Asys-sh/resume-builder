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

vi.mock('@/lib/sanitize', () => ({
  sanitizeText: vi.fn((s: string) => s),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => null),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    resume: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    experience: { create: vi.fn() },
    skill:       { create: vi.fn() },
    education:   { create: vi.fn() },
    project:     { create: vi.fn() },
    certification: { create: vi.fn() },
    language:    { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { prisma } from '@/lib/prisma'
import { POST } from '../../../app/api/resumes/duplicate/route'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const AUTHED_USER = { id: 'user-1' }

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/resumes/duplicate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const BASE_RESUME = {
  id: 'resume-1',
  userId: 'user-1',
  title: 'My Resume',
  summary: 'A great engineer.',
  contactInfo: { fullName: 'Jane Doe' },
  template: 'modern',
  parentResumeId: null,
  experiences: [],
  skills: [],
  education: [],
  projects: [],
  certifications: [],
  languages: [],
}

const CREATED_RESUME = { id: 'resume-2' }

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('POST /api/resumes/duplicate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerUser.mockResolvedValue(AUTHED_USER)
    vi.mocked(prisma.resume.findUnique).mockResolvedValue(BASE_RESUME as any)
    // $transaction executes the callback and returns the result
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => cb(prisma))
    vi.mocked(prisma.resume.create).mockResolvedValue(CREATED_RESUME as any)
  })

  // ── Authentication ───────────────────────────────────────────

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetServerUser.mockResolvedValueOnce(null)
      const res = await POST(makeRequest({ resumeId: 'resume-1' }))
      expect(res.status).toBe(401)
    })

    it('does not touch prisma when unauthorized', async () => {
      mockGetServerUser.mockResolvedValueOnce(null)
      await POST(makeRequest({ resumeId: 'resume-1' }))
      expect(prisma.resume.findUnique).not.toHaveBeenCalled()
    })
  })

  // ── Validation ───────────────────────────────────────────────

  describe('validation', () => {
    it('returns 400 when resumeId is missing', async () => {
      const res = await POST(makeRequest({}))
      expect(res.status).toBe(400)
    })

    it('returns 400 when tailoredFor exceeds 200 characters', async () => {
      const res = await POST(makeRequest({ resumeId: 'resume-1', tailoredFor: 'x'.repeat(201) }))
      expect(res.status).toBe(400)
    })
  })

  // ── Ownership ────────────────────────────────────────────────

  describe('ownership', () => {
    it('returns 404 when resume does not belong to the user', async () => {
      vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce(null)
      const res = await POST(makeRequest({ resumeId: 'resume-1' }))
      expect(res.status).toBe(404)
    })
  })

  // ── Successful duplication ────────────────────────────────────

  describe('successful duplication', () => {
    it('returns 201 with the new resumeId', async () => {
      const res = await POST(makeRequest({ resumeId: 'resume-1' }))
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.resumeId).toBe('resume-2')
    })

    it('creates the new resume inside a transaction', async () => {
      await POST(makeRequest({ resumeId: 'resume-1' }))
      expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    })

    it('sets tailoredFor on the new resume when provided', async () => {
      await POST(makeRequest({ resumeId: 'resume-1', tailoredFor: 'Senior Eng @ Acme' }))
      expect(prisma.resume.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tailoredFor: 'Senior Eng @ Acme' }),
        }),
      )
    })

    it('uses the source resume id as parentResumeId for a base resume', async () => {
      await POST(makeRequest({ resumeId: 'resume-1' }))
      expect(prisma.resume.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ parent: { connect: { id: 'resume-1' } } }),
        }),
      )
    })

    it('flattens hierarchy — uses grandparent id when source is already a child', async () => {
      vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce({
        ...BASE_RESUME,
        id: 'resume-child',
        parentResumeId: 'resume-grandparent',
      } as any)

      await POST(makeRequest({ resumeId: 'resume-child' }))
      expect(prisma.resume.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ parent: { connect: { id: 'resume-grandparent' } } }),
        }),
      )
    })

    it('marks the new resume as private (isPublic:false)', async () => {
      await POST(makeRequest({ resumeId: 'resume-1' }))
      expect(prisma.resume.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isPublic: false, publicSlug: null }),
        }),
      )
    })

    it('appends Tailored to title when no tailoredFor is given', async () => {
      await POST(makeRequest({ resumeId: 'resume-1' }))
      expect(prisma.resume.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: expect.stringContaining('Tailored') }),
        }),
      )
    })

    it('deep-copies experiences into the new resume', async () => {
      const withExp = {
        ...BASE_RESUME,
        experiences: [{ id: 'exp-1', resumeId: 'resume-1', company: 'Acme', role: 'Eng', startDate: new Date(), endDate: null, description: null, location: null, createdAt: new Date(), updatedAt: new Date() }],
      }
      vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce(withExp as any)

      await POST(makeRequest({ resumeId: 'resume-1' }))

      expect(prisma.experience.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ company: 'Acme', resumeId: 'resume-2' }),
        }),
      )
    })
  })

  // ── Error handling ───────────────────────────────────────────

  describe('error handling', () => {
    it('returns 500 when the transaction throws', async () => {
      vi.mocked(prisma.$transaction).mockRejectedValueOnce(new Error('TX rollback'))
      const res = await POST(makeRequest({ resumeId: 'resume-1' }))
      expect(res.status).toBe(500)
    })
  })
})
