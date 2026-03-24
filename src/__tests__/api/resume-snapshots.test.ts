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

vi.mock('@/lib/prisma', () => ({
  prisma: {
    resume: {
      findUnique: vi.fn(),
      update:     vi.fn(),
    },
    resumeSnapshot: {
      findMany:   vi.fn(),
      findUnique: vi.fn(),
      findFirst:  vi.fn(),
      count:      vi.fn(),
      create:     vi.fn(),
      delete:     vi.fn(),
    },
    experience:    { deleteMany: vi.fn(), createMany: vi.fn() },
    skill:         { deleteMany: vi.fn(), createMany: vi.fn() },
    education:     { deleteMany: vi.fn(), createMany: vi.fn() },
    project:       { deleteMany: vi.fn(), createMany: vi.fn() },
    certification: { deleteMany: vi.fn(), createMany: vi.fn() },
    language:      { deleteMany: vi.fn(), createMany: vi.fn() },
    $transaction:  vi.fn(),
  },
}))

import { prisma } from '@/lib/prisma'
import {
  GET as getList,
  POST as createSnapshot,
} from '../../../app/api/resumes/[id]/snapshots/route'
import {
  DELETE as deleteSnapshot,
  GET as getSnapshot,
} from '../../../app/api/resumes/[id]/snapshots/[snapshotId]/route'
import { POST as restoreSnapshot } from '../../../app/api/resumes/[id]/snapshots/[snapshotId]/restore/route'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const AUTHED_USER = { id: 'user-1' }
const RESUME_ID = 'resume-1'
const SNAPSHOT_ID = 'snap-1'

const makeCtx = (id: string) => ({ params: Promise.resolve({ id }) })
const makeSnapshotCtx = (id: string, snapshotId: string) => ({
  params: Promise.resolve({ id, snapshotId }),
})

