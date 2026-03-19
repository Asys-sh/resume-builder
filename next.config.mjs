/** @type {import('next').NextConfig} */

// Fail the build if required vars are absent.
// Format/value validation (Zod) runs at server startup via src/lib/env.ts.
const REQUIRED_VARS = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'RESEND_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'APP_URL',
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_STRIPE_PRO_PRICE_ID',
]

const missing = REQUIRED_VARS.filter((k) => !process.env[k])
if (missing.length > 0) {
  throw new Error(
    `\n\nMissing required environment variables:\n` +
      missing.map((k) => `  - ${k}`).join('\n') +
      `\n\nCopy .env.example to .env.local and fill in the missing values.\n`,
  )
}

const securityHeaders = [
  // Prevent embedding in iframes (clickjacking protection)
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Stop browsers from MIME-sniffing response types
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Control referrer info sent to third-party sites
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Disable browser features the app doesn't use
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  // Force HTTPS for 1 year (only active in production)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  // Content Security Policy
  // - script-src: Next.js requires 'unsafe-inline' for hydration scripts
  // - style-src: fonts.googleapis.com needed for Material Symbols icon font
  // - font-src: fonts.gstatic.com serves the actual Material Symbols font files
  // - img-src: data: for inline SVGs, blob: for PDF preview canvas, https: for OAuth avatars
  // - connect-src: all API calls go to own server only
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
