import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────
// Hoisted mock refs — must be created before vi.mock() factory fns
// ─────────────────────────────────────────────────────────────────

const { mockGetServerUser, mockCheckRateLimit, mockHashFn, mockVerifyFn } = vi.hoisted(() => ({
  mockGetServerUser: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockHashFn: vi.fn(),
  mockVerifyFn: vi.fn(),
}))

vi.mock('@/lib/auth-helper', () => ({
  getServerUser: mockGetServerUser,
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
}))

vi.mock('@node-rs/argon2', () => ({
  hash: mockHashFn,
  verify: mockVerifyFn,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    password: {
      update: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
// Import after mocks are registered
import { POST } from '../../../app/api/user/update/route'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const makeRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/user/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const authUser = { id: 'user1', email: 'test@test.com' }

const makeDbUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user1',
  name: 'Test User',
  email: 'test@test.com',
  emailVerified: new Date(),
  password: { hash: 'hashed_old_password' },
  ...overrides,
})

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('POST /api/user/update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: authenticated, rate limit not hit
    mockGetServerUser.mockResolvedValue(authUser)
    mockCheckRateLimit.mockReturnValue(null)
  })

  // ── Authentication ───────────────────────────────────────────

  describe('authentication', () => {
    it('returns 401 when user is not authenticated (null session)', async () => {
      mockGetServerUser.mockResolvedValueOnce(null)

      const res = await POST(makeRequest({ name: 'New Name' }))

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toMatch(/unauthorized/i)
    })

    it('returns 401 when session has no id', async () => {
      mockGetServerUser.mockResolvedValueOnce({ email: 'test@test.com' })

      const res = await POST(makeRequest({ name: 'New Name' }))

      expect(res.status).toBe(401)
    })
  })

  // ── Rate limiting ────────────────────────────────────────────

  describe('rate limiting', () => {
    it('returns 429 when the rate limit is exceeded', async () => {
      mockCheckRateLimit.mockReturnValueOnce(
        new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '3600' },
        }),
      )

      const res = await POST(makeRequest({ name: 'New Name' }))

      expect(res.status).toBe(429)
      const body = await res.json()
      expect(body.error).toMatch(/too many requests/i)
    })

    it('passes the correct identifier and limits to checkRateLimit', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser() as any)
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: 'user1',
        name: 'New Name',
        email: 'test@test.com',
      } as any)

      await POST(makeRequest({ name: 'New Name' }))

      expect(mockCheckRateLimit).toHaveBeenCalledWith('user-update:user1', 10, 60 * 60 * 1000)
    })
  })

  // ── Name update ──────────────────────────────────────────────

  describe('profile name update', () => {
    it('returns 200 with updated user when name is changed', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser() as any)
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: 'user1',
        name: 'New Name',
        email: 'test@test.com',
      } as any)

      const res = await POST(makeRequest({ name: 'New Name' }))

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.user).toMatchObject({ id: 'user1', name: 'New Name', email: 'test@test.com' })
    })

    it('calls prisma.user.update with the new name', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser() as any)
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: 'user1',
        name: 'Updated Name',
        email: 'test@test.com',
      } as any)

      await POST(makeRequest({ name: 'Updated Name' }))

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user1' },
          data: expect.objectContaining({ name: 'Updated Name' }),
        }),
      )
    })

    it('returns 404 when the authenticated user is not found in DB', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      const res = await POST(makeRequest({ name: 'New Name' }))

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error).toMatch(/user not found/i)
    })
  })

  // ── Email update ─────────────────────────────────────────────

  describe('email update', () => {
    it('returns 200 and resets emailVerified when email is changed', async () => {
      vi.mocked(prisma.user.findUnique)
        // First call: fetch current user
        .mockResolvedValueOnce(makeDbUser() as any)
        // Second call: check if new email is taken
        .mockResolvedValueOnce(null)
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: 'user1',
        name: 'Test User',
        email: 'new@test.com',
      } as any)

      const res = await POST(makeRequest({ email: 'new@test.com' }))

      expect(res.status).toBe(200)
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@test.com',
            emailVerified: null,
          }),
        }),
      )
    })

    it('returns 409 when the new email is already taken', async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(makeDbUser() as any)
        // email taken check returns an existing user
        .mockResolvedValueOnce({ id: 'other-user' } as any)

      const res = await POST(makeRequest({ email: 'taken@test.com' }))

      expect(res.status).toBe(409)
      const body = await res.json()
      expect(body.error).toMatch(/email already in use/i)
    })

    it('does not update email when the submitted email matches the current email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser() as any)
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: 'user1',
        name: 'Test User',
        email: 'test@test.com',
      } as any)

      await POST(makeRequest({ email: 'test@test.com' }))

      const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0]
      expect(updateCall.data).not.toHaveProperty('emailVerified')
      expect(updateCall.data).not.toHaveProperty('email')
    })
  })

  // ── Password update ──────────────────────────────────────────

  describe('password update', () => {
    it('returns 400 when newPassword is given but currentPassword is missing', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser() as any)

      const res = await POST(makeRequest({ newPassword: 'newSecret123' }))

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toMatch(/current password is required/i)
    })

    it('returns 400 when the user has no password set (OAuth account)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser({ password: null }) as any)

      const res = await POST(makeRequest({ currentPassword: 'old', newPassword: 'newSecret123' }))

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toMatch(/no password set/i)
    })

    it('returns 400 when the current password verification fails', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser() as any)
      mockVerifyFn.mockResolvedValueOnce(false)

      const res = await POST(
        makeRequest({ currentPassword: 'wrongPassword', newPassword: 'newSecret123' }),
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toMatch(/invalid current password/i)
    })

    it('returns 200 and updates the password hash when credentials are valid', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser() as any)
      mockVerifyFn.mockResolvedValueOnce(true)
      mockHashFn.mockResolvedValueOnce('new_hashed_password')
      vi.mocked(prisma.password.update).mockResolvedValueOnce({} as any)
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: 'user1',
        name: 'Test User',
        email: 'test@test.com',
      } as any)

      const res = await POST(
        makeRequest({ currentPassword: 'correctOld', newPassword: 'newSecret123' }),
      )

      expect(res.status).toBe(200)
      expect(mockVerifyFn).toHaveBeenCalledWith('hashed_old_password', 'correctOld')
      expect(mockHashFn).toHaveBeenCalledWith('newSecret123')
      expect(prisma.password.update).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        data: { hash: 'new_hashed_password' },
      })
    })
  })

  // ── Error handling ───────────────────────────────────────────

  describe('error handling', () => {
    it('returns 500 when prisma throws an unexpected error', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(new Error('DB connection lost'))

      const res = await POST(makeRequest({ name: 'New Name' }))

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toMatch(/internal server error/i)
    })
  })
})
