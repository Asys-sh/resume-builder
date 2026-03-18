import { describe, it, expect, vi, beforeEach } from 'vitest'
import { canUseAIFeatures, tryConsumeAICredit, handleTrialExpiry } from '@/lib/subscription'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}))

// Helper to build a mock user with sensible defaults
const mockUser = (overrides: Record<string, unknown> = {}) => ({
    subscriptionStatus: 'INACTIVE' as const,
    usageCount: 0,
    usageLimit: 5,
    billingPeriodEnd: null as Date | null,
    email: 'user@example.com',
    ...overrides,
})

// ─────────────────────────────────────────────────────────────────
// canUseAIFeatures — pure function, no DB calls needed
// ─────────────────────────────────────────────────────────────────
describe('canUseAIFeatures', () => {
    it('allows a user who is under the limit', () => {
        expect(canUseAIFeatures(mockUser({ usageCount: 2, usageLimit: 5 }))).toBe(true)
    })

    it('blocks a user who is exactly at the limit', () => {
        expect(canUseAIFeatures(mockUser({ usageCount: 5, usageLimit: 5 }))).toBe(false)
    })

    it('blocks a user who is over the limit', () => {
        expect(canUseAIFeatures(mockUser({ usageCount: 6, usageLimit: 5 }))).toBe(false)
    })

    it('blocks a user whose billing period has expired', () => {
        const pastDate = new Date(Date.now() - 1_000)
        expect(canUseAIFeatures(mockUser({ billingPeriodEnd: pastDate }))).toBe(false)
    })

    it('allows a user with an active billing period', () => {
        const futureDate = new Date(Date.now() + 86_400_000)
        expect(canUseAIFeatures(mockUser({ billingPeriodEnd: futureDate }))).toBe(true)
    })

    it('bypasses quota entirely for the admin email', () => {
        vi.stubEnv('ADMIN_EMAIL', 'admin@example.com')
        expect(
            canUseAIFeatures(mockUser({ usageCount: 999, usageLimit: 5, email: 'admin@example.com' }))
        ).toBe(true)
        vi.unstubAllEnvs()
    })

    it('does not bypass quota for a non-admin email', () => {
        vi.stubEnv('ADMIN_EMAIL', 'admin@example.com')
        expect(
            canUseAIFeatures(mockUser({ usageCount: 5, usageLimit: 5, email: 'other@example.com' }))
        ).toBe(false)
        vi.unstubAllEnvs()
    })
})

// ─────────────────────────────────────────────────────────────────
// tryConsumeAICredit — atomic transaction, requires Prisma mock
// ─────────────────────────────────────────────────────────────────
describe('tryConsumeAICredit', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    const makeTx = (user: ReturnType<typeof mockUser> | null) => ({
        user: {
            findUnique: vi.fn().mockResolvedValue(user),
            update: vi.fn().mockResolvedValue(user),
        },
    })

    it('consumes one credit and returns true when under quota', async () => {
        const user = mockUser({ usageCount: 2, usageLimit: 5 })
        const tx = makeTx(user)
        vi.mocked(prisma.$transaction).mockImplementation((fn: any) => fn(tx))

        const result = await tryConsumeAICredit('user-1')

        expect(result).toBe(true)
        expect(tx.user.update).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: { usageCount: { increment: 1 } },
        })
    })

    it('returns false and skips the increment when quota is reached', async () => {
        const user = mockUser({ usageCount: 5, usageLimit: 5 })
        const tx = makeTx(user)
        vi.mocked(prisma.$transaction).mockImplementation((fn: any) => fn(tx))

        const result = await tryConsumeAICredit('user-2')

        expect(result).toBe(false)
        expect(tx.user.update).not.toHaveBeenCalled()
    })

    it('returns false when the user does not exist', async () => {
        const tx = makeTx(null)
        vi.mocked(prisma.$transaction).mockImplementation((fn: any) => fn(tx))

        const result = await tryConsumeAICredit('ghost-user')

        expect(result).toBe(false)
        expect(tx.user.update).not.toHaveBeenCalled()
    })

    it('returns false when the billing period has expired', async () => {
        const pastDate = new Date(Date.now() - 1_000)
        const user = mockUser({ usageCount: 0, billingPeriodEnd: pastDate })
        const tx = makeTx(user)
        vi.mocked(prisma.$transaction).mockImplementation((fn: any) => fn(tx))

        const result = await tryConsumeAICredit('user-3')

        expect(result).toBe(false)
        expect(tx.user.update).not.toHaveBeenCalled()
    })

    it('returns true for admin without consuming a credit', async () => {
        vi.stubEnv('ADMIN_EMAIL', 'admin@example.com')
        const user = mockUser({ usageCount: 999, email: 'admin@example.com' })
        const tx = makeTx(user)
        vi.mocked(prisma.$transaction).mockImplementation((fn: any) => fn(tx))

        const result = await tryConsumeAICredit('admin-id')

        expect(result).toBe(true)
        expect(tx.user.update).not.toHaveBeenCalled()
        vi.unstubAllEnvs()
    })
})

// ─────────────────────────────────────────────────────────────────
// handleTrialExpiry — updates DB and mutates user object in place
// ─────────────────────────────────────────────────────────────────
describe('handleTrialExpiry', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('downgrades an expired TRIAL to INACTIVE and resets usage', async () => {
        vi.mocked(prisma.user.update).mockResolvedValue({} as any)
        const user = {
            subscriptionStatus: 'TRIAL' as const,
            billingPeriodEnd: new Date(Date.now() - 1_000),
        }

        await handleTrialExpiry('user-1', user)

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: {
                subscriptionStatus: 'INACTIVE',
                usageLimit: 5,
                usageCount: 0,
                billingPeriodStart: null,
                billingPeriodEnd: null,
            },
        })
        // Mutation is reflected on the passed object
        expect(user.subscriptionStatus).toBe('INACTIVE')
    })

    it('does not touch a trial that has not yet expired', async () => {
        const user = {
            subscriptionStatus: 'TRIAL' as const,
            billingPeriodEnd: new Date(Date.now() + 86_400_000),
        }

        await handleTrialExpiry('user-2', user)

        expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('does not touch an ACTIVE subscription even if billingPeriodEnd is in the past', async () => {
        const user = {
            subscriptionStatus: 'ACTIVE' as const,
            billingPeriodEnd: new Date(Date.now() - 1_000),
        }

        await handleTrialExpiry('user-3', user)

        expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('does not touch an INACTIVE user', async () => {
        const user = {
            subscriptionStatus: 'INACTIVE' as const,
            billingPeriodEnd: null,
        }

        await handleTrialExpiry('user-4', user)

        expect(prisma.user.update).not.toHaveBeenCalled()
    })
})
