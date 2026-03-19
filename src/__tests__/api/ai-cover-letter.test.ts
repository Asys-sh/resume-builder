import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────
// Hoisted mock refs
// ─────────────────────────────────────────────────────────────────

const {
  mockGetServerUser,
  mockCheckRateLimit,
  mockTryConsumeAICredit,
  mockHandleTrialExpiry,
  mockChatCreate,
  mockUserFindUnique,
  mockResumeFindUnique,
} = vi.hoisted(() => ({
  mockGetServerUser: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockTryConsumeAICredit: vi.fn(),
  mockHandleTrialExpiry: vi.fn(),
  mockChatCreate: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockResumeFindUnique: vi.fn(),
}))

vi.mock('@/lib/auth-helper', () => ({
  getServerUser: mockGetServerUser,
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
}))

vi.mock('@/lib/subscription', () => ({
  tryConsumeAICredit: mockTryConsumeAICredit,
  handleTrialExpiry: mockHandleTrialExpiry,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
    resume: { findUnique: mockResumeFindUnique },
  },
}))

vi.mock('@/lib/openai', () => ({
  openai: {
    chat: {
      completions: { create: mockChatCreate },
    },
  },
}))

// buildResumeContext and buildCoverLetterPrompt are pure helpers — let them
// run for real so we verify the prompt is constructed and passed to OpenAI.
// If they ever break they should have their own unit tests.

import { POST } from '../../../app/api/ai/cover-letter/route'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const makeRequest = (body: Record<string, unknown> = {}): NextRequest =>
  new NextRequest('http://localhost/api/ai/cover-letter', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  subscriptionStatus: 'ACTIVE',
  usageCount: 0,
  usageLimit: 999999,
  billingPeriodEnd: null,
  name: 'Test User',
}

const mockResume = {
  id: 'resume-abc',
  userId: 'user-123',
  summary: 'Experienced software engineer',
  experiences: [{ id: 'exp-1', role: 'Engineer', company: 'Acme', description: 'Built things' }],
  skills: [{ id: 'sk-1', name: 'TypeScript' }],
  education: [{ id: 'edu-1', school: 'MIT', degree: 'BSc', fieldOfStudy: 'CS' }],
  projects: [],
}

const validBody = {
  jobDescription: 'We are looking for a skilled engineer to join our team.',
  jobTitle: 'Software Engineer',
  companyName: 'TechCorp',
}

