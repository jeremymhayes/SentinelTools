import React from 'react'
import type { Metadata } from 'next'
import { MetadataLabel } from '@sentinel/ui'

export const metadata: Metadata = {
  title: 'Terms of Service',
}

const sections = [
  {
    heading: '1. What LinkSentinel is',
    body: 'LinkSentinel is a free, informational tool that inspects publicly reachable URLs. It reports on redirects, response headers, cookies, and third-party scripts observed at scan time. It is provided for educational and personal-safety purposes.',
  },
  {
    heading: '2. No warranty',
    body: 'Scan results are provided "as is" without warranty of any kind. A passing score does not mean a site is safe, and a failing score does not mean a site is malicious. Results reflect a single automated observation and can be incomplete, outdated, or wrong. You remain responsible for your own browsing decisions.',
  },
  {
    heading: '3. Acceptable use',
    body: 'Use the scanner only against URLs you are entitled to visit. Do not use LinkSentinel to probe systems you do not have permission to assess, to harass site operators, or to automate bulk scanning. Abusive traffic may be rate-limited or blocked.',
  },
  {
    heading: '4. Liability',
    body: 'To the maximum extent permitted by law, the operator of LinkSentinel is not liable for any damages arising from use of this tool or reliance on its output, including damages from visiting scanned sites.',
  },
  {
    heading: '5. Changes',
    body: 'These terms may be updated as the service evolves. Continued use after a change constitutes acceptance of the updated terms.',
  },
]

export default function TermsPage() {
  return (
    <section className="section-block-tight">
      <div className="sheet max-w-3xl">
        <div className="anim-fade flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border)] pb-4">
          <MetadataLabel>Legal — Terms of Service</MetadataLabel>
          <MetadataLabel plain>Effective 2026-06-11</MetadataLabel>
        </div>

        <h1 className="anim-rise display-title mt-10">Terms of Service</h1>

        <div className="anim-rise mt-10 grid gap-8" style={{ animationDelay: '0.15s' }}>
          {sections.map((section) => (
            <div
              key={section.heading}
              className="border-t border-[color:var(--border)] pt-5"
            >
              <h2 className="heading-md">{section.heading}</h2>
              <p className="copy-sm mt-3">{section.body}</p>
            </div>
          ))}
        </div>

        <p className="copy-sm mt-10 border-t border-[color:var(--border)] pt-5">
          Questions? Reach out via{' '}
          <a
            href="https://www.jeremymhayes.com"
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline text-[color:var(--accent)]"
          >
            jeremymhayes.com
          </a>
          .
        </p>
      </div>
    </section>
  )
}
