import { NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────
// Hoisted mocks — vi.hoisted ensures these are available inside
// vi.mock factory functions, which are hoisted above all imports
// ─────────────────────────────────────────────────────────────────

const { mockConstructEvent, mockSubscriptionsRetrieve } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockSubscriptionsRetrieve: vi.fn(),
}))

vi.mock('stripe', () => {
  // Must be a real constructor (function/class) because the route calls `new Stripe(...)`
  function MockStripe() {
    return {
      webhooks: { constructEvent: mockConstructEvent },
      subscriptions: { retrieve: mockSubscriptionsRetrieve },
    }
  }
  return { default: MockStripe }
})

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    processedWebhook: { create: vi.fn().mockResolvedValue({}) },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}))

import { prisma } from '@/lib/prisma'
// Import after mocks are set up
import { POST } from '../../app/api/webhooks/stripe/route'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const makeRequest = (body = '{}', signature = 'valid-sig') =>
  new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': signature },
  })

const makeEvent = (type: string, object: Record<string, unknown>): Stripe.Event =>
  ({
    id: 'evt_test',
    type: type as Stripe.Event['type'],
    object: 'event',
    api_version: '2023-10-16' as Stripe.LatestApiVersion,
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: null,
    data: { object },
  }) as unknown as Stripe.Event

const makeCheckoutSession = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'cs_test_123',
  mode: 'subscription',
  subscription: 'sub_test_123',
  customer: 'cus_test_123',
  metadata: { userId: 'user-abc' },
  ...overrides,
})

const makeSubscription = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'sub_test_123',
  status: 'active',
  metadata: { userId: 'user-abc' },
  cancel_at_period_end: false,
  items: {
    data: [
      {
        current_period_start: Math.floor(Date.now() / 1000) - 86400,
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
      },
    ],
  },
  ...overrides,
})

