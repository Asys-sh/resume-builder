import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────
// Hoisted mock refs — shared by both the invoices and portal routes
// ─────────────────────────────────────────────────────────────────

const { mockGetServerUser, mockUserFindUnique, mockInvoicesList, mockBillingPortalSessionsCreate } =
  vi.hoisted(() => ({
    mockGetServerUser: vi.fn(),
    mockUserFindUnique: vi.fn(),
    mockInvoicesList: vi.fn(),
    mockBillingPortalSessionsCreate: vi.fn(),
  }))

vi.mock('@/lib/auth-helper', () => ({
  getServerUser: mockGetServerUser,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
  },
}))

// Both routes call `new Stripe(...)` at module load, so we need a constructor
// mock that returns an object with all required Stripe methods.
vi.mock('stripe', () => {
  function MockStripe() {
    return {
      invoices: { list: mockInvoicesList },
      billingPortal: { sessions: { create: mockBillingPortalSessionsCreate } },
    }
  }
  return { default: MockStripe }
})

import { GET as getInvoices } from '../../../app/api/stripe/invoices/route'
import { POST as createPortal } from '../../../app/api/stripe/portal/route'

// ─────────────────────────────────────────────────────────────────
// Shared fixtures
// ─────────────────────────────────────────────────────────────────

const mockUserWithCustomer = {
  id: 'user-123',
  email: 'test@example.com',
  stripeCustomerId: 'cus_test_123',
}

const mockUserWithoutCustomer = {
  id: 'user-123',
  email: 'test@example.com',
  stripeCustomerId: null,
}

// A minimal Stripe Invoice object shaped like what the route maps over
const makeStripeInvoice = (overrides: Record<string, unknown> = {}) => ({
  id: 'in_test_abc',
  created: 1_700_000_000,
  amount_paid: 1999,
  currency: 'usd',
  status: 'paid',
  invoice_pdf: 'https://invoice.stripe.com/pdf/in_test_abc',
  hosted_invoice_url: 'https://invoice.stripe.com/in_test_abc',
  ...overrides,
})

// ─────────────────────────────────────────────────────────────────
// GET /api/stripe/invoices
// ─────────────────────────────────────────────────────────────────

describe('GET /api/stripe/invoices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fake')
    // Default happy-path setup
    mockGetServerUser.mockResolvedValue({ id: 'user-123' })
    mockUserFindUnique.mockResolvedValue(mockUserWithCustomer)
    mockInvoicesList.mockResolvedValue({ data: [makeStripeInvoice()] })
  })

  // ── Authentication ────────────────────────────────────────────

  it('returns 401 when the user is not authenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)

    const res = await getInvoices()

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  it('returns 401 when session exists but has no id', async () => {
    mockGetServerUser.mockResolvedValueOnce({})

    const res = await getInvoices()

    expect(res.status).toBe(401)
  })

  // ── No Stripe customer ────────────────────────────────────────

  it('returns 200 with an empty invoice array when the user has no Stripe customer ID', async () => {
    mockUserFindUnique.mockResolvedValueOnce(mockUserWithoutCustomer)

    const res = await getInvoices()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.invoices).toEqual([])
    // Should not have called Stripe at all
    expect(mockInvoicesList).not.toHaveBeenCalled()
  })

  it('returns 200 with empty array when user record has no stripeCustomerId field', async () => {
    mockUserFindUnique.mockResolvedValueOnce({ id: 'user-123' }) // no stripeCustomerId key

    const res = await getInvoices()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.invoices).toEqual([])
  })

  // ── Successful fetch ──────────────────────────────────────────

  it('returns 200 with formatted invoices on a valid request', async () => {
    const invoice = makeStripeInvoice()
    mockInvoicesList.mockResolvedValueOnce({ data: [invoice] })

    const res = await getInvoices()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.invoices).toHaveLength(1)
  })

  it('maps each invoice to the expected shape', async () => {
    const invoice = makeStripeInvoice()
    mockInvoicesList.mockResolvedValueOnce({ data: [invoice] })

    const res = await getInvoices()
    const body = await res.json()
    const mapped = body.invoices[0]

    expect(mapped).toEqual({
      id: 'in_test_abc',
      date: 1_700_000_000,
      amount: 1999,
      currency: 'usd',
      status: 'paid',
      pdf: 'https://invoice.stripe.com/pdf/in_test_abc',
      hostedUrl: 'https://invoice.stripe.com/in_test_abc',
    })
  })

  it('returns 200 with an empty invoices array when Stripe returns no invoices', async () => {
    mockInvoicesList.mockResolvedValueOnce({ data: [] })

    const res = await getInvoices()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.invoices).toEqual([])
  })

  it('fetches invoices for the correct Stripe customer', async () => {
    await getInvoices()

    expect(mockInvoicesList).toHaveBeenCalledWith({
      customer: 'cus_test_123',
      limit: 10,
    })
  })

  it('returns multiple formatted invoices when Stripe returns multiple', async () => {
    mockInvoicesList.mockResolvedValueOnce({
      data: [
        makeStripeInvoice({ id: 'in_1' }),
        makeStripeInvoice({ id: 'in_2' }),
        makeStripeInvoice({ id: 'in_3' }),
      ],
    })

    const res = await getInvoices()
    const body = await res.json()

    expect(body.invoices).toHaveLength(3)
    expect(body.invoices.map((i: { id: string }) => i.id)).toEqual(['in_1', 'in_2', 'in_3'])
  })

  // ── Error handling ────────────────────────────────────────────

  it('returns 500 when the Stripe API throws an error', async () => {
    mockInvoicesList.mockRejectedValueOnce(new Error('Stripe API error'))

    const res = await getInvoices()

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/internal server error/i)
  })
})

