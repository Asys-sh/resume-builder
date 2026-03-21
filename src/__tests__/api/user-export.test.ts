import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────
// Hoisted mock refs
// ─────────────────────────────────────────────────────────────────

const { mockGetServerUser } = vi.hoisted(() => ({
  mockGetServerUser: vi.fn(),
}))

vi.mock('@/lib/auth-helper', () => ({
  getServerUser: mockGetServerUser,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
// Import after mocks are registered
import { GET } from '../../../app/api/user/export/route'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const authUser = { id: 'user1', email: 'test@test.com' }

/** Full DB user shape — includes the password relation that must be scrubbed */
const makeDbUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user1',
  name: 'Test User',
  email: 'test@test.com',
  emailVerified: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-06-01'),
  // Sensitive — must never reach the client
  password: { hash: 'super_secret_argon2_hash' },
  resumes: [
    {
      id: 'resume1',
      title: 'Software Engineer Resume',
      createdAt: new Date('2024-02-01'),
      experiences: [{ id: 'exp1', company: 'Acme Corp', role: 'Engineer' }],
      skills: [{ id: 'skill1', name: 'TypeScript' }],
      education: [{ id: 'edu1', institution: 'MIT', degree: 'BSc' }],
      projects: [{ id: 'proj1', name: 'Resume Builder' }],
      certifications: [{ id: 'cert1', name: 'AWS Solutions Architect' }],
      languages: [{ id: 'lang1', name: 'English' }],
    },
  ],
  coverLetters: [
    {
      id: 'cl1',
      title: 'Cover Letter for Acme',
      content: 'Dear Hiring Manager...',
      createdAt: new Date('2024-03-01'),
    },
  ],
  subscriptionStatus: 'ACTIVE',
  usageCount: 3,
  usageLimit: 999999,
  ...overrides,
})

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('GET /api/user/export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: authenticated
    mockGetServerUser.mockResolvedValue(authUser)
  })

  // ── Authentication ───────────────────────────────────────────

  describe('authentication', () => {
    it('returns 401 when the user is not authenticated (null session)', async () => {
      mockGetServerUser.mockResolvedValueOnce(null)

      const res = await GET()

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toMatch(/unauthorized/i)
    })

    it('returns 401 when the session has no id', async () => {
      mockGetServerUser.mockResolvedValueOnce({ email: 'test@test.com' })

      const res = await GET()

      expect(res.status).toBe(401)
    })

    it('does not call prisma when unauthorized', async () => {
      mockGetServerUser.mockResolvedValueOnce(null)

      await GET()

      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })
  })

  // ── Successful export ────────────────────────────────────────

  describe('successful data export', () => {
    it('returns 200 when the user exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser() as any)

      const res = await GET()

      expect(res.status).toBe(200)
    })

    it('returns the user id, name, and email in the response', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser() as any)

      const res = await GET()
      const body = await res.json()

      expect(body).toMatchObject({
        id: 'user1',
        name: 'Test User',
        email: 'test@test.com',
      })
    })

    it('includes the resumes array in the response', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser() as any)

      const res = await GET()
      const body = await res.json()

      expect(body.resumes).toBeDefined()
      expect(Array.isArray(body.resumes)).toBe(true)
      expect(body.resumes).toHaveLength(1)
      expect(body.resumes[0]).toMatchObject({ id: 'resume1', title: 'Software Engineer Resume' })
    })

    it('includes nested resume sections (experiences, skills, education, projects, certifications, languages)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser() as any)

      const res = await GET()
      const body = await res.json()

      const resume = body.resumes[0]
      expect(resume.experiences).toHaveLength(1)
      expect(resume.skills).toHaveLength(1)
      expect(resume.education).toHaveLength(1)
      expect(resume.projects).toHaveLength(1)
      expect(resume.certifications).toHaveLength(1)
      expect(resume.languages).toHaveLength(1)
    })

    it('includes the coverLetters array in the response', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser() as any)

      const res = await GET()
      const body = await res.json()

      expect(body.coverLetters).toBeDefined()
      expect(Array.isArray(body.coverLetters)).toBe(true)
      expect(body.coverLetters[0]).toMatchObject({ id: 'cl1', title: 'Cover Letter for Acme' })
    })

    it('includes subscription data in the response', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser() as any)

      const res = await GET()
      const body = await res.json()

      expect(body.subscriptionStatus).toBe('ACTIVE')
      expect(body.usageCount).toBe(3)
      expect(body.usageLimit).toBe(999999)
    })

    it('queries prisma with the authenticated user id and full includes', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser() as any)

      await GET()

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
        include: {
          resumes: {
            include: {
              experiences: true,
              skills: true,
              education: true,
              projects: true,
              certifications: true,
              languages: true,
            },
          },
          coverLetters: true,
        },
      })
    })
  })

  // ── Password scrubbing ───────────────────────────────────────

  describe('password scrubbing', () => {
    it('does NOT include the password field in the response', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser() as any)

      const res = await GET()
      const body = await res.json()

      expect(body).not.toHaveProperty('password')
    })

    it('does NOT expose the argon2 hash in the response', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser() as any)

      const res = await GET()
      const responseText = await res.text()

      expect(responseText).not.toContain('super_secret_argon2_hash')
      expect(responseText).not.toContain('argon2')
    })

    it('still returns all other top-level fields after scrubbing password', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeDbUser() as any)

      const res = await GET()
      const body = await res.json()

      // These should all be present — only password should be missing
      expect(body).toHaveProperty('id')
      expect(body).toHaveProperty('name')
      expect(body).toHaveProperty('email')
      expect(body).toHaveProperty('resumes')
      expect(body).toHaveProperty('coverLetters')
      expect(body).not.toHaveProperty('password')
    })
  })

  // ── Not-found handling ───────────────────────────────────────

  describe('user not found', () => {
    it('returns 404 when the authenticated user does not exist in the DB', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      const res = await GET()

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error).toMatch(/user not found/i)
    })
  })

  // ── Error handling ───────────────────────────────────────────

  describe('error handling', () => {
    it('returns 500 when prisma throws an unexpected error', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(new Error('DB connection lost'))

      const res = await GET()

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toMatch(/internal server error/i)
    })

    it('returns 200 with empty arrays when the user has no resumes or cover letters', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(
        makeDbUser({ resumes: [], coverLetters: [] }) as any,
      )

      const res = await GET()

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.resumes).toEqual([])
      expect(body.coverLetters).toEqual([])
    })
  })
})
