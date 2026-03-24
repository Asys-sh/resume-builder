import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────
// Hoisted mocks
// ─────────────────────────────────────────────────────────────────

const { mockHash, mockSendVerificationEmail } = vi.hoisted(() => ({
  mockHash: vi.fn(),
  mockSendVerificationEmail: vi.fn(),
}))

vi.mock('@node-rs/argon2', () => ({
  hash: mockHash,
}))

vi.mock('@/lib/email', () => ({
  sendVerificationEmail: mockSendVerificationEmail,
}))

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test-token-48chars-abcdefghijklmnopqrstuvwxyz'),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => null),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    password: {
      create: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { POST } from '../../../app/api/auth/signup/route'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const VALID_BODY = {
  email: 'jane@example.com',
  name: 'Jane Doe',
  password: 'Passw0rd!',
}

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const CREATED_USER = { id: 'user-1', email: VALID_BODY.email, name: VALID_BODY.name }

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default happy path
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue(CREATED_USER as any)
    vi.mocked(prisma.password.create).mockResolvedValue({} as any)
    vi.mocked(prisma.verificationToken.create).mockResolvedValue({} as any)
    mockHash.mockResolvedValue('hashed-password')
    mockSendVerificationEmail.mockResolvedValue(undefined)
  })

  // ── Validation: missing fields ───────────────────────────────

  describe('validation — missing fields', () => {
    it('returns 400 when email is missing', async () => {
      const res = await POST(makeRequest({ password: 'Passw0rd!' }))
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('MissingFields')
    })

    it('returns 400 when password is missing', async () => {
      const res = await POST(makeRequest({ email: 'jane@example.com' }))
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('MissingFields')
    })
  })

  // ── Validation: password strength ───────────────────────────

  describe('validation — password strength', () => {
    it('returns 400 WeakPassword when password is under 8 chars', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, password: 'Ab1!' }))
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('WeakPassword')
    })

    it('returns 400 WeakPassword when password has no uppercase', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, password: 'passw0rd!' }))
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('WeakPassword')
    })

    it('returns 400 WeakPassword when password has no lowercase', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, password: 'PASSW0RD!' }))
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('WeakPassword')
    })

    it('returns 400 WeakPassword when password has no number', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, password: 'Password!' }))
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('WeakPassword')
    })

    it('returns 400 WeakPassword when password has no special character', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, password: 'Passw0rd1' }))
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('WeakPassword')
    })
  })

  // ── Validation: email format ─────────────────────────────────

  describe('validation — email format', () => {
    it('returns 400 InvalidEmail for a plaintext string', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, email: 'notanemail' }))
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('InvalidEmail')
    })

    it('returns 400 InvalidEmail for an email missing the domain', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, email: 'jane@' }))
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('InvalidEmail')
    })
  })

  // ── Duplicate email ──────────────────────────────────────────

  describe('duplicate email', () => {
    it('returns 409 UserExists when the email is already registered', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(CREATED_USER as any)

      const res = await POST(makeRequest(VALID_BODY))
      expect(res.status).toBe(409)
      const body = await res.json()
      expect(body.error).toBe('UserExists')
    })

    it('does not call prisma.user.create when the email already exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(CREATED_USER as any)

      await POST(makeRequest(VALID_BODY))
      expect(prisma.user.create).not.toHaveBeenCalled()
    })
  })

  // ── Successful registration ──────────────────────────────────

  describe('successful registration', () => {
    it('returns 200 with success:true', async () => {
      const res = await POST(makeRequest(VALID_BODY))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
    })

    it('hashes the password before storing it', async () => {
      await POST(makeRequest(VALID_BODY))
      expect(mockHash).toHaveBeenCalledWith(VALID_BODY.password)
      expect(prisma.password.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ hash: 'hashed-password' }) }),
      )
    })

    it('creates the user with the correct email and name', async () => {
      await POST(makeRequest(VALID_BODY))
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: VALID_BODY.email, name: VALID_BODY.name },
      })
    })

    it('creates a verification token for the email', async () => {
      await POST(makeRequest(VALID_BODY))
      expect(prisma.verificationToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ identifier: VALID_BODY.email }),
        }),
      )
    })

    it('sends a verification email', async () => {
      await POST(makeRequest(VALID_BODY))
      expect(mockSendVerificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: VALID_BODY.email }),
      )
    })

    it('creates a user with null name when name is omitted', async () => {
      const { name: _name, ...bodyWithoutName } = VALID_BODY
      await POST(makeRequest(bodyWithoutName))
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: VALID_BODY.email, name: null },
      })
    })
  })

  // ── Error handling ───────────────────────────────────────────

  describe('error handling', () => {
    it('returns 500 when prisma.user.create throws', async () => {
      vi.mocked(prisma.user.create).mockRejectedValueOnce(new Error('DB error'))

      const res = await POST(makeRequest(VALID_BODY))
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toBe('InternalError')
    })

    it('does not expose DB error details in the 500 response', async () => {
      vi.mocked(prisma.user.create).mockRejectedValueOnce(
        new Error('connection string: postgres://user:secret@host/db'),
      )

      const res = await POST(makeRequest(VALID_BODY))
      const body = await res.json()
      expect(body.message).not.toMatch(/postgres/i)
      expect(body.message).not.toMatch(/secret/i)
    })
  })
})
