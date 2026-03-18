/** @type {import('next').NextConfig} */

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
    experimental: {
        reactCompiler: true,
    },
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
