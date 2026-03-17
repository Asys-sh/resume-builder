/**
 * Environment variable validation.
 * Runs at server startup — throws early with a clear message rather than
 * crashing deep inside a request with a cryptic undefined error.
 *
 * Import this at the top of app/layout.tsx (server component) so it runs
 * on every cold start before any request is handled.
 */

const REQUIRED_SERVER_VARS = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'RESEND_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'APP_URL',
    'OPENAI_API_KEY',
] as const

const REQUIRED_PUBLIC_VARS = [
    'NEXT_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_STRIPE_PRO_PRICE_ID',
] as const

export function validateEnv() {
    const missing: string[] = []

    for (const key of REQUIRED_SERVER_VARS) {
        if (!process.env[key]) missing.push(key)
    }

    for (const key of REQUIRED_PUBLIC_VARS) {
        if (!process.env[key]) missing.push(key)
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables:\n` +
            missing.map((k) => `  - ${k}`).join('\n') +
            `\n\nCopy .env.example to .env.local and fill in the missing values.`
        )
    }
}
