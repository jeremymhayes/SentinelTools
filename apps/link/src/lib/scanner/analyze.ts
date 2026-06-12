import type {
  CookieFinding,
  Finding,
  HeaderCheck,
  Recommendation,
  ScoreDeduction,
  ScriptFinding,
  Severity,
} from './types'
import type { ChainResult } from './fetchChain'

/* crude registrable-domain approximation (no PSL): last two labels */
export function registrableDomain(hostname: string): string {
  const labels = hostname.toLowerCase().split('.')
  return labels.slice(-2).join('.')
}

/* ---------------- security headers ---------------- */

export function analyzeHeaders(headers: Headers): HeaderCheck[] {
  const checks: HeaderCheck[] = []

  const hsts = headers.get('strict-transport-security')
  if (!hsts) {
    checks.push({
      header: 'Strict-Transport-Security',
      present: false,
      severity: 'medium',
      note: 'Missing. First visits over plain HTTP can be intercepted and never upgraded.',
    })
  } else {
    const maxAge = Number(/max-age=(\d+)/i.exec(hsts)?.[1] ?? 0)
    const yearOk = maxAge >= 31536000
    const subdomains = /includesubdomains/i.test(hsts)
    checks.push({
      header: 'Strict-Transport-Security',
      present: true,
      value: hsts,
      severity: yearOk ? 'ok' : 'medium',
      note: yearOk
        ? subdomains
          ? 'Strong policy: one year or more, subdomains included.'
          : 'max-age is solid but includeSubDomains is absent.'
        : `max-age=${maxAge} is below one year; downgrade window on first visit.`,
    })
  }

  const csp = headers.get('content-security-policy')
  const cspReportOnly = headers.get('content-security-policy-report-only')
  if (csp) {
    const unsafeInline = /script-src[^;]*'unsafe-inline'/i.test(csp)
    checks.push({
      header: 'Content-Security-Policy',
      present: true,
      value: csp.length > 120 ? `${csp.slice(0, 120)}…` : csp,
      severity: unsafeInline ? 'low' : 'ok',
      note: unsafeInline
        ? "Present, but script-src allows 'unsafe-inline', which re-opens most XSS paths."
        : 'Policy present and restricts script sources.',
    })
  } else {
    checks.push({
      header: 'Content-Security-Policy',
      present: false,
      severity: 'high',
      note: cspReportOnly
        ? 'Only a report-only policy is set; nothing is actually blocked.'
        : 'Missing. No restriction on script, style, or frame sources.',
    })
  }

  const xfo = headers.get('x-frame-options')
  const frameAncestors = csp ? /frame-ancestors/i.test(csp) : false
  checks.push(
    xfo || frameAncestors
      ? {
          header: 'X-Frame-Options',
          present: true,
          value: xfo ?? 'via CSP frame-ancestors',
          severity: 'ok',
          note: 'Clickjacking protection in place.',
        }
      : {
          header: 'X-Frame-Options',
          present: false,
          severity: 'medium',
          note: 'Missing (and no CSP frame-ancestors). The page can be framed and click-jacked.',
        }
  )

  const xcto = headers.get('x-content-type-options')
  checks.push(
    xcto?.toLowerCase().includes('nosniff')
      ? {
          header: 'X-Content-Type-Options',
          present: true,
          value: xcto,
          severity: 'ok',
          note: 'MIME sniffing disabled.',
        }
      : {
          header: 'X-Content-Type-Options',
          present: false,
          severity: 'low',
          note: 'Missing. Browsers may MIME-sniff responses into executable types.',
        }
  )

  const referrer = headers.get('referrer-policy')
  checks.push(
    referrer
      ? {
          header: 'Referrer-Policy',
          present: true,
          value: referrer,
          severity: 'ok',
          note: 'Referrer leakage is explicitly controlled.',
        }
      : {
          header: 'Referrer-Policy',
          present: false,
          severity: 'low',
          note: 'Missing. Browsers fall back to strict-origin-when-cross-origin, but explicit is safer.',
        }
  )

  const permissions = headers.get('permissions-policy')
  checks.push(
    permissions
      ? {
          header: 'Permissions-Policy',
          present: true,
          value:
            permissions.length > 100
              ? `${permissions.slice(0, 100)}…`
              : permissions,
          severity: 'ok',
          note: 'Powerful browser features are explicitly scoped.',
        }
      : {
          header: 'Permissions-Policy',
          present: false,
          severity: 'low',
          note: 'Missing. Camera, microphone, and geolocation are not explicitly denied.',
        }
  )

  const coop = headers.get('cross-origin-opener-policy')
  checks.push(
    coop
      ? {
          header: 'Cross-Origin-Opener-Policy',
          present: true,
          value: coop,
          severity: 'ok',
          note: 'Browsing context is isolated from cross-origin windows.',
        }
      : {
          header: 'Cross-Origin-Opener-Policy',
          present: false,
          severity: 'low',
          note: 'Missing. Cross-origin pages opened in popups keep a handle on this window, enabling tab-nabbing style attacks.',
        }
  )

  const corp = headers.get('cross-origin-resource-policy')
  checks.push(
    corp
      ? {
          header: 'Cross-Origin-Resource-Policy',
          present: true,
          value: corp,
          severity: 'ok',
          note: 'Other origins are restricted from embedding these resources.',
        }
      : {
          header: 'Cross-Origin-Resource-Policy',
          present: false,
          severity: 'low',
          note: 'Missing. Any site can embed resources from this origin, which can leak data through side channels.',
        }
  )

  return checks
}

