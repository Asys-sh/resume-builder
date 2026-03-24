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
  sanitizePresetData: vi.fn((d: unknown) => d),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    profilePreset: {
      findMany:   vi.fn(),
      findUnique: vi.fn(),
      count:      vi.fn(),
      create:     vi.fn(),
      update:     vi.fn(),
      delete:     vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { GET, POST } from '../../../app/api/profile-presets/route'
import {
  DELETE,
  GET as GET_ID,
  PUT,
} from '../../../app/api/profile-presets/[id]/route'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const AUTHED_USER = { id: 'user-1' }

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/profile-presets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makePutRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/profile-presets/preset-1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeIdRouteContext(id = 'preset-1') {
  return { params: Promise.resolve({ id }) }
}

const PRESET = {
  id: 'preset-1',
  userId: 'user-1',
  label: 'Work Profile',
  fullName: 'Jane Doe',
  headline: 'Engineer',
  email: 'jane@example.com',
  phone: '555-0100',
  address: '123 Main St',
  links: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const VALID_PRESET_BODY = { label: 'Work Profile', fullName: 'Jane Doe' }

// ─────────────────────────────────────────────────────────────────
// GET /api/profile-presets
// ─────────────────────────────────────────────────────────────────

describe('GET /api/profile-presets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerUser.mockResolvedValue(AUTHED_USER)
    vi.mocked(prisma.profilePreset.findMany).mockResolvedValue([PRESET] as any)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 200 with the presets array', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.presets).toHaveLength(1)
    expect(body.presets[0].id).toBe('preset-1')
  })

  it('only fetches presets belonging to the authenticated user', async () => {
    await GET()
    expect(prisma.profilePreset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: AUTHED_USER.id } }),
    )
  })

  it('returns 500 on DB error', async () => {
    vi.mocked(prisma.profilePreset.findMany).mockRejectedValueOnce(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

// ─────────────────────────────────────────────────────────────────
// POST /api/profile-presets
// ─────────────────────────────────────────────────────────────────

describe('POST /api/profile-presets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerUser.mockResolvedValue(AUTHED_USER)
    vi.mocked(prisma.profilePreset.count).mockResolvedValue(0)
    vi.mocked(prisma.profilePreset.create).mockResolvedValue(PRESET as any)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)
    const res = await POST(makePostRequest(VALID_PRESET_BODY))
    expect(res.status).toBe(401)
  })

  it('returns 400 when the 20-preset limit is reached', async () => {
    vi.mocked(prisma.profilePreset.count).mockResolvedValueOnce(20)
    const res = await POST(makePostRequest(VALID_PRESET_BODY))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/maximum/i)
  })

  it('returns 400 when label is missing', async () => {
    const res = await POST(makePostRequest({ fullName: 'Jane' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when label is empty', async () => {
    const res = await POST(makePostRequest({ label: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 201 with the created preset', async () => {
    const res = await POST(makePostRequest(VALID_PRESET_BODY))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.preset.id).toBe('preset-1')
  })

  it('associates the preset with the authenticated user', async () => {
    await POST(makePostRequest(VALID_PRESET_BODY))
    expect(prisma.profilePreset.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: AUTHED_USER.id }) }),
    )
  })

  it('returns 500 on DB error', async () => {
    vi.mocked(prisma.profilePreset.create).mockRejectedValueOnce(new Error('DB error'))
    const res = await POST(makePostRequest(VALID_PRESET_BODY))
    expect(res.status).toBe(500)
  })
})

// ─────────────────────────────────────────────────────────────────
// GET /api/profile-presets/[id]
// ─────────────────────────────────────────────────────────────────

