import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  CodeSnippet,
  MetadataLabel,
  SectionEyebrow,
} from '@sentinel/ui'
import { RiskBadge } from '@sentinel/ui'

export const metadata: Metadata = {
  title: 'Learn',
}

const entries = [
  {
    id: '01',
    slug: 'hsts',
    term: 'HSTS',
    expansion: 'HTTP Strict Transport Security',
    verdictWhenMissing: 'medium' as const,
    body: [
      'When you type a bare domain into a browser, the first request defaults to plain HTTP. An attacker on the same network can intercept that single unencrypted request and keep you on a fake HTTP version of the site — the classic SSL-stripping attack.',
      'HSTS is one response header that closes this window. Once a browser sees it, it refuses to load the site over HTTP for the duration of max-age — the upgrade happens inside the browser before any packet leaves your machine.',
    ],
    snippet:
      'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
    snippetLabel: 'the value worth shipping',
    note: 'LinkSentinel flags max-age under one year, missing includeSubDomains, and absence from the preload list.',
  },
  {
    id: '02',
    slug: 'csp',
    term: 'CSP',
    expansion: 'Content Security Policy',
    verdictWhenMissing: 'high' as const,
    body: [
      'Cross-site scripting works because browsers happily execute any script a page includes — whether the developer put it there or an attacker injected it through a comment field. CSP is an allowlist: the server declares which origins may run script, load styles, or embed frames, and the browser refuses everything else.',
      'A missing CSP turns any small injection bug into total page compromise. Even a permissive policy removes the most common attack paths, which is why this single header carries the heaviest weight in the LinkSentinel score.',
    ],
    snippet:
      "Content-Security-Policy: default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    snippetLabel: 'a reasonable starting policy',
    note: 'Start in Content-Security-Policy-Report-Only mode and tighten from observed violations.',
  },
  {
    id: '03',
    slug: 'redirects',
    term: 'Redirect chains',
    expansion: 'The path between click and destination',
    verdictWhenMissing: 'medium' as const,
    body: [
      'A link rarely lands where it points. Shorteners, tracking wrappers, and protocol upgrades mean a single click can hop through four or five servers before the page renders. Each hop is a place where the destination can be swapped, a token can be read, or plain HTTP can expose the URL to the network.',
      'LinkSentinel walks the full chain and shows every hop with its status code and protocol. The pattern to fear is not length — it is an HTTPS chain that dips back to HTTP, or a final destination on a domain unrelated to the one you clicked.',
    ],
    note: 'Open redirects — where a site forwards to any URL passed in a parameter — are a phishing staple, because the visible domain looks trustworthy.',
  },
  {
    id: '04',
    slug: 'tracking',
    term: 'Tracking',
    expansion: 'Cookies, pixels, and session recorders',
    verdictWhenMissing: 'medium' as const,
    body: [
      'Third-party cookies, advertising pixels, and session-replay scripts let outside companies observe your behavior on a site you chose to visit. The mechanics are mundane — a cookie scoped to an ad network, a 1×1 image request, a script that streams your mouse movements — but the aggregate is a cross-site profile you never agreed to.',
      'The scanner separates first-party cookies (often functional) from third-party ones (almost always tracking), and checks whether any of it fires before a consent dialog could possibly be answered.',
    ],
    note: 'Secure, HttpOnly, and SameSite flags are graded on every cookie — they decide whether the cookie can leak over HTTP, be read by scripts, or ride along on cross-site requests.',
  },
  {
    id: '05',
    slug: 'phishing',
    term: 'Phishing signals',
    expansion: 'Deception, not vulnerability',
    verdictWhenMissing: 'critical' as const,
    body: [
      'Everything above measures how well a site defends its visitors. Phishing is different: the site itself is the attack. The signals are look-alike domains (rnicrosoft.com), fresh registrations dressed as established brands, login forms on domains that have no business asking, and URLs engineered to bury the real hostname.',
      'No single signal is proof. A scanner reports the evidence — domain age, chain destination, form targets — and the verdict stays with the human reading it. That is why every LinkSentinel finding shows its raw evidence instead of a bare verdict.',
    ],
    note: 'When in doubt: never enter credentials on a page you reached from a link. Navigate to the site directly.',
  },
]

export default function LearnPage() {
  return (
    <div>
      <section className="section-block-tight">
        <div className="sheet">
          <div className="anim-fade flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border)] pb-4">
            <MetadataLabel>Field guide — 5 entries</MetadataLabel>
            <MetadataLabel plain>Reading time ≈ 9 min</MetadataLabel>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <h1 className="anim-mask-line display-title">
              <span className="mask-line">
                <span className="block" style={{ animationDelay: '0.08s' }}>
                  What the scanner
                </span>
              </span>
              <span className="mask-line">
                <span
                  className="display-em block"
                  style={{ animationDelay: '0.2s' }}
                >
                  is looking for
                </span>
              </span>
            </h1>
            <p className="anim-rise lede" style={{ animationDelay: '0.4s' }}>
              Five concepts explain most of any scan report. Each entry covers
              the mechanism, the failure mode, and the fix.
            </p>
          </div>

          {/* index */}
          <nav
            aria-label="Guide entries"
            className="anim-rise mt-10 flex flex-wrap gap-x-7 gap-y-2 border-t border-[color:var(--border)] pt-5"
            style={{ animationDelay: '0.5s' }}
          >
            {entries.map((entry) => (
              <a
                key={entry.slug}
                href={`#${entry.slug}`}
                className="link-underline font-[family-name:var(--font-mono)] text-[0.78rem] uppercase tracking-[0.12em] text-[color:var(--text-muted)]"
              >
                {entry.id} — {entry.term}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* entries, case-study style */}
      {entries.map((entry, i) => (
        <section
          key={entry.slug}
          id={entry.slug}
          className={`section-block section-rule ${i % 2 === 1 ? 'section-band' : ''}`}
        >
          <div className="sheet grid gap-10 lg:grid-cols-[1fr_1.6fr]">
            <div className="reveal">
              <SectionEyebrow label={`Entry ${entry.id}`} title={entry.term} />
              <p className="copy-sm mt-3 italic text-[color:var(--text-soft)]">
                {entry.expansion}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <MetadataLabel plain>Typical severity</MetadataLabel>
                <RiskBadge severity={entry.verdictWhenMissing} />
              </div>
            </div>

            <div className="reveal grid gap-5">
              {entry.body.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="copy-sm text-[1rem]">
                  {paragraph}
                </p>
              ))}
              {entry.snippet ? (
                <CodeSnippet
                  code={entry.snippet}
                  label={entry.snippetLabel}
                  className="mt-1"
                />
              ) : null}
              <p className="border-l border-[color:var(--accent)] pl-4 text-[0.9rem] leading-relaxed text-[color:var(--text-muted)]">
                {entry.note}
              </p>
            </div>
          </div>
        </section>
      ))}

      <section className="section-block-tight section-rule">
        <div className="sheet flex flex-wrap items-center justify-between gap-6">
          <p className="lede max-w-md">Theory done. Test a real link.</p>
          <Link href="/" className="button button-primary">
            Open the scanner
            <ArrowRight aria-hidden="true" size={14} />
          </Link>
        </div>
      </section>
    </div>
  )
}
