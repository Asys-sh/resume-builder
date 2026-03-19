import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────
// Hoisted mock refs — must be created before any vi.mock() call
// ─────────────────────────────────────────────────────────────────

const {
  mockGetServerUser,
  mockCheckRateLimit,
  mockTryConsumeAICredit,
  mockHandleTrialExpiry,
  mockChatCreate,
  mockFindUnique,
} = vi.hoisted(() => ({
  mockGetServerUser: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockTryConsumeAICredit: vi.fn(),
  mockHandleTrialExpiry: vi.fn(),
  mockChatCreate: vi.fn(),
  mockFindUnique: vi.fn(),
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
    user: { findUnique: mockFindUnique },
  },
}))

// openai is a singleton instance — mock the module so `openai.chat.completions.create`
// resolves to mockChatCreate
vi.mock('@/lib/openai', () => ({
  openai: {
    chat: {
      completions: { create: mockChatCreate },
    },
  },
}))

// Import the handler AFTER all mocks are registered
import { POST } from '../../../app/api/ai/assist/route'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const makeRequest = (body: Record<string, unknown> = {}): NextRequest =>
  new NextRequest('http://localhost/api/ai/assist', {
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

const makeOpenAIResponse = (content: string) => ({
  choices: [{ message: { content } }],
})

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('POST /api/ai/assist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('OPENAI_API_KEY', 'sk_test_fake')
    // By default: authenticated, no rate limit, quota available, user exists
    mockGetServerUser.mockResolvedValue({ id: 'user-123' })
    mockCheckRateLimit.mockReturnValue(null)
    mockFindUnique.mockResolvedValue(mockUser)
    mockHandleTrialExpiry.mockResolvedValue(undefined)
    mockTryConsumeAICredit.mockResolvedValue(true)
    mockChatCreate.mockResolvedValue(makeOpenAIResponse('Generated summary text.'))
  })

  // ── Authentication ──────────────────────────────────────────

  it('returns 401 when the user is not authenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)

    const res = await POST(makeRequest({ type: 'summary' }))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  it('returns 401 when session has no id', async () => {
    mockGetServerUser.mockResolvedValueOnce({})

    const res = await POST(makeRequest({ type: 'summary' }))

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

    const res = await POST(makeRequest({ type: 'summary' }))

    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toMatch(/too many requests/i)
  })

  // ── User not found ────────────────────────────────────────────

  it('returns 404 when the authenticated user is not found in the database', async () => {
    mockFindUnique.mockResolvedValueOnce(null)

    const res = await POST(makeRequest({ type: 'summary' }))

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/user not found/i)
  })

  // ── Quota / subscription ─────────────────────────────────────

  it('returns 403 with upgrade message when the AI quota is exceeded', async () => {
    mockTryConsumeAICredit.mockResolvedValueOnce(false)

    const res = await POST(makeRequest({ type: 'summary' }))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('SubscriptionRequired')
    expect(body.message).toMatch(/upgrade to pro/i)
  })

  // ── Input validation ──────────────────────────────────────────

  it('returns 400 when type is neither "summary" nor "description"', async () => {
    const res = await POST(makeRequest({ type: 'invalid-type' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/invalid type/i)
  })

  // ── Summary generation ────────────────────────────────────────

  it('returns 200 with generated text for a valid summary request', async () => {
    mockChatCreate.mockResolvedValueOnce(makeOpenAIResponse('A great professional summary.'))

    const res = await POST(makeRequest({ type: 'summary', skills: ['TypeScript', 'React'] }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.result).toBe('A great professional summary.')
  })

  it('includes skills in the summary prompt', async () => {
    await POST(makeRequest({ type: 'summary', skills: ['Node.js', 'PostgreSQL'] }))

    const callArgs = mockChatCreate.mock.calls[0][0]
    const prompt: string = callArgs.messages[0].content
    expect(prompt).toContain('Node.js')
    expect(prompt).toContain('PostgreSQL')
  })

  it('uses improvement prompt when currentContent is provided for summary', async () => {
    await POST(makeRequest({ type: 'summary', currentContent: 'Old summary text' }))

    const callArgs = mockChatCreate.mock.calls[0][0]
    const prompt: string = callArgs.messages[0].content
    expect(prompt).toContain('Old summary text')
    expect(prompt).toContain('Improve and rewrite')
  })

  // ── Description generation ────────────────────────────────────

  it('returns 200 with generated bullet points for a valid description request', async () => {
    mockChatCreate.mockResolvedValueOnce(
      makeOpenAIResponse('• Led engineering team\n• Shipped features'),
    )

    const res = await POST(makeRequest({ type: 'description', role: 'Engineer', company: 'Acme' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.result).toContain('•')
  })

  it('includes role and company in the description prompt', async () => {
    await POST(makeRequest({ type: 'description', role: 'Staff Engineer', company: 'BigCo' }))

    const callArgs = mockChatCreate.mock.calls[0][0]
    const prompt: string = callArgs.messages[0].content
    expect(prompt).toContain('Staff Engineer')
    expect(prompt).toContain('BigCo')
  })

  // ── OpenAI failure handling ───────────────────────────────────

  it('returns 502 when OpenAI returns an empty response', async () => {
    mockChatCreate.mockResolvedValueOnce({ choices: [{ message: { content: '' } }] })

    const res = await POST(makeRequest({ type: 'summary' }))

    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.error).toMatch(/empty response/i)
  })

  it('returns 502 when OpenAI returns no choices', async () => {
    mockChatCreate.mockResolvedValueOnce({ choices: [] })

    const res = await POST(makeRequest({ type: 'summary' }))

    expect(res.status).toBe(502)
  })

  it('returns 500 when the OpenAI API call throws an error', async () => {
    mockChatCreate.mockRejectedValueOnce(new Error('OpenAI network error'))

    const res = await POST(makeRequest({ type: 'summary' }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/internal server error/i)
  })

  // ── Input sanitization ────────────────────────────────────────

  it('strips HTML tags from request body fields before using them in the prompt', async () => {
    await POST(
      makeRequest({
        type: 'description',
        role: '<script>alert("xss")</script>Engineer',
        company: 'Acme<img src=x onerror=alert(1)>',
      }),
    )

    const callArgs = mockChatCreate.mock.calls[0][0]
    const prompt: string = callArgs.messages[0].content
    expect(prompt).not.toContain('<script>')
    expect(prompt).not.toContain('<img')
    expect(prompt).toContain('Engineer')
  })

  it('strips javascript: URI schemes from request body fields', async () => {
    await POST(
      makeRequest({
        type: 'summary',
        currentContent: 'javascript:alert(1) Some content',
      }),
    )

    const callArgs = mockChatCreate.mock.calls[0][0]
    const prompt: string = callArgs.messages[0].content
    expect(prompt).not.toContain('javascript:')
  })

  it('sanitizes each entry in the skills array', async () => {
    await POST(
      makeRequest({
        type: 'summary',
        skills: ['<b>React</b>', 'javascript:void(0)'],
      }),
    )

    const callArgs = mockChatCreate.mock.calls[0][0]
    const prompt: string = callArgs.messages[0].content
    expect(prompt).not.toContain('<b>')
    expect(prompt).not.toContain('javascript:')
  })

  it('handles non-array skills gracefully and falls back to an empty list', async () => {
    // Should not throw — just omit the skills line
    const res = await POST(makeRequest({ type: 'summary', skills: 'not-an-array' }))
    // The request still succeeds (skills is optional)
    expect(res.status).toBe(200)
  })

  // ── handleTrialExpiry side-effect ─────────────────────────────

  it('calls handleTrialExpiry with the user id and user object', async () => {
    await POST(makeRequest({ type: 'summary' }))

    expect(mockHandleTrialExpiry).toHaveBeenCalledWith('user-123', mockUser)
  })
})