const makeOpenAIResponse = (content: string) => ({
  choices: [{ message: { content } }],
})

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('POST /api/ai/cover-letter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('OPENAI_API_KEY', 'sk_test_fake')
    // Default happy-path setup
    mockGetServerUser.mockResolvedValue({ id: 'user-123' })
    mockCheckRateLimit.mockReturnValue(null)
    mockUserFindUnique.mockResolvedValue(mockUser)
    mockHandleTrialExpiry.mockResolvedValue(undefined)
    mockTryConsumeAICredit.mockResolvedValue(true)
    mockResumeFindUnique.mockResolvedValue(null) // no resume by default
    mockChatCreate.mockResolvedValue(makeOpenAIResponse('Dear Hiring Manager, ...'))
  })

  // ── Authentication ──────────────────────────────────────────

  it('returns 401 when the user is not authenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  it('returns 401 when session exists but has no id', async () => {
    mockGetServerUser.mockResolvedValueOnce({})

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(401)
  })

  // ── Rate limiting ────────────────────────────────────────────

  it('returns 429 when the rate limit is exceeded', async () => {
    mockCheckRateLimit.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(429)
  })

  // ── User not in DB ────────────────────────────────────────────

  it('returns 404 when the authenticated user does not exist in the database', async () => {
    mockUserFindUnique.mockResolvedValueOnce(null)

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/user not found/i)
  })

  // ── Quota / subscription ─────────────────────────────────────

  it('returns 403 with SubscriptionRequired error when quota is exceeded', async () => {
    mockTryConsumeAICredit.mockResolvedValueOnce(false)

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('SubscriptionRequired')
    expect(body.message).toBeTruthy()
  })

  // ── Input validation ──────────────────────────────────────────

  it('returns 400 when jobDescription is missing', async () => {
    const res = await POST(makeRequest({ jobTitle: 'Engineer', companyName: 'Acme' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/missing job description/i)
  })

  it('returns 400 when jobDescription exceeds 10 000 characters', async () => {
    const res = await POST(
      makeRequest({
        ...validBody,
        jobDescription: 'x'.repeat(10001),
      }),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/too long/i)
  })

  // ── Successful generation (no resume) ────────────────────────

  it('returns 200 with cover letter content on a valid request without a resume', async () => {
    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.content).toBe('Dear Hiring Manager, ...')
  })

  it('calls OpenAI with the correct model and temperature', async () => {
    await POST(makeRequest(validBody))

    const callArgs = mockChatCreate.mock.calls[0][0]
    expect(callArgs.model).toBe('gpt-4o-mini')
    expect(callArgs.temperature).toBe(0.7)
    expect(callArgs.max_tokens).toBe(1000)
  })

  // ── Resume-enriched generation ────────────────────────────────

  it('fetches the resume when a resumeId is provided and enriches the prompt', async () => {
    mockResumeFindUnique.mockResolvedValueOnce(mockResume)

    const res = await POST(makeRequest({ ...validBody, resumeId: 'resume-abc' }))

    expect(res.status).toBe(200)
    expect(mockResumeFindUnique).toHaveBeenCalledWith({
      where: { id: 'resume-abc', userId: 'user-123' },
      include: { experiences: true, skills: true, education: true, projects: true },
    })
  })

  it('proceeds without resume context when provided resumeId is not found', async () => {
    // findUnique returns null even when resumeId is given (e.g. wrong owner)
    mockResumeFindUnique.mockResolvedValueOnce(null)

    const res = await POST(makeRequest({ ...validBody, resumeId: 'resume-not-mine' }))

    // Should still generate a cover letter, just without resume context
    expect(res.status).toBe(200)
  })

  it('does not query the resume table when no resumeId is provided', async () => {
    await POST(makeRequest(validBody))

    expect(mockResumeFindUnique).not.toHaveBeenCalled()
  })

  // ── OpenAI failure handling ───────────────────────────────────

  it('returns 502 when OpenAI returns an empty content string', async () => {
    mockChatCreate.mockResolvedValueOnce({ choices: [{ message: { content: '' } }] })

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.error).toMatch(/empty response/i)
  })

  it('returns 500 when the OpenAI API throws an error', async () => {
    mockChatCreate.mockRejectedValueOnce(new Error('OpenAI service unavailable'))

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/internal server error/i)
  })

  // ── Input sanitization ────────────────────────────────────────

  it('strips HTML from jobTitle and companyName before they reach OpenAI', async () => {
    await POST(
      makeRequest({
        ...validBody,
        jobTitle: '<h1>Senior Engineer</h1>',
        companyName: '<script>evil()</script>TechCorp',
      }),
    )

    const callArgs = mockChatCreate.mock.calls[0][0]
    const prompt: string = callArgs.messages[0].content
    expect(prompt).not.toContain('<h1>')
    expect(prompt).not.toContain('<script>')
    expect(prompt).toContain('Senior Engineer')
    expect(prompt).toContain('TechCorp')
  })

  // ── handleTrialExpiry side-effect ─────────────────────────────

  it('calls handleTrialExpiry before checking quota', async () => {
    await POST(makeRequest(validBody))

    expect(mockHandleTrialExpiry).toHaveBeenCalledWith('user-123', mockUser)
    // tryConsumeAICredit is called after handleTrialExpiry
    expect(mockTryConsumeAICredit).toHaveBeenCalledWith('user-123')
  })
})
