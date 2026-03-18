import { User } from '@prisma-generated/client'
import { prisma } from './prisma'

/**
 * If a user's trial has expired, downgrades them to the free tier (INACTIVE).
 * Call this before checking canUseAIFeatures on trial users.
 */
export async function handleTrialExpiry(userId: string, user: Pick<User, 'subscriptionStatus' | 'billingPeriodEnd'>): Promise<void> {
	if (
		user.subscriptionStatus === 'TRIAL' &&
		user.billingPeriodEnd &&
		new Date() > user.billingPeriodEnd
	) {
		await prisma.user.update({
			where: { id: userId },
			data: {
				subscriptionStatus: 'INACTIVE',
				usageLimit: 5,
				usageCount: 0,
				billingPeriodStart: null,
				billingPeriodEnd: null
			}
		})
		// Mutate in place so canUseAIFeatures sees the updated values
		user.subscriptionStatus = 'INACTIVE'
		user.billingPeriodEnd = null
	}
}

/**
 * Subscription Model
 *
 * This system uses a subscription-based model for AI features:
 * - Users have a subscription status: ACTIVE, INACTIVE, or TRIAL
 * - Each user has a usageCount and usageLimit per billing period
 * - Free tier: 100 AI assists per month (INACTIVE status)
 * - Pro tier: Unlimited AI assists (ACTIVE status)
 * - Billing periods are tracked with billingPeriodStart and billingPeriodEnd
 *
 * Stripe webhooks handle subscription lifecycle:
 * - checkout.session.completed: Activates subscription, resets usage
 * - customer.subscription.updated: Renews billing period, resets usage
 * - customer.subscription.deleted: Deactivates subscription
 */

/**
 * Checks if a user can use AI features based on their subscription status and usage limits.
 *
 * @param user - User object with subscription fields
 * @returns true if the user can use AI features, false otherwise
 *
 * Logic:
 * 1. Subscription status must be ACTIVE, INACTIVE, or TRIAL
 * 2. Usage count must be less than usage limit
 * 3. Billing period must not have ended (if applicable)
 */
export function canUseAIFeatures(user: Pick<User, 'subscriptionStatus' | 'usageCount' | 'usageLimit' | 'billingPeriodEnd'> & { email?: string | null }): boolean {
	// Admin bypass — developer is never quota-limited
	const adminEmail = process.env.ADMIN_EMAIL
	if (adminEmail && user.email && user.email === adminEmail) {
		return true
	}

	// Check if user has exceeded usage limit
	if (user.usageCount >= user.usageLimit) {
		return false
	}

	// Check if billing period has ended (only applies to users with a billing period set)
	if (user.billingPeriodEnd && new Date() > user.billingPeriodEnd) {
		return false
	}

	return true
}

/**
 * Increments the user's usage count in the database.
 *
 * @param userId - The user's ID
 * @returns The updated user object
 *
 * Note: This should be called after successful AI operations.
 */
export async function incrementUsage(userId: string): Promise<User | null> {

	const update = await prisma.user.update({
		where: { id: userId },
		data: {
			usageCount: {
				increment: 1
			}
		}
	})

	if (!update) {
		console.error('Couldn\'t update usage...')
		return null
	}
	return update
}

/**
 * Atomically checks quota and increments usage in a single DB transaction.
 * Prevents the race condition where two concurrent AI requests both pass the
 * canUseAIFeatures check before either one has incremented the counter.
 *
 * @param userId - The user's ID
 * @returns true if the credit was consumed and the caller may proceed, false if quota exceeded
 */
export async function tryConsumeAICredit(userId: string): Promise<boolean> {
	return await prisma.$transaction(async (tx) => {
		const user = await tx.user.findUnique({
			where: { id: userId },
			select: {
				subscriptionStatus: true,
				usageCount: true,
				usageLimit: true,
				billingPeriodEnd: true,
				email: true
			}
		})

		if (!user) return false

		// Admin bypass — no credit consumed
		const adminEmail = process.env.ADMIN_EMAIL
		if (adminEmail && user.email && user.email === adminEmail) return true

		if (user.usageCount >= user.usageLimit) return false
		if (user.billingPeriodEnd && new Date() > user.billingPeriodEnd) return false

		await tx.user.update({
			where: { id: userId },
			data: { usageCount: { increment: 1 } }
		})

		return true
	})
}
