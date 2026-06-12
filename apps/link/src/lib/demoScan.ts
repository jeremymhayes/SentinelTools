import type { ScanReport } from './scanner/types'

export type {
  CookieFinding,
  Finding,
  HeaderCheck,
  Recommendation,
  RedirectHop,
  ScanReport,
  ScriptFinding,
  Severity,
} from './scanner/types'

export const demoReport: ScanReport = {
  url: 'https://example-shop.io/checkout',
  scannedAt: '2026-06-11 14:32 UTC',
  scanId: 'LS-2026-0611-4F2A',
  durationMs: 2840,
  score: 55,
  grade: 'Caution',
  verdict: 'medium',
  summary:
    'This page is served over HTTPS but is missing several modern security headers, sets two third-party tracking cookies before consent, and loads analytics scripts from three external hosts. Nothing here indicates phishing or active malice — the risk profile is privacy leakage and weakened defense-in-depth, not deception.',
  scoreBreakdown: [
    { label: 'No Content-Security-Policy header', delta: -14 },
    { label: 'Tracking cookies set before consent', delta: -14 },
    { label: 'HSTS max-age below one year', delta: -7 },
    { label: 'Insecure redirect in chain', delta: -7 },
    { label: 'Referrer-Policy not set', delta: -3 },
  ],
  severityCounts: { ok: 10, low: 3, medium: 4, high: 2, critical: 0 },
  findings: [
    {
      id: 'F-01',
      severity: 'high',
      title: 'No Content-Security-Policy header',
      category: 'Headers',
      summary:
        'Without CSP, any injected script runs with full page privileges. One XSS bug becomes full account compromise.',
    },
    {
      id: 'F-02',
      severity: 'high',
      title: 'Tracking cookies set before consent',
      category: 'Privacy',
      summary:
        'Two third-party advertising cookies are written on first paint, before any consent interaction is possible.',
    },
    {
      id: 'F-03',
      severity: 'medium',
      title: 'HSTS max-age below one year',
      category: 'Headers',
      summary:
        'max-age=86400 leaves a daily window where a downgrade attack can strip TLS on first visit.',
    },
    {
      id: 'F-04',
      severity: 'medium',
      title: 'Insecure redirect in chain',
      category: 'Redirects',
      summary:
        'Hop 2 passes through plain HTTP before re-upgrading. Credentials or tokens in the URL would transit unencrypted.',
    },
    {
      id: 'F-05',
      severity: 'low',
      title: 'Referrer-Policy not set',
      category: 'Privacy',
      summary:
        'Full URLs, including query parameters, leak to every third-party host the page contacts.',
    },
  ],
  redirects: [
    {
      url: 'http://example-shop.io/checkout',
      status: 301,
      protocol: 'http',
      note: 'initial request',
    },
    {
      url: 'http://www.example-shop.io/checkout',
      status: 302,
      protocol: 'http',
      note: 'insecure hop',
    },
    {
      url: 'https://www.example-shop.io/checkout',
      status: 301,
      protocol: 'https',
      note: 'TLS upgrade',
    },
    {
      url: 'https://example-shop.io/checkout',
      status: 200,
      protocol: 'https',
      note: 'final destination',
    },
  ],
  headers: [
    {
      header: 'Strict-Transport-Security',
      present: true,
      value: 'max-age=86400',
      severity: 'medium',
      note: 'Present but max-age is 1 day; recommend ≥ 31536000 with includeSubDomains.',
    },
    {
      header: 'Content-Security-Policy',
      present: false,
      severity: 'high',
      note: 'Missing. No restriction on script, style, or frame sources.',
    },
    {
      header: 'X-Frame-Options',
      present: true,
      value: 'SAMEORIGIN',
      severity: 'ok',
      note: 'Clickjacking protection in place.',
    },
    {
      header: 'X-Content-Type-Options',
      present: true,
      value: 'nosniff',
      severity: 'ok',
      note: 'MIME sniffing disabled.',
    },
    {
      header: 'Referrer-Policy',
      present: false,
      severity: 'low',
      note: 'Missing. Browsers fall back to strict-origin-when-cross-origin, but explicit is safer.',
    },
    {
      header: 'Permissions-Policy',
      present: false,
      severity: 'low',
      note: 'Missing. Camera, microphone, and geolocation are not explicitly denied.',
    },
    {
      header: 'Cross-Origin-Opener-Policy',
      present: true,
      value: 'same-origin',
      severity: 'ok',
      note: 'Browsing context is isolated from cross-origin windows.',
    },
    {
      header: 'Cross-Origin-Resource-Policy',
      present: true,
      value: 'same-origin',
      severity: 'ok',
      note: 'Other origins are restricted from embedding these resources.',
    },
  ],
  cookies: [
    {
      name: '_ga_4XK2',
      domain: '.example-shop.io',
      kind: 'first-party',
      flags: ['Secure', 'SameSite=Lax'],
      issues: ['Missing HttpOnly', 'Lifetime 730 days (over 1 year)'],
      severity: 'low',
    },
    {
      name: '_fbp',
      domain: '.facebook.com',
      kind: 'third-party',
      flags: ['Secure', 'SameSite=None'],
      issues: ['Missing HttpOnly'],
      severity: 'medium',
    },
    {
      name: 'IDE',
      domain: '.doubleclick.net',
      kind: 'third-party',
      flags: ['Secure', 'SameSite=None'],
      issues: ['Missing HttpOnly'],
      severity: 'medium',
    },
    {
      name: 'session_id',
      domain: 'example-shop.io',
      kind: 'first-party',
      flags: ['Secure', 'HttpOnly', 'SameSite=Strict'],
      issues: [],
      severity: 'ok',
    },
  ],
  scripts: [
    {
      host: 'www.googletagmanager.com',
      purpose: 'Tag management / analytics',
      severity: 'low',
    },
    {
      host: 'connect.facebook.net',
      purpose: 'Advertising pixel',
      severity: 'medium',
    },
    {
      host: 'static.hotjar.com',
      purpose: 'Session recording',
      severity: 'medium',
    },
  ],
  recommendations: [
    {
      title: 'Deploy a Content-Security-Policy',
      body: 'Start in report-only mode, observe violations for a week, then enforce. Even a loose policy kills the majority of injected-script attacks.',
      snippetLabel: 'response header',
      snippet:
        "Content-Security-Policy: default-src 'self'; script-src 'self' www.googletagmanager.com; object-src 'none'; base-uri 'self'",
      platformSnippets: [
        {
          label: 'next.config.ts',
          code: "const nextConfig = {\n  async headers() {\n    return [{\n      source: '/(.*)',\n      headers: [{\n        key: 'Content-Security-Policy',\n        value: \"default-src 'self'; object-src 'none'; base-uri 'self'\",\n      }],\n    }]\n  },\n}",
        },
        {
          label: 'express + helmet',
          code: "import helmet from 'helmet'\n\napp.use(helmet.contentSecurityPolicy({\n  directives: {\n    defaultSrc: [\"'self'\"],\n    objectSrc: [\"'none'\"],\n    baseUri: [\"'self'\"],\n  },\n}))",
        },
        {
          label: 'nginx',
          code: 'add_header Content-Security-Policy "default-src \'self\'; object-src \'none\'; base-uri \'self\'" always;',
        },
        {
          label: 'cloudflare pages — _headers',
          code: "/*\n  Content-Security-Policy: default-src 'self'; object-src 'none'; base-uri 'self'",
        },
      ],
    },
    {
      title: 'Extend HSTS to one year and preload',
      body: 'A 1-day max-age protects almost nothing. Set a full year, include subdomains, and submit to the browser preload list.',
      snippetLabel: 'response header',
      snippet:
        'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
      platformSnippets: [
        {
          label: 'next.config.ts',
          code: "headers: [{\n  key: 'Strict-Transport-Security',\n  value: 'max-age=31536000; includeSubDomains; preload',\n}]",
        },
        {
          label: 'express + helmet',
          code: 'app.use(helmet.hsts({\n  maxAge: 31536000,\n  includeSubDomains: true,\n  preload: true,\n}))',
        },
        {
          label: 'nginx',
          code: 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;',
        },
        {
          label: 'cloudflare pages — _headers',
          code: '/*\n  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
        },
      ],
    },
    {
      title: 'Gate tracking cookies behind consent',
      body: 'Load the Facebook pixel and DoubleClick tags only after an affirmative consent event. This is a compliance issue in the EU and several US states, not just hygiene.',
    },
    {
      title: 'Remove the insecure redirect hop',
      body: 'Redirect http://www directly to the final https origin in one hop. Every intermediate HTTP hop is an interception point.',
      snippetLabel: 'nginx',
      snippet:
        'server {\n  listen 80;\n  server_name example-shop.io www.example-shop.io;\n  return 301 https://example-shop.io$request_uri;\n}',
    },
  ],
}
