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

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'slug1234ab'),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    resume: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { POST } from '../../../app/api/resumes/share/route'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const AUTHED_USER = { id: 'user-1' }

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/resumes/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const RESUME = { id: 'resume-1', isPublic: false, publicSlug: null }

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('POST /api/resumes/share', () => {
  beforeEach(() => {
    // resetAllMocks clears the mockResolvedValueOnce queue too (unlike clearAllMocks)
    vi.resetAllMocks()
    mockGetServerUser.mockResolvedValue(AUTHED_USER)
    vi.mocked(prisma.resume.update).mockResolvedValue({} as any)
    // Default: first call returns the resume (ownership check),
    //          second call returns null (slug not taken)
    vi.mocked(prisma.resume.findUnique)
      .mockResolvedValueOnce(RESUME as any) // ownership
      .mockResolvedValueOnce(null)          // slug collision check
  })

  // ── Authentication ───────────────────────────────────────────

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetServerUser.mockResolvedValue(null)
      const res = await POST(makeRequest({ resumeId: 'resume-1', isPublic: true }))
      expect(res.status).toBe(401)
    })

    it('does not touch prisma when unauthorized', async () => {
      mockGetServerUser.mockResolvedValue(null)
      await POST(makeRequest({ resumeId: 'resume-1', isPublic: true }))
      expect(prisma.resume.findUnique).not.toHaveBeenCalled()
    })
  })

  // ── Validation ───────────────────────────────────────────────

  describe('validation', () => {
    it('returns 400 when resumeId is missing', async () => {
      const res = await POST(makeRequest({ isPublic: true }))
      expect(res.status).toBe(400)
    })

    it('returns 400 when isPublic is missing', async () => {
      const res = await POST(makeRequest({ resumeId: 'resume-1' }))
      expect(res.status).toBe(400)
    })
  })

  // ── Ownership ────────────────────────────────────────────────

  describe('ownership', () => {
    it('returns 404 when the resume does not belong to the user', async () => {
      vi.mocked(prisma.resume.findUnique).mockReset()
      vi.mocked(prisma.resume.findUnique).mockResolvedValue(null)
      const res = await POST(makeRequest({ resumeId: 'resume-1', isPublic: true }))
      expect(res.status).toBe(404)
    })

    it('queries resume with userId filter to enforce ownership', async () => {
      await POST(makeRequest({ resumeId: 'resume-1', isPublic: true }))
      expect(prisma.resume.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: AUTHED_USER.id }),
        }),
      )
    })
  })

  // ── Making public ────────────────────────────────────────────

  describe('making a resume public', () => {
    it('returns 200 with a publicSlug when isPublic is true', async () => {
      const res = await POST(makeRequest({ resumeId: 'resume-1', isPublic: true }))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.publicSlug).toBe('slug1234ab')
    })

    it('saves isPublic:true and the generated slug to prisma', async () => {
      await POST(makeRequest({ resumeId: 'resume-1', isPublic: true }))
      expect(prisma.resume.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isPublic: true, publicSlug: 'slug1234ab' }),
        }),
      )
    })

    it('reuses an existing slug when the resume already has one', async () => {
      vi.mocked(prisma.resume.findUnique).mockReset()
      vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce({
        ...RESUME,
        publicSlug: 'existing-slug',
      } as any)

      const res = await POST(makeRequest({ resumeId: 'resume-1', isPublic: true }))
      const body = await res.json()
      expect(body.publicSlug).toBe('existing-slug')
    })

    it('defaults hideContactInfo to true when not provided', async () => {
      await POST(makeRequest({ resumeId: 'resume-1', isPublic: true }))
      expect(prisma.resume.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ hideContactInfo: true }),
        }),
      )
    })

    it('respects hideContactInfo:false when explicitly provided', async () => {
      await POST(makeRequest({ resumeId: 'resume-1', isPublic: true, hideContactInfo: false }))
      expect(prisma.resume.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ hideContactInfo: false }),
        }),
      )
    })
  })

  // ── Revoking public access ────────────────────────────────────

  describe('revoking public access', () => {
    it('returns 200 with publicSlug:null when isPublic is false', async () => {
      vi.mocked(prisma.resume.findUnique).mockReset()
      vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce({
        ...RESUME,
        isPublic: true,
        publicSlug: 'existing-slug',
      } as any)

      const res = await POST(makeRequest({ resumeId: 'resume-1', isPublic: false }))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.publicSlug).toBeNull()
    })

    it('clears the publicSlug in prisma when revoking', async () => {
      await POST(makeRequest({ resumeId: 'resume-1', isPublic: false }))
      expect(prisma.resume.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isPublic: false, publicSlug: null }),
        }),
      )
    })
  })

  // ── Error handling ───────────────────────────────────────────

  describe('error handling', () => {
    it('returns 500 when prisma.resume.update throws', async () => {
      vi.mocked(prisma.resume.update).mockRejectedValueOnce(new Error('DB error'))
      const res = await POST(makeRequest({ resumeId: 'resume-1', isPublic: true }))
      expect(res.status).toBe(500)
    })
  })
})