/* ---------------- cookies ---------------- */

const TRACKING_COOKIE_PATTERNS =
  /^(_ga|_gid|_gat|_gcl|_fbp|_fbc|ide|_uet|_hj|_cl[su]k|_mkto|ajs_|_pin_|_tt_|muid|fr)/i

export function analyzeCookies(
  setCookies: string[],
  finalHost: string
): CookieFinding[] {
  const siteDomain = registrableDomain(finalHost)
  const seen = new Set<string>()
  const cookies: CookieFinding[] = []

  for (const raw of setCookies) {
    const [pair, ...attrs] = raw.split(';')
    const name = pair.split('=')[0]?.trim()
    if (!name || seen.has(name)) continue
    seen.add(name)

    let secure = false
    let httpOnly = false
    let sameSite: string | null = null
    let maxAgeSeconds: number | null = null
    let domain = finalHost
    for (const attr of attrs) {
      const [key, val] = attr.trim().split('=')
      const k = key?.toLowerCase()
      if (k === 'secure') secure = true
      else if (k === 'httponly') httpOnly = true
      else if (k === 'samesite') sameSite = val ?? ''
      else if (k === 'max-age' && val) maxAgeSeconds = Number(val)
      else if (k === 'expires' && val) {
        const expires = Date.parse(attrs.find((a) => a.trim().toLowerCase().startsWith('expires='))?.trim().slice(8) ?? '')
        if (!Number.isNaN(expires)) {
          maxAgeSeconds = Math.round((expires - Date.now()) / 1000)
        }
      } else if (k === 'domain' && val) domain = val.replace(/^\./, '')
    }

    const flags: string[] = []
    if (secure) flags.push('Secure')
    if (httpOnly) flags.push('HttpOnly')
    if (sameSite !== null) flags.push(`SameSite=${sameSite}`)

    const issues: string[] = []
    if (!secure) issues.push('Missing Secure')
    if (!httpOnly) issues.push('Missing HttpOnly')
    if (sameSite === null) issues.push('No SameSite')
    if (sameSite?.toLowerCase() === 'none' && !secure)
      issues.push('SameSite=None without Secure')
    const yearSeconds = 31536000
    if (maxAgeSeconds !== null && maxAgeSeconds > yearSeconds)
      issues.push(
        `Lifetime ${Math.round(maxAgeSeconds / 86400)} days (over 1 year)`
      )

    const kind: CookieFinding['kind'] =
      registrableDomain(domain) === siteDomain ? 'first-party' : 'third-party'
    const isTracker = TRACKING_COOKIE_PATTERNS.test(name)

    let severity: Severity = 'ok'
    if (kind === 'third-party') severity = 'medium'
    else if (issues.includes('SameSite=None without Secure')) severity = 'medium'
    else if (isTracker) severity = 'low'
    else if (issues.length > 0) severity = 'low'

    cookies.push({
      name,
      domain: domain.startsWith('.') ? domain : kind === 'first-party' ? domain : `.${domain}`,
      kind,
      flags,
      issues,
      severity,
    })
  }

  return cookies
}