const mockUser = { id: 'user-abc', email: 'user@example.com' }

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fake')
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_fake')
    // Restore default mocks cleared by vi.clearAllMocks()
    vi.mocked(prisma.processedWebhook.create).mockResolvedValue({} as any)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)
  })

  // ── Signature verification ──────────────────────────────────

  it('returns 400 when stripe-signature header is missing', async () => {
    const req = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/signature/i)
  })

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error('Signature mismatch')
    })
    const res = await POST(makeRequest())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/invalid signature/i)
  })

  // ── checkout.session.completed ──────────────────────────────

  it('returns 400 when checkout session has no userId in metadata', async () => {
    const session = makeCheckoutSession({ metadata: {} })
    mockConstructEvent.mockReturnValueOnce(makeEvent('checkout.session.completed', session))

    const res = await POST(makeRequest())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/metadata/i)
  })

  it('returns 200 without DB call for non-subscription checkout mode', async () => {
    const session = makeCheckoutSession({ mode: 'payment' })
    mockConstructEvent.mockReturnValueOnce(makeEvent('checkout.session.completed', session))

    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('returns 404 when checkout user is not found in DB', async () => {
    const session = makeCheckoutSession()
    mockConstructEvent.mockReturnValueOnce(makeEvent('checkout.session.completed', session))
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

    const res = await POST(makeRequest())
    expect(res.status).toBe(404)
  })

  it('activates subscription and updates DB on successful checkout', async () => {
    const session = makeCheckoutSession()
    const subscription = makeSubscription()
    mockConstructEvent.mockReturnValueOnce(makeEvent('checkout.session.completed', session))
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any)
    mockSubscriptionsRetrieve.mockResolvedValueOnce(subscription)
    vi.mocked(prisma.user.update).mockResolvedValueOnce(mockUser as any)

    const res = await POST(makeRequest())
    expect(res.status).toBe(200)

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-abc' },
      data: expect.objectContaining({
        subscriptionStatus: 'ACTIVE',
        usageCount: 0,
        usageLimit: 999999,
        stripeCustomerId: 'cus_test_123',
        billingPeriodStart: expect.any(Date),
        billingPeriodEnd: expect.any(Date),
      }),
    })
  })

  it('converts Stripe UNIX timestamps to Date objects for billing period', async () => {
    const periodStart = 1_700_000_000
    const periodEnd = 1_702_592_000
    const session = makeCheckoutSession()
    const subscription = makeSubscription({
      items: {
        data: [
          {
            current_period_start: periodStart,
            current_period_end: periodEnd,
          },
        ],
      },
    })
    mockConstructEvent.mockReturnValueOnce(makeEvent('checkout.session.completed', session))
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any)
    mockSubscriptionsRetrieve.mockResolvedValueOnce(subscription)
    vi.mocked(prisma.user.update).mockResolvedValueOnce(mockUser as any)

    await POST(makeRequest())

    const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0]
    expect(updateCall.data.billingPeriodStart).toEqual(new Date(periodStart * 1000))
    expect(updateCall.data.billingPeriodEnd).toEqual(new Date(periodEnd * 1000))
  })

  // ── customer.subscription.updated ──────────────────────────

  it('returns 200 without DB call when subscription.updated has no userId', async () => {
    const subscription = makeSubscription({ metadata: {} })
    mockConstructEvent.mockReturnValueOnce(makeEvent('customer.subscription.updated', subscription))

    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('sets status ACTIVE when Stripe subscription status is "active"', async () => {
    const subscription = makeSubscription({ status: 'active' })
    mockConstructEvent.mockReturnValueOnce(makeEvent('customer.subscription.updated', subscription))
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ billingPeriodStart: null } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce(mockUser as any)

    await POST(makeRequest())

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-abc' },
      data: expect.objectContaining({
        subscriptionStatus: 'ACTIVE',
        usageCount: 0,
      }),
    })
  })

  it('sets status ACTIVE when Stripe subscription status is "past_due" (retaining access during retry)', async () => {
    const subscription = makeSubscription({ status: 'past_due' })
    mockConstructEvent.mockReturnValueOnce(makeEvent('customer.subscription.updated', subscription))
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ billingPeriodStart: null } as any)
    vi.mocked(prisma.user.update).mockResolvedValueOnce(mockUser as any)

    await POST(makeRequest())

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-abc' },
      data: expect.objectContaining({ subscriptionStatus: 'ACTIVE' }),
    })
  })

  // ── customer.subscription.deleted ──────────────────────────

  it('returns 200 without DB call when subscription.deleted has no userId', async () => {
    const subscription = makeSubscription({ metadata: {} })
    mockConstructEvent.mockReturnValueOnce(makeEvent('customer.subscription.deleted', subscription))

    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('deactivates subscription and reverts to free tier on cancellation', async () => {
    const subscription = makeSubscription()
    mockConstructEvent.mockReturnValueOnce(makeEvent('customer.subscription.deleted', subscription))
    vi.mocked(prisma.user.update).mockResolvedValueOnce(mockUser as any)

    const res = await POST(makeRequest())
    expect(res.status).toBe(200)

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-abc' },
      data: {
        subscriptionStatus: 'INACTIVE',
        usageCount: 0,
        usageLimit: 5,
      },
    })
  })

  // ── Informational events (no DB side-effects) ───────────────

  it('returns 200 for checkout.session.expired without DB calls', async () => {
    mockConstructEvent.mockReturnValueOnce(
      makeEvent('checkout.session.expired', { id: 'cs_expired' }),
    )
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('returns 200 for invoice.payment_failed without DB calls', async () => {
    mockConstructEvent.mockReturnValueOnce(
      makeEvent('invoice.payment_failed', {
        id: 'in_failed',
        attempt_count: 1,
        parent: { subscription_details: { subscription: 'sub_test_123' } },
      }),
    )
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('returns 200 for an unknown event type without DB calls', async () => {
    mockConstructEvent.mockReturnValueOnce(makeEvent('some.unknown.event', { id: 'unknown' }))
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  // ── Error handling ──────────────────────────────────────────

  it('returns 500 when a DB call throws during event processing', async () => {
    const subscription = makeSubscription()
    mockConstructEvent.mockReturnValueOnce(makeEvent('customer.subscription.deleted', subscription))
    // processedWebhook.create succeeds (default mock), then user.update throws
    vi.mocked(prisma.user.update).mockRejectedValueOnce(new Error('DB connection lost'))

    const res = await POST(makeRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/webhook processing failed/i)
  })
})
