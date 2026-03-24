import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.url('DATABASE_URL must be a valid URL'),

  // Auth
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters (run: openssl rand -base64 32)'),

  // App
  APP_URL: z.url('APP_URL must be a valid URL'),
  NEXT_PUBLIC_BASE_URL: z.url('NEXT_PUBLIC_BASE_URL must be a valid URL'),
  ADMIN_EMAIL: z.email('ADMIN_EMAIL must be a valid email address').optional(),

  // Stripe
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_ (use sk_test_ for development)'),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_'),
  NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: z
    .string()
    .startsWith('price_', 'NEXT_PUBLIC_STRIPE_PRO_PRICE_ID must start with price_'),

  // Resend
  RESEND_API_KEY: z.string().startsWith('re_', 'RESEND_API_KEY must start with re_'),

  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-', 'OPENAI_API_KEY must start with sk-'),

  // Google OAuth
  AUTH_GOOGLE_ID: z.string().min(1, 'AUTH_GOOGLE_ID is required').optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1, 'AUTH_GOOGLE_SECRET is required').optional(),

  // Cloudinary
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1, 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is required').optional(),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required').optional(),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required').optional(),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.issues.map((issue) => `  - ${String(issue.path[0])}: ${issue.message}`)
    throw new Error(
      `\n\nInvalid environment configuration:\n` +
        errors.join('\n') +
        `\n\nCopy .env.example to .env.local and fill in the missing values.\n`,
    )
  }

  return result.data
}

export const env = validateEnv()