/* ---------------- third-party scripts ---------------- */

const KNOWN_HOSTS: Array<{
  match: RegExp
  purpose: string
  severity: Severity
}> = [
  { match: /googletagmanager\.com$/, purpose: 'Tag management / analytics', severity: 'low' },
  { match: /google-analytics\.com$/, purpose: 'Analytics', severity: 'low' },
  { match: /connect\.facebook\.net$/, purpose: 'Advertising pixel', severity: 'medium' },
  { match: /doubleclick\.net$/, purpose: 'Advertising', severity: 'medium' },
  { match: /googlesyndication\.com$/, purpose: 'Advertising', severity: 'medium' },
  { match: /hotjar\.(com|io)$/, purpose: 'Session recording', severity: 'medium' },
  { match: /clarity\.ms$/, purpose: 'Session recording', severity: 'medium' },
  { match: /fullstory\.com$/, purpose: 'Session recording', severity: 'medium' },
  { match: /segment\.(com|io)$/, purpose: 'Analytics pipeline', severity: 'low' },
  { match: /mixpanel\.com$/, purpose: 'Analytics', severity: 'low' },
  { match: /amplitude\.com$/, purpose: 'Analytics', severity: 'low' },
  { match: /tiktok\.com$/, purpose: 'Advertising pixel', severity: 'medium' },
  { match: /ads-twitter\.com$/, purpose: 'Advertising pixel', severity: 'medium' },
  { match: /(jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com)$/, purpose: 'Public CDN', severity: 'low' },
  { match: /(recaptcha\.net|gstatic\.com|google\.com)$/, purpose: 'CAPTCHA / Google services', severity: 'low' },
  { match: /(js\.stripe\.com|stripe\.com)$/, purpose: 'Payment', severity: 'low' },
  { match: /(paypal\.com|paypalobjects\.com)$/, purpose: 'Payment', severity: 'low' },
  { match: /(cloudflare\.com|cloudflareinsights\.com)$/, purpose: 'Infrastructure', severity: 'low' },
  { match: /(jquery\.com|bootstrapcdn\.com)$/, purpose: 'Infrastructure', severity: 'low' },
  { match: /(newrelic\.com|nr-data\.net|sentry\.io|sentry-cdn\.com)$/, purpose: 'Error / performance monitoring', severity: 'low' },
  { match: /(intercom\.io|intercomcdn\.com|crisp\.chat|zdassets\.com)$/, purpose: 'Support chat widget', severity: 'low' },
]

export function analyzeScripts(
  html: string | null,
  finalHost: string
): ScriptFinding[] {
  if (!html) return []
  const siteDomain = registrableDomain(finalHost)
  const hosts = new Map<string, ScriptFinding>()

  const scriptSrc = /<script[^>]+src\s*=\s*["']([^"']+)["']/gi
  for (const match of html.matchAll(scriptSrc)) {
    let src = match[1]
    if (src.startsWith('//')) src = `https:${src}`
    if (!/^https?:\/\//i.test(src)) continue // relative = first-party asset
    let host: string
    try {
      host = new URL(src).hostname.toLowerCase()
    } catch {
      continue
    }
    if (hosts.has(host)) continue

    if (registrableDomain(host) === siteDomain) continue

    const known = KNOWN_HOSTS.find((entry) => entry.match.test(host))
    hosts.set(host, {
      host,
      purpose: known?.purpose ?? 'External script',
      severity: known?.severity ?? 'low',
    })
  }

  const order: Severity[] = ['critical', 'high', 'medium', 'low', 'ok']
  return [...hosts.values()].sort(
    (a, b) => order.indexOf(a.severity) - order.indexOf(b.severity)
  )
}

/* ---------------- findings + score ---------------- */

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 30,
  high: 14,
  medium: 7,
  low: 3,
  ok: 0,
}

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'ok']

