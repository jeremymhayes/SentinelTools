/**
 * Shared security headers for every Sentinel app, consumed by each app's
 * next.config.ts. Applied by Next in dev/start and carried through the
 * OpenNext worker bundle in production.
 *
 * CSP note: Next.js App Router injects inline bootstrap scripts, so
 * script-src needs 'unsafe-inline' unless we move to per-request nonces.
 * Source restriction to 'self' still blocks third-party script injection.
 */
/* React's dev tooling needs eval() for source-mapped stack traces; it is
   never used in production builds, so only dev gets 'unsafe-eval'. */
const scriptSrc =
  process.env.NODE_ENV === 'development'
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'"

export const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]

/** Drop-in `headers` function for next.config.ts. */
export async function headers() {
  return [
    {
      source: '/:path*',
      headers: securityHeaders,
    },
  ]
}