describe('GET /api/profile-presets/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerUser.mockResolvedValue(AUTHED_USER)
    vi.mocked(prisma.profilePreset.findUnique).mockResolvedValue(PRESET as any)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)
    const res = await GET_ID(new NextRequest('http://localhost/api/profile-presets/preset-1'), makeIdRouteContext())
    expect(res.status).toBe(401)
  })

  it('returns 404 when preset does not exist', async () => {
    vi.mocked(prisma.profilePreset.findUnique).mockResolvedValueOnce(null)
    const res = await GET_ID(new NextRequest('http://localhost/api/profile-presets/preset-1'), makeIdRouteContext())
    expect(res.status).toBe(404)
  })

  it('returns 404 when preset belongs to a different user', async () => {
    vi.mocked(prisma.profilePreset.findUnique).mockResolvedValueOnce(null)
    const res = await GET_ID(new NextRequest('http://localhost/api/profile-presets/preset-1'), makeIdRouteContext())
    expect(res.status).toBe(404)
  })

  it('returns 200 with the preset', async () => {
    const res = await GET_ID(new NextRequest('http://localhost/api/profile-presets/preset-1'), makeIdRouteContext())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.preset.id).toBe('preset-1')
  })
})

// ─────────────────────────────────────────────────────────────────
// PUT /api/profile-presets/[id]
// ─────────────────────────────────────────────────────────────────

describe('PUT /api/profile-presets/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerUser.mockResolvedValue(AUTHED_USER)
    vi.mocked(prisma.profilePreset.findUnique).mockResolvedValue(PRESET as any)
    vi.mocked(prisma.profilePreset.update).mockResolvedValue({ ...PRESET, label: 'Updated' } as any)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)
    const res = await PUT(makePutRequest({ label: 'Updated' }), makeIdRouteContext())
    expect(res.status).toBe(401)
  })

  it('returns 404 when preset does not exist', async () => {
    vi.mocked(prisma.profilePreset.findUnique).mockResolvedValueOnce(null)
    const res = await PUT(makePutRequest({ label: 'Updated' }), makeIdRouteContext())
    expect(res.status).toBe(404)
  })

  it('returns 404 when preset belongs to another user', async () => {
    vi.mocked(prisma.profilePreset.findUnique).mockResolvedValueOnce(null)
    const res = await PUT(makePutRequest({ label: 'Updated' }), makeIdRouteContext())
    expect(res.status).toBe(404)
  })

  it('returns 200 with the updated preset', async () => {
    const res = await PUT(makePutRequest({ label: 'Updated' }), makeIdRouteContext())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.preset.label).toBe('Updated')
  })

  it('calls prisma.profilePreset.update with the preset id', async () => {
    await PUT(makePutRequest({ label: 'Updated' }), makeIdRouteContext())
    expect(prisma.profilePreset.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'preset-1' } }),
    )
  })
})

// ─────────────────────────────────────────────────────────────────
// DELETE /api/profile-presets/[id]
// ─────────────────────────────────────────────────────────────────

describe('DELETE /api/profile-presets/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerUser.mockResolvedValue(AUTHED_USER)
    vi.mocked(prisma.profilePreset.findUnique).mockResolvedValue(PRESET as any)
    vi.mocked(prisma.profilePreset.delete).mockResolvedValue(PRESET as any)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)
    const res = await DELETE(new NextRequest('http://localhost/api/profile-presets/preset-1'), makeIdRouteContext())
    expect(res.status).toBe(401)
  })

  it('returns 404 when preset does not exist', async () => {
    vi.mocked(prisma.profilePreset.findUnique).mockResolvedValueOnce(null)
    const res = await DELETE(new NextRequest('http://localhost/api/profile-presets/preset-1'), makeIdRouteContext())
    expect(res.status).toBe(404)
  })

  it('returns 404 when preset belongs to another user', async () => {
    vi.mocked(prisma.profilePreset.findUnique).mockResolvedValueOnce(null)
    const res = await DELETE(new NextRequest('http://localhost/api/profile-presets/preset-1'), makeIdRouteContext())
    expect(res.status).toBe(404)
  })

  it('returns 200 with success:true', async () => {
    const res = await DELETE(new NextRequest('http://localhost/api/profile-presets/preset-1'), makeIdRouteContext())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('calls prisma.profilePreset.delete with the preset id', async () => {
    await DELETE(new NextRequest('http://localhost/api/profile-presets/preset-1'), makeIdRouteContext())
    expect(prisma.profilePreset.delete).toHaveBeenCalledWith({ where: { id: 'preset-1' } })
  })

  it('does not call delete when unauthorized', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)
    await DELETE(new NextRequest('http://localhost/api/profile-presets/preset-1'), makeIdRouteContext())
    expect(prisma.profilePreset.delete).not.toHaveBeenCalled()
  })
})