interface Analysis {
  findings: Finding[]
  recommendations: Recommendation[]
  score: number
  grade: string
  verdict: Severity
  summary: string
  scoreBreakdown: ScoreDeduction[]
  severityCounts: Record<Severity, number>
}

export function buildAnalysis(
  chain: ChainResult,
  headerChecks: HeaderCheck[],
  cookies: CookieFinding[],
  scripts: ScriptFinding[],
  requestedUrl: URL
): Analysis {
  const findings: Finding[] = []
  const recommendations: Recommendation[] = []
  const hops = chain.hops

  /* --- redirects --- */
  const httpHops = hops.filter((hop) => hop.protocol === 'http')
  const finalInsecure = hops[hops.length - 1]?.protocol === 'http'

  if (finalInsecure) {
    findings.push({
      id: '',
      severity: 'high',
      title: 'Final destination is plain HTTP',
      category: 'Redirects',
      summary:
        'The page you land on is served unencrypted. Anything you type — passwords, card numbers — transits the network in the clear.',
    })
  } else if (httpHops.length > 0) {
    findings.push({
      id: '',
      severity: 'medium',
      title: 'Insecure hop in redirect chain',
      category: 'Redirects',
      summary: `${httpHops.length} of ${hops.length} hops use plain HTTP before reaching the HTTPS destination. Tokens in the URL would transit unencrypted.`,
    })
    recommendations.push({
      title: 'Remove the insecure redirect hop',
      body: 'Redirect HTTP traffic directly to the final HTTPS origin in one hop. Every intermediate HTTP hop is an interception point.',
      snippetLabel: 'nginx',
      snippet: `server {\n  listen 80;\n  server_name ${chain.finalUrl.hostname};\n  return 301 https://${chain.finalUrl.hostname}$request_uri;\n}`,
    })
  }

  const startDomain = registrableDomain(requestedUrl.hostname)
  const endDomain = registrableDomain(chain.finalUrl.hostname)
  if (startDomain !== endDomain) {
    findings.push({
      id: '',
      severity: 'medium',
      title: 'Link resolves to a different domain',
      category: 'Redirects',
      summary: `You asked for ${startDomain} but landed on ${endDomain}. Common with shorteners — and with phishing lures. Verify the destination is what you expected.`,
    })
  }

  if (hops.length > 5) {
    findings.push({
      id: '',
      severity: 'low',
      title: 'Long redirect chain',
      category: 'Redirects',
      summary: `${hops.length} hops before the page loads. Long chains usually mean stacked tracking wrappers, and each hop is a swap point.`,
    })
  }

  if (chain.finalStatus >= 400) {
    findings.push({
      id: '',
      severity: 'low',
      title: `Destination returned HTTP ${chain.finalStatus}`,
      category: 'Redirects',
      summary:
        'The final page answered with an error status. Header and script analysis reflects the error page, not normal content.',
    })
  }

  /* --- headers --- */
  for (const check of headerChecks) {
    if (check.severity === 'ok') continue
    findings.push({
      id: '',
      severity: check.severity,
      title: check.present
        ? `Weak ${check.header}`
        : `No ${check.header} header`,
      category: 'Headers',
      summary: check.note,
    })
  }

  if (headerChecks.some((c) => c.header === 'Content-Security-Policy' && c.severity === 'high')) {
    recommendations.push({
      title: 'Deploy a Content-Security-Policy',
      body: 'Start in report-only mode, observe violations for a week, then enforce. Even a loose policy kills the majority of injected-script attacks.',
      snippetLabel: 'response header',
      snippet:
        "Content-Security-Policy: default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
      platformSnippets: [
        {
          label: 'next.config.ts',
          code: `const nextConfig = {\n  async headers() {\n    return [{\n      source: '/(.*)',\n      headers: [{\n        key: 'Content-Security-Policy',\n        value: "default-src 'self'; object-src 'none'; base-uri 'self'",\n      }],\n    }]\n  },\n}`,
        },
        {
          label: 'express + helmet',
          code: `import helmet from 'helmet'\n\napp.use(helmet.contentSecurityPolicy({\n  directives: {\n    defaultSrc: ["'self'"],\n    objectSrc: ["'none'"],\n    baseUri: ["'self'"],\n  },\n}))`,
        },
        {
          label: 'nginx',
          code: `add_header Content-Security-Policy "default-src 'self'; object-src 'none'; base-uri 'self'" always;`,
        },
        {
          label: 'cloudflare pages — _headers',
          code: `/*\n  Content-Security-Policy: default-src 'self'; object-src 'none'; base-uri 'self'`,
        },
      ],
    })
  }

  const hstsCheck = headerChecks.find(
    (c) => c.header === 'Strict-Transport-Security'
  )
  if (hstsCheck && hstsCheck.severity !== 'ok') {
    recommendations.push({
      title: 'Ship a one-year HSTS policy',
      body: 'A short or missing max-age protects almost nothing. Set a full year, include subdomains, and submit to the browser preload list.',
      snippetLabel: 'response header',
      snippet:
        'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
      platformSnippets: [
        {
          label: 'next.config.ts',
          code: `headers: [{\n  key: 'Strict-Transport-Security',\n  value: 'max-age=31536000; includeSubDomains; preload',\n}]`,
        },
        {
          label: 'express + helmet',
          code: `app.use(helmet.hsts({\n  maxAge: 31536000,\n  includeSubDomains: true,\n  preload: true,\n}))`,
        },
        {
          label: 'nginx',
          code: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`,
        },
        {
          label: 'cloudflare pages — _headers',
          code: `/*\n  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`,
        },
      ],
    })
  }

  /* --- cookies --- */
  const thirdPartyCookies = cookies.filter((c) => c.kind === 'third-party')
  const trackingCookies = cookies.filter(
    (c) => c.kind === 'third-party' || TRACKING_COOKIE_PATTERNS.test(c.name)
  )
  if (thirdPartyCookies.length > 0) {
    findings.push({
      id: '',
      severity: 'high',
      title: 'Tracking cookies set before consent',
      category: 'Privacy',
      summary: `${thirdPartyCookies.length} third-party cookie${thirdPartyCookies.length > 1 ? 's are' : ' is'} written on first load, before any consent interaction is possible.`,
    })
    recommendations.push({
      title: 'Gate tracking cookies behind consent',
      body: 'Load advertising and analytics tags only after an affirmative consent event. This is a compliance issue in the EU and several US states, not just hygiene.',
    })
  } else if (trackingCookies.length > 0) {
    findings.push({
      id: '',
      severity: 'low',
      title: 'First-party analytics cookies on load',
      category: 'Privacy',
      summary: `${trackingCookies.length} analytics cookie${trackingCookies.length > 1 ? 's' : ''} set immediately. First-party scoped, but still fires before consent.`,
    })
  }

  const insecureCookies = cookies.filter(
    (c) => !c.flags.includes('Secure') && c.severity !== 'ok'
  )
  if (insecureCookies.length > 0 && !finalInsecure) {
    findings.push({
      id: '',
      severity: 'low',
      title: 'Cookies without the Secure flag',
      category: 'Privacy',
      summary: `${insecureCookies.length} cookie${insecureCookies.length > 1 ? 's' : ''} can be transmitted over plain HTTP if the browser is ever downgraded.`,
    })
  }

  /* --- scripts --- */
  const recorders = scripts.filter((s) => s.purpose === 'Session recording')
  if (recorders.length > 0) {
    findings.push({
      id: '',
      severity: 'medium',
      title: 'Session recording scripts present',
      category: 'Scripts',
      summary: `${recorders.map((r) => r.host).join(', ')} stream${recorders.length === 1 ? 's' : ''} user interactions — mouse movement, keystrokes in some configurations — to a third party.`,
    })
  }

  const adScripts = scripts.filter(
    (s) => s.purpose === 'Advertising' || s.purpose === 'Advertising pixel'
  )
  if (adScripts.length > 0) {
    findings.push({
      id: '',
      severity: 'medium',
      title: 'Advertising pixels load with the page',
      category: 'Scripts',
      summary: `${adScripts.map((s) => s.host).join(', ')} — cross-site advertising infrastructure executes on load.`,
    })
  }

  const externalHosts = scripts.filter((s) => s.severity !== 'ok')
  if (externalHosts.length > 8) {
    findings.push({
      id: '',
      severity: 'low',
      title: 'Large third-party script surface',
      category: 'Scripts',
      summary: `Code executes from ${externalHosts.length} external hosts. Every one is a supply-chain dependency with full page access.`,
    })
  }

  /* --- sort, number, score --- */
  findings.sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  )
  findings.forEach((finding, i) => {
    finding.id = `F-${String(i + 1).padStart(2, '0')}`
  })

  /* self-explaining score: every finding is a visible deduction from 100 */
  const scoreBreakdown: ScoreDeduction[] = findings
    .filter((f) => SEVERITY_WEIGHT[f.severity] > 0)
    .map((f) => ({
      label: f.title,
      delta: -SEVERITY_WEIGHT[f.severity],
    }))
  const penalty = scoreBreakdown.reduce((sum, d) => sum - d.delta, 0)
  const score = Math.max(0, Math.min(100, 100 - penalty))

  const grade =
    score >= 90 ? 'Strong' :
    score >= 70 ? 'Good' :
    score >= 50 ? 'Caution' :
    score >= 30 ? 'Risky' : 'High Risk'

  /* verdict tracks the score so the badge and category label agree */
  const verdict: Severity =
    score >= 90 ? 'ok' :
    score >= 70 ? 'low' :
    score >= 50 ? 'medium' :
    score >= 30 ? 'high' : 'critical'

  /* counts: failed findings per severity + everything that passed */
  const severityCounts: Record<Severity, number> = {
    ok: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  }
  for (const f of findings) severityCounts[f.severity] += 1
  severityCounts.ok =
    headerChecks.filter((c) => c.severity === 'ok').length +
    cookies.filter((c) => c.severity === 'ok').length +
    scripts.filter((s) => s.severity === 'ok').length +
    (httpHops.length === 0 ? 1 : 0)

  /* --- plain-English summary --- */
  const parts: string[] = []
  parts.push(
    finalInsecure
      ? 'This page is served over plain HTTP — nothing typed here is private.'
      : 'This page is served over HTTPS.'
  )
  const missingHeaders = headerChecks.filter((c) => !c.present).length
  if (missingHeaders > 0) {
    parts.push(
      `It is missing ${missingHeaders} of ${headerChecks.length} recommended security headers.`
    )
  } else {
    parts.push('All recommended security headers are present.')
  }
  if (thirdPartyCookies.length > 0) {
    parts.push(
      `${thirdPartyCookies.length} third-party tracking cookie${thirdPartyCookies.length > 1 ? 's fire' : ' fires'} before consent.`
    )
  }
  if (externalHosts.length > 0) {
    parts.push(
      `Scripts load from ${externalHosts.length} external host${externalHosts.length > 1 ? 's' : ''}.`
    )
  }
  parts.push(
    verdict === 'ok' || verdict === 'low'
      ? 'Nothing here suggests deception — the overall posture is solid.'
      : verdict === 'medium'
        ? 'Nothing here indicates phishing or active malice — the risk profile is privacy leakage and weakened defense-in-depth, not deception.'
        : 'Treat this page with caution, especially before entering credentials or payment details.'
  )

  return {
    findings,
    recommendations,
    score,
    grade,
    verdict,
    summary: parts.join(' '),
    scoreBreakdown,
    severityCounts,
  }
}
