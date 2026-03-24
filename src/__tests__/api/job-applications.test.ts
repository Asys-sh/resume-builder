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
  sanitizeText: vi.fn((v: unknown) => v),
  sanitizeUrl: vi.fn((v: unknown) => v),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    jobApplication: {
      findMany:   vi.fn(),
      findUnique: vi.fn(),
      create:     vi.fn(),
      update:     vi.fn(),
      delete:     vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { GET, POST } from '../../../app/api/job-applications/route'
import { DELETE, PUT } from '../../../app/api/job-applications/[id]/route'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const AUTHED_USER = { id: 'user-1' }

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/job-applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makePutRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/job-applications/app-1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeIdRouteContext(id = 'app-1') {
  return { params: Promise.resolve({ id }) }
}

const APPLICATION = {
  id: 'app-1',
  userId: 'user-1',
  company: 'Acme Corp',
  role: 'Software Engineer',
  status: 'APPLIED',
  appliedAt: new Date(),
  jobUrl: null,
  notes: null,
  salary: null,
  location: null,
  resumeId: null,
  coverLetterId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const VALID_APP_BODY = { company: 'Acme Corp', role: 'Software Engineer' }

// ─────────────────────────────────────────────────────────────────
// GET /api/job-applications
// ─────────────────────────────────────────────────────────────────

describe('GET /api/job-applications', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetServerUser.mockResolvedValue(AUTHED_USER)
    vi.mocked(prisma.jobApplication.findMany).mockResolvedValue([APPLICATION] as any)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 200 with the applications array', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.applications).toHaveLength(1)
    expect(body.applications[0].id).toBe('app-1')
  })

  it('only fetches applications belonging to the authenticated user', async () => {
    await GET()
    expect(prisma.jobApplication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: AUTHED_USER.id } }),
    )
  })
})

// ─────────────────────────────────────────────────────────────────
// POST /api/job-applications
// ─────────────────────────────────────────────────────────────────

describe('POST /api/job-applications', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetServerUser.mockResolvedValue(AUTHED_USER)
    vi.mocked(prisma.jobApplication.create).mockResolvedValue(APPLICATION as any)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)
    const res = await POST(makePostRequest(VALID_APP_BODY))
    expect(res.status).toBe(401)
  })

  it('returns 400 when company is missing', async () => {
    const res = await POST(makePostRequest({ role: 'Engineer' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when role is missing', async () => {
    const res = await POST(makePostRequest({ company: 'Acme' }))
    expect(res.status).toBe(400)
  })

  it('returns 201 on success with the created application', async () => {
    const res = await POST(makePostRequest(VALID_APP_BODY))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.application.id).toBe('app-1')
  })

  it('associates the application with the authenticated user', async () => {
    await POST(makePostRequest(VALID_APP_BODY))
    expect(prisma.jobApplication.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: AUTHED_USER.id }) }),
    )
  })

  it('defaults status to APPLIED when not provided', async () => {
    await POST(makePostRequest(VALID_APP_BODY))
    expect(prisma.jobApplication.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'APPLIED' }) }),
    )
  })
})

// ─────────────────────────────────────────────────────────────────
// PUT /api/job-applications/[id]
// ─────────────────────────────────────────────────────────────────

describe('PUT /api/job-applications/[id]', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetServerUser.mockResolvedValue(AUTHED_USER)
    vi.mocked(prisma.jobApplication.findUnique).mockResolvedValue(APPLICATION as any)
    vi.mocked(prisma.jobApplication.update).mockResolvedValue({
      ...APPLICATION,
      status: 'INTERVIEW',
    } as any)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)
    const res = await PUT(makePutRequest({ status: 'INTERVIEW' }), makeIdRouteContext())
    expect(res.status).toBe(401)
  })

  it('returns 404 when application not found or wrong owner', async () => {
    vi.mocked(prisma.jobApplication.findUnique).mockResolvedValueOnce(null)
    const res = await PUT(makePutRequest({ status: 'INTERVIEW' }), makeIdRouteContext())
    expect(res.status).toBe(404)
  })

  it('returns 200 on success with the updated application', async () => {
    const res = await PUT(makePutRequest({ status: 'INTERVIEW' }), makeIdRouteContext())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.application.status).toBe('INTERVIEW')
  })
})

// ─────────────────────────────────────────────────────────────────
// DELETE /api/job-applications/[id]
// ─────────────────────────────────────────────────────────────────

describe('DELETE /api/job-applications/[id]', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetServerUser.mockResolvedValue(AUTHED_USER)
    vi.mocked(prisma.jobApplication.findUnique).mockResolvedValue(APPLICATION as any)
    vi.mocked(prisma.jobApplication.delete).mockResolvedValue(APPLICATION as any)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)
    const res = await DELETE(
      new NextRequest('http://localhost/api/job-applications/app-1'),
      makeIdRouteContext(),
    )
    expect(res.status).toBe(401)
  })

  it('returns 404 when application not found or wrong owner', async () => {
    vi.mocked(prisma.jobApplication.findUnique).mockResolvedValueOnce(null)
    const res = await DELETE(
      new NextRequest('http://localhost/api/job-applications/app-1'),
      makeIdRouteContext(),
    )
    expect(res.status).toBe(404)
  })

  it('returns 200 with { success: true }', async () => {
    const res = await DELETE(
      new NextRequest('http://localhost/api/job-applications/app-1'),
      makeIdRouteContext(),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
