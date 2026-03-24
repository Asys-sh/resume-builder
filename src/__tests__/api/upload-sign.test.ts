import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────
// Hoisted mocks
// ─────────────────────────────────────────────────────────────────

const { mockGetServerUser } = vi.hoisted(() => ({
  mockGetServerUser: vi.fn(),
}))

vi.mock('@/lib/auth-helper', () => ({
  getServerUser: mockGetServerUser,
}))

import { POST } from '../../../app/api/upload/sign/route'

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────

const AUTHED_USER = { id: 'user-123', email: 'test@example.com' }

const TEST_ENV = {
  CLOUDINARY_API_SECRET: 'test-secret',
  CLOUDINARY_API_KEY: 'test-api-key',
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'test-cloud',
}

// ─────────────────────────────────────────────────────────────────
// Setup / teardown
// ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks()
  mockGetServerUser.mockResolvedValue(AUTHED_USER)
  Object.assign(process.env, TEST_ENV)
})

afterEach(() => {
  for (const key of Object.keys(TEST_ENV)) {
    delete process.env[key]
  }
})

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('POST /api/upload/sign', () => {
  // ── Auth ──────────────────────────────────────────────────────

  it('returns 401 when getServerUser returns null', async () => {
    mockGetServerUser.mockResolvedValue(null)
    const res = await POST()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  // ── Missing env vars ──────────────────────────────────────────

  it('returns 503 when CLOUDINARY_API_SECRET is missing', async () => {
    delete process.env.CLOUDINARY_API_SECRET
    const res = await POST()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error).toBe('Cloudinary not configured')
  })

  it('returns 503 when CLOUDINARY_API_KEY is missing', async () => {
    delete process.env.CLOUDINARY_API_KEY
    const res = await POST()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error).toBe('Cloudinary not configured')
  })

  it('returns 503 when NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is missing', async () => {
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const res = await POST()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error).toBe('Cloudinary not configured')
  })

  // ── Happy path ────────────────────────────────────────────────

  describe('200 success', () => {
    it('returns 200 with the correct response shape', async () => {
      const res = await POST()
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toMatchObject({
        signature: expect.any(String),
        timestamp: expect.any(Number),
        apiKey: expect.any(String),
        cloudName: expect.any(String),
        folder: expect.any(String),
      })
    })

    it('folder equals the authenticated user id, not a hardcoded string', async () => {
      const res = await POST()
      const body = await res.json()
      expect(body.folder).toBe(AUTHED_USER.id)
    })

    it('apiKey matches the mocked CLOUDINARY_API_KEY env var', async () => {
      const res = await POST()
      const body = await res.json()
      expect(body.apiKey).toBe(TEST_ENV.CLOUDINARY_API_KEY)
    })

    it('cloudName matches the mocked NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME env var', async () => {
      const res = await POST()
      const body = await res.json()
      expect(body.cloudName).toBe(TEST_ENV.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)
    })

    it('timestamp is a number (Unix seconds)', async () => {
      const before = Math.floor(Date.now() / 1000)
      const res = await POST()
      const after = Math.ceil(Date.now() / 1000)
      const body = await res.json()
      expect(typeof body.timestamp).toBe('number')
      expect(body.timestamp).toBeGreaterThanOrEqual(before)
      expect(body.timestamp).toBeLessThanOrEqual(after)
    })

    it('signature is a 64-character hex string (SHA-256)', async () => {
      const res = await POST()
      const body = await res.json()
      expect(typeof body.signature).toBe('string')
      expect(body.signature).toHaveLength(64)
      expect(body.signature).toMatch(/^[0-9a-f]{64}$/)
    })
  })
})
