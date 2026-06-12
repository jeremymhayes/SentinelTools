import React from 'react'
import { MetadataLabel } from './Primitives'

export interface FooterLink {
  href: string
  label: string
  external?: boolean
}

/* Hairline-ruled footer: mono byline + link strip.
   Same registration as LinkSentinel's footer. */
export const SiteFooter: React.FC<{
  appName: string
  links?: FooterLink[]
}> = ({ appName, links = [] }) => (
  <footer className="section-rule">
    <div className="sheet flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between">
      <MetadataLabel plain>
        {appName} · built by{' '}
        <a
          href="https://www.jeremymhayes.com"
          target="_blank"
          rel="noopener noreferrer"
          className="link-underline text-[color:var(--text-muted)]"
        >
          Jeremy Hayes
        </a>
      </MetadataLabel>
      {links.length > 0 ? (
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-6 gap-y-2"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              {...(link.external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
              className="link-underline meta-label-plain"
            >
              {link.label}
            </a>
          ))}
        </nav>
      ) : null}
    </div>
  </footer>
)