// ─────────────────────────────────────────────────────────────────
// POST /api/stripe/portal
// ─────────────────────────────────────────────────────────────────

describe('POST /api/stripe/portal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fake')
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://example.com')
    // Default happy-path setup
    mockGetServerUser.mockResolvedValue({ id: 'user-123' })
    mockUserFindUnique.mockResolvedValue(mockUserWithCustomer)
    mockBillingPortalSessionsCreate.mockResolvedValue({
      url: 'https://billing.stripe.com/session/abc',
    })
  })

  // ── Authentication ────────────────────────────────────────────

  it('returns 401 when the user is not authenticated', async () => {
    mockGetServerUser.mockResolvedValueOnce(null)

    const res = await createPortal()

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/unauthorized/i)
  })

  it('returns 401 when session exists but has no id', async () => {
    mockGetServerUser.mockResolvedValueOnce({})

    const res = await createPortal()

    expect(res.status).toBe(401)
  })

  // ── No Stripe customer ────────────────────────────────────────

  it('returns 400 when the user has no active subscription (no stripeCustomerId)', async () => {
    mockUserFindUnique.mockResolvedValueOnce(mockUserWithoutCustomer)

    const res = await createPortal()

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/no active subscription/i)
  })

  it('returns 400 when the user record is not found in the database', async () => {
    mockUserFindUnique.mockResolvedValueOnce(null)

    const res = await createPortal()

    expect(res.status).toBe(400)
  })

  // ── Successful portal creation ────────────────────────────────

  it('returns 200 with the portal URL on a valid request', async () => {
    const res = await createPortal()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://billing.stripe.com/session/abc')
  })

  it('creates the portal session with the correct Stripe customer ID', async () => {
    await createPortal()

    expect(mockBillingPortalSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_test_123' }),
    )
  })

  it('passes the dashboard billing page as the return_url', async () => {
    await createPortal()

    expect(mockBillingPortalSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        return_url: expect.stringContaining('/dashboard/billing'),
      }),
    )
  })

  it('builds return_url from NEXT_PUBLIC_BASE_URL env variable', async () => {
    await createPortal()

    expect(mockBillingPortalSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        return_url: expect.stringContaining('https://example.com'),
      }),
    )
  })

  // ── Error handling ────────────────────────────────────────────

  it('returns 500 when the Stripe API throws an error while creating the portal session', async () => {
    mockBillingPortalSessionsCreate.mockRejectedValueOnce(new Error('Stripe API error'))

    const res = await createPortal()

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/failed to open billing portal/i)
  })
})
