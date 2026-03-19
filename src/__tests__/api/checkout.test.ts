import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────
// Hoisted mock refs
// ─────────────────────────────────────────────────────────────────

const { mockGetServerUser, mockCheckRateLimit, mockUserFindUnique, mockSessionsCreate } =
  vi.hoisted(() => ({
    mockGetServerUser: vi.fn(),
    mockCheckRateLimit: vi.fn(),
    mockUserFindUnique: vi.fn(),
    mockSessionsCreate: vi.fn(),
  }))

vi.mock('@/lib/auth-helper', () => ({
  getServerUser: mockGetServerUser,
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
  },
}))

// Stripe is instantiated at module load via `new Stripe(...)`.
// We mock the default export as a constructor function (same pattern as
// stripe-webhook.test.ts) so the route's top-level `new Stripe(...)` works.
vi.mock('stripe', () => {
  function MockStripe() {
    return {
      checkout: {
        sessions: { create: mockSessionsCreate },
      },
    }
  }
  return { default: MockStripe }
})

import { POST } from '../../../app/api/checkout/route'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const makeRequest = (body: Record<string, unknown> = {}): NextRequest =>
  new NextRequest('http://localhost/api/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  stripeCustomerId: 'cus_test_123',
}

const mockStripeSession = {
  id: 'cs_test_abc',
  url: 'https://checkout.stripe.com/pay/cs_test_abc',
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fake')
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://example.com')
    // Default happy-path setup
    mockGetServerUser.mockResolvedValue({ id: 'user-123' })
    mockCheckRateLimit.mockReturnValue(null)
    mockUserFindUnique.mockResolvedValue(mockUser)
    mockSessionsCreate.mockResolvedValue(mockStripeSession)
  })

  // ── Authentication ──────────────────────────────────────────

  it('returns 401 when the user is not authenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)

    const res = await POST(makeRequest({ priceId: 'price_test' }))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/unauthorized/i)
  })

  it('returns 401 when session exists but has no id', async () => {
    mockGetServerUser.mockResolvedValueOnce({})

    const res = await POST(makeRequest({ priceId: 'price_test' }))

    expect(res.status).toBe(401)
  })

  // ── Rate limiting ────────────────────────────────────────────

  it('returns 429 when the checkout rate limit is exceeded', async () => {
    mockCheckRateLimit.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const res = await POST(makeRequest({ priceId: 'price_test' }))

    expect(res.status).toBe(429)
  })

  // ── Input validation ──────────────────────────────────────────

  it('returns 400 when priceId is missing from the request body', async () => {
    const res = await POST(makeRequest({}))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/validation error/i)
  })

  it('returns 400 when priceId is an empty string', async () => {
    const res = await POST(makeRequest({ priceId: '' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  // ── User not in DB ────────────────────────────────────────────

  it('returns 404 when the authenticated user is not found in the database', async () => {
    mockUserFindUnique.mockResolvedValueOnce(null)

    const res = await POST(makeRequest({ priceId: 'price_test' }))

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/user not found/i)
  })

  // ── Successful checkout ───────────────────────────────────────

  it('returns 200 with the Stripe session URL on a valid request', async () => {
    const res = await POST(makeRequest({ priceId: 'price_pro_monthly' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.url).toBe('https://checkout.stripe.com/pay/cs_test_abc')
    expect(body.sessionId).toBe('cs_test_abc')
  })

  it('creates a Stripe session with the correct priceId and quantity', async () => {
    await POST(makeRequest({ priceId: 'price_pro_monthly', quantity: 2 }))

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_pro_monthly', quantity: 2 }],
      }),
    )
  })

  it('defaults quantity to 1 when not provided', async () => {
    await POST(makeRequest({ priceId: 'price_pro_monthly' }))

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_pro_monthly', quantity: 1 }],
      }),
    )
  })

  it('defaults mode to "subscription" when not provided', async () => {
    await POST(makeRequest({ priceId: 'price_pro_monthly' }))

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'subscription' }),
    )
  })

  it('uses "payment" mode when explicitly requested', async () => {
    await POST(makeRequest({ priceId: 'price_one_time', mode: 'payment' }))

    expect(mockSessionsCreate).toHaveBeenCalledWith(expect.objectContaining({ mode: 'payment' }))
  })

  // ── Security: userId from session, NOT from request body ─────

  it('uses the session userId for metadata, ignoring any userId in the request body', async () => {
    // Attacker tries to impersonate another user
    const res = await POST(makeRequest({ priceId: 'price_pro', userId: 'attacker-user-id' }))

    expect(res.status).toBe(200)
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { userId: 'user-123' }, // must be from the session
      }),
    )
    // Also verify the attacker's userId was not used to look up the user
    expect(mockUserFindUnique).toHaveBeenCalledWith({ where: { id: 'user-123' } })
  })

  it('embeds the session userId in subscription_data metadata for renewal webhooks', async () => {
    await POST(makeRequest({ priceId: 'price_pro_monthly', mode: 'subscription' }))

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_data: { metadata: { userId: 'user-123' } },
      }),
    )
  })

  it('omits subscription_data when mode is "payment"', async () => {
    await POST(makeRequest({ priceId: 'price_one_time', mode: 'payment' }))

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_data: undefined }),
    )
  })

  it('builds success_url and cancel_url from NEXT_PUBLIC_BASE_URL env variable', async () => {
    await POST(makeRequest({ priceId: 'price_pro_monthly' }))

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: expect.stringContaining('https://example.com'),
        cancel_url: expect.stringContaining('https://example.com'),
      }),
    )
  })

  // ── Stripe API failure ────────────────────────────────────────

  it('returns 500 when the Stripe API throws an error', async () => {
    mockSessionsCreate.mockRejectedValueOnce(new Error('Stripe service unavailable'))

    const res = await POST(makeRequest({ priceId: 'price_pro_monthly' }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/failed to create checkout session/i)
  })
})