function makeRequest(method: string, body?: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/resumes/${RESUME_ID}/snapshots`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

const BASE_RESUME = {
  id: RESUME_ID,
  userId: 'user-1',
  title: 'My Resume',
  summary: 'A summary.',
  contactInfo: { fullName: 'Jane Doe' },
  template: 'modern',
  tailoredFor: null,
  experiences: [],
  skills: [],
  education: [],
  projects: [],
  certifications: [],
  languages: [],
}

const BASE_SNAPSHOT = {
  id: SNAPSHOT_ID,
  resumeId: RESUME_ID,
  label: 'My checkpoint',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  data: BASE_RESUME,
  resume: { userId: 'user-1' },
}

// ─────────────────────────────────────────────────────────────────
// GET /api/resumes/[id]/snapshots
// ─────────────────────────────────────────────────────────────────

describe('GET /api/resumes/[id]/snapshots', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetServerUser.mockResolvedValue(AUTHED_USER)
    vi.mocked(prisma.resume.findUnique).mockResolvedValue({ id: RESUME_ID } as any)
    vi.mocked(prisma.resumeSnapshot.findMany).mockResolvedValue([
      { id: SNAPSHOT_ID, label: 'My checkpoint', createdAt: new Date() },
    ] as any)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)
    const res = await getList(makeRequest('GET'), makeCtx(RESUME_ID))
    expect(res.status).toBe(401)
  })

  it('returns 404 when resume not owned by user', async () => {
    vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce(null)
    const res = await getList(makeRequest('GET'), makeCtx(RESUME_ID))
    expect(res.status).toBe(404)
  })

  it('returns 200 with array of snapshot metadata (no data blob)', async () => {
    const res = await getList(makeRequest('GET'), makeCtx(RESUME_ID))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body[0].id).toBe(SNAPSHOT_ID)
    expect(body[0].label).toBe('My checkpoint')
    expect(body[0].data).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────
// POST /api/resumes/[id]/snapshots
// ─────────────────────────────────────────────────────────────────

describe('POST /api/resumes/[id]/snapshots', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetServerUser.mockResolvedValue(AUTHED_USER)
    vi.mocked(prisma.resume.findUnique).mockResolvedValue(BASE_RESUME as any)
    vi.mocked(prisma.resumeSnapshot.count).mockResolvedValue(0)
    vi.mocked(prisma.resumeSnapshot.create).mockResolvedValue(BASE_SNAPSHOT as any)
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => cb(prisma))
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)
    const res = await createSnapshot(makeRequest('POST', {}), makeCtx(RESUME_ID))
    expect(res.status).toBe(401)
  })

  it('returns 404 when resume not owned by user', async () => {
    vi.mocked(prisma.resume.findUnique).mockResolvedValueOnce(null)
    const res = await createSnapshot(makeRequest('POST', {}), makeCtx(RESUME_ID))
    expect(res.status).toBe(404)
  })

  it('returns 201 with snapshot metadata', async () => {
    const res = await createSnapshot(makeRequest('POST', {}), makeCtx(RESUME_ID))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe(SNAPSHOT_ID)
    expect(body.label).toBe('My checkpoint')
    expect(body.createdAt).toBeDefined()
  })

  it('enforces 20-snapshot limit — deletes oldest when at 20', async () => {
    vi.mocked(prisma.resumeSnapshot.count).mockResolvedValueOnce(20)
    vi.mocked(prisma.resumeSnapshot.findFirst).mockResolvedValueOnce({ id: 'old-snap' } as any)

    await createSnapshot(makeRequest('POST', {}), makeCtx(RESUME_ID))

    expect(prisma.resumeSnapshot.delete).toHaveBeenCalledWith({ where: { id: 'old-snap' } })
  })

  it('stores the optional label correctly', async () => {
    await createSnapshot(makeRequest('POST', { label: 'Before interview' }), makeCtx(RESUME_ID))

    expect(prisma.resumeSnapshot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ label: 'Before interview' }),
      }),
    )
  })
})

// ─────────────────────────────────────────────────────────────────
// GET /api/resumes/[id]/snapshots/[snapshotId]
// ─────────────────────────────────────────────────────────────────

describe('GET /api/resumes/[id]/snapshots/[snapshotId]', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetServerUser.mockResolvedValue(AUTHED_USER)
    vi.mocked(prisma.resumeSnapshot.findUnique).mockResolvedValue(BASE_SNAPSHOT as any)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)
    const res = await getSnapshot(
      makeRequest('GET'),
      makeSnapshotCtx(RESUME_ID, SNAPSHOT_ID),
    )
    expect(res.status).toBe(401)
  })

  it('returns 404 when snapshot not found', async () => {
    vi.mocked(prisma.resumeSnapshot.findUnique).mockResolvedValueOnce(null)
    const res = await getSnapshot(
      makeRequest('GET'),
      makeSnapshotCtx(RESUME_ID, SNAPSHOT_ID),
    )
    expect(res.status).toBe(404)
  })

  it('returns 200 with snapshot including data blob', async () => {
    const res = await getSnapshot(
      makeRequest('GET'),
      makeSnapshotCtx(RESUME_ID, SNAPSHOT_ID),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(SNAPSHOT_ID)
    expect(body.label).toBe('My checkpoint')
    expect(body.createdAt).toBeDefined()
    expect(body.data).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────
// DELETE /api/resumes/[id]/snapshots/[snapshotId]
// ─────────────────────────────────────────────────────────────────

describe('DELETE /api/resumes/[id]/snapshots/[snapshotId]', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetServerUser.mockResolvedValue(AUTHED_USER)
    vi.mocked(prisma.resumeSnapshot.findUnique).mockResolvedValue(BASE_SNAPSHOT as any)
    vi.mocked(prisma.resumeSnapshot.delete).mockResolvedValue(BASE_SNAPSHOT as any)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)
    const res = await deleteSnapshot(
      makeRequest('DELETE'),
      makeSnapshotCtx(RESUME_ID, SNAPSHOT_ID),
    )
    expect(res.status).toBe(401)
  })

  it('returns 404 when snapshot not found', async () => {
    vi.mocked(prisma.resumeSnapshot.findUnique).mockResolvedValueOnce(null)
    const res = await deleteSnapshot(
      makeRequest('DELETE'),
      makeSnapshotCtx(RESUME_ID, SNAPSHOT_ID),
    )
    expect(res.status).toBe(404)
  })

  it('returns 200 with success:true', async () => {
    const res = await deleteSnapshot(
      makeRequest('DELETE'),
      makeSnapshotCtx(RESUME_ID, SNAPSHOT_ID),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────
// POST /api/resumes/[id]/snapshots/[snapshotId]/restore
// ─────────────────────────────────────────────────────────────────

describe('POST /api/resumes/[id]/snapshots/[snapshotId]/restore', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetServerUser.mockResolvedValue(AUTHED_USER)
    vi.mocked(prisma.resumeSnapshot.findUnique).mockResolvedValue(BASE_SNAPSHOT as any)
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => cb(prisma))
    vi.mocked(prisma.resume.findUnique).mockResolvedValue(BASE_RESUME as any)
    vi.mocked(prisma.resume.update).mockResolvedValue(BASE_RESUME as any)
    vi.mocked(prisma.resumeSnapshot.count).mockResolvedValue(0)
    vi.mocked(prisma.resumeSnapshot.create).mockResolvedValue(BASE_SNAPSHOT as any)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)
    const res = await restoreSnapshot(
      makeRequest('POST'),
      makeSnapshotCtx(RESUME_ID, SNAPSHOT_ID),
    )
    expect(res.status).toBe(401)
  })

  it('returns 404 when snapshot not found', async () => {
    vi.mocked(prisma.resumeSnapshot.findUnique).mockResolvedValueOnce(null)
    const res = await restoreSnapshot(
      makeRequest('POST'),
      makeSnapshotCtx(RESUME_ID, SNAPSHOT_ID),
    )
    expect(res.status).toBe(404)
  })

  it('returns 200 with success:true and calls $transaction', async () => {
    const res = await restoreSnapshot(
      makeRequest('POST'),
      makeSnapshotCtx(RESUME_ID, SNAPSHOT_ID),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
  })
})
