import { describe, expect, it } from 'vitest'
import { checkRateLimit, rateLimit } from '@/lib/rate-limit'

describe('rateLimit', () => {
  it('allows the first request within the limit', () => {
    const result = rateLimit('rl-first', 5, 60_000)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('tracks multiple requests and decrements remaining', () => {
    rateLimit('rl-multi', 3, 60_000)
    rateLimit('rl-multi', 3, 60_000)
    const result = rateLimit('rl-multi', 3, 60_000)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(0)
  })

  it('blocks once the limit is reached', () => {
    rateLimit('rl-block', 2, 60_000)
    rateLimit('rl-block', 2, 60_000)
    const result = rateLimit('rl-block', 2, 60_000)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('resets the counter after the window expires', async () => {
    rateLimit('rl-reset', 1, 10) // 10ms window
    await new Promise((r) => setTimeout(r, 20))
    const result = rateLimit('rl-reset', 1, 10)
    expect(result.success).toBe(true)
  })

  it('maintains separate counters per identifier', () => {
    rateLimit('rl-sep-a', 1, 60_000)
    // Different identifier should not be affected
    const resultB = rateLimit('rl-sep-b', 1, 60_000)
    expect(resultB.success).toBe(true)
    // Original identifier should now be blocked
    const resultA = rateLimit('rl-sep-a', 1, 60_000)
    expect(resultA.success).toBe(false)
  })

  it('includes a resetAt timestamp in the future', () => {
    const before = Date.now()
    const result = rateLimit('rl-ts', 5, 60_000)
    expect(result.resetAt).toBeGreaterThan(before)
  })
})

describe('checkRateLimit', () => {
  it('returns null when under limit', () => {
    const response = checkRateLimit('cl-ok', 5, 60_000)
    expect(response).toBeNull()
  })

  it('returns a 429 Response when over limit', () => {
    checkRateLimit('cl-block', 1, 60_000)
    const response = checkRateLimit('cl-block', 1, 60_000)
    expect(response).not.toBeNull()
    expect(response!.status).toBe(429)
  })

  it('includes a Retry-After header on 429', () => {
    checkRateLimit('cl-header', 1, 60_000)
    const response = checkRateLimit('cl-header', 1, 60_000)
    const retryAfter = response!.headers.get('Retry-After')
    expect(retryAfter).toBeTruthy()
    expect(Number(retryAfter)).toBeGreaterThan(0)
  })

  it('returns JSON with an error message on 429', async () => {
    checkRateLimit('cl-body', 1, 60_000)
    const response = checkRateLimit('cl-body', 1, 60_000)
    const body = await response!.json()
    expect(body).toHaveProperty('error')
  })
})
