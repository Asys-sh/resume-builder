import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────
// Hoisted mock refs
// ─────────────────────────────────────────────────────────────────

const { mockGetServerUser, mockCheckRateLimit } = vi.hoisted(() => ({
  mockGetServerUser: vi.fn(),
  mockCheckRateLimit: vi.fn(),
}))

vi.mock('@/lib/auth-helper', () => ({
  getServerUser: mockGetServerUser,
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      delete: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
// Import after mocks are registered
import { DELETE } from '../../../app/api/user/delete/route'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const makeRequest = () => new Request('http://localhost/api/user/delete', { method: 'DELETE' })

const authUser = { id: 'user1', email: 'test@test.com' }

const makeRateLimitResponse = () =>
  new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': '3600' },
  })

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('DELETE /api/user/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: authenticated, rate limit not hit
    mockGetServerUser.mockResolvedValue(authUser)
    mockCheckRateLimit.mockReturnValue(null)
  })

  // ── Authentication ───────────────────────────────────────────

  describe('authentication', () => {
    it('returns 401 when the user is not authenticated (null session)', async () => {
      mockGetServerUser.mockResolvedValueOnce(null)

      const res = await DELETE()

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toMatch(/unauthorized/i)
    })

    it('returns 401 when the session has no id', async () => {
      mockGetServerUser.mockResolvedValueOnce({ email: 'test@test.com' })

      const res = await DELETE()

      expect(res.status).toBe(401)
    })

    it('does not call prisma when unauthorized', async () => {
      mockGetServerUser.mockResolvedValueOnce(null)

      await DELETE()

      expect(prisma.user.delete).not.toHaveBeenCalled()
    })
  })

  // ── Rate limiting ────────────────────────────────────────────

  describe('rate limiting', () => {
    it('returns 429 when the rate limit is exceeded (3 attempts per hour)', async () => {
      mockCheckRateLimit.mockReturnValueOnce(makeRateLimitResponse())

      const res = await DELETE()

      expect(res.status).toBe(429)
      const body = await res.json()
      expect(body.error).toMatch(/too many requests/i)
    })

    it('does not call prisma.user.delete when rate limited', async () => {
      mockCheckRateLimit.mockReturnValueOnce(makeRateLimitResponse())

      await DELETE()

      expect(prisma.user.delete).not.toHaveBeenCalled()
    })

    it('enforces the strict 3-per-hour limit via the correct identifier', async () => {
      vi.mocked(prisma.user.delete).mockResolvedValueOnce({} as any)

      await DELETE()

      expect(mockCheckRateLimit).toHaveBeenCalledWith('user-delete:user1', 3, 60 * 60 * 1000)
    })
  })

  // ── Successful deletion ──────────────────────────────────────

  describe('successful deletion', () => {
    it('returns 200 with success:true when the user is deleted', async () => {
      vi.mocked(prisma.user.delete).mockResolvedValueOnce({} as any)

      const res = await DELETE()

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
    })

    it('calls prisma.user.delete with the authenticated user id', async () => {
      vi.mocked(prisma.user.delete).mockResolvedValueOnce({} as any)

      await DELETE()

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user1' },
      })
    })

    it('calls prisma.user.delete exactly once', async () => {
      vi.mocked(prisma.user.delete).mockResolvedValueOnce({} as any)

      await DELETE()

      expect(prisma.user.delete).toHaveBeenCalledTimes(1)
    })
  })

  // ── Error handling ───────────────────────────────────────────

  describe('error handling', () => {
    it('returns 500 when prisma throws an unexpected DB error', async () => {
      vi.mocked(prisma.user.delete).mockRejectedValueOnce(new Error('DB connection lost'))

      const res = await DELETE()

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toMatch(/internal server error/i)
    })

    it('returns 500 when prisma throws a foreign key constraint error', async () => {
      vi.mocked(prisma.user.delete).mockRejectedValueOnce(
        new Error('Foreign key constraint failed on the field'),
      )

      const res = await DELETE()

      expect(res.status).toBe(500)
    })

    it('does not expose internal error details in the 500 response', async () => {
      vi.mocked(prisma.user.delete).mockRejectedValueOnce(
        new Error('DB connection string: postgres://user:secret@host/db'),
      )

      const res = await DELETE()

      expect(res.status).toBe(500)
      const body = await res.json()
      // Should return a generic message, not the raw error
      expect(body.error).not.toMatch(/postgres/i)
      expect(body.error).not.toMatch(/secret/i)
    })
  })
})
