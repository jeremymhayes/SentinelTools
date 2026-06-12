import React from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, FolderLock } from 'lucide-react'
import { BracketPanel, MetadataLabel } from '@sentinel/ui'
import { ScanInput } from '@/components/scan/ScanInput'

const checkLabels = ['Redirects', 'Headers', 'Cookies', 'Scripts']

export default function HomePage() {
  return (
    <div>
      {/* ============ HERO + SCAN ============ */}
      <section className="pt-6 pb-16 sm:pt-10">
        <div className="sheet">
          <div className="mx-auto w-full max-w-3xl text-center">
            <h1 className="anim-mask-line display-title-xl">
              <span className="mask-line">
                <span className="block" style={{ animationDelay: '0.08s' }}>
                  Know where a link
                </span>
              </span>
              <span className="mask-line">
                <span
                  className="display-em block"
                  style={{ animationDelay: '0.2s' }}
                >
                  really goes.
                </span>
              </span>
            </h1>

            <p
              className="anim-rise lede mx-auto mt-5 max-w-xl"
              style={{ animationDelay: '0.4s' }}
            >
              Paste any URL. LinkSentinel checks redirects, security headers,
              cookies, and third-party scripts — then explains the risk in
              plain English.
            </p>
          </div>

          {/* scan panel: wider than the headline — the main action */}
          <div
            className="anim-rise mx-auto mt-10 w-full max-w-4xl"
            style={{ animationDelay: '0.55s' }}
          >
            <BracketPanel className="p-6 text-left sm:p-8">
              <div className="mb-5">
                <MetadataLabel className="!text-[0.8rem] !tracking-[0.16em] !text-[color:var(--text)]">
                  Run a scan
                </MetadataLabel>
              </div>
              <ScanInput autoFocus />
              <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-2 border-t border-[color:var(--border)] pt-4">
                {checkLabels.map((label) => (
                  <span
                    key={label}
                    className="meta-label-plain flex items-center gap-2"
                  >
                    <span
                      aria-hidden="true"
                      className="block h-1.5 w-1.5 bg-[color:var(--accent)]"
                    />
                    {label}
                  </span>
                ))}
              </div>
            </BracketPanel>

            <div className="mt-6 text-center">
              <Link
                href="/sample-report"
                className="link-underline font-[family-name:var(--font-mono)] text-[0.78rem] uppercase tracking-[0.12em] text-[color:var(--text-muted)]"
              >
                See what a report looks like
                <ArrowRight
                  aria-hidden="true"
                  size={12}
                  className="ml-1.5 inline"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FILELOCKER CROSS-PROMO ============ */}
      <section className="section-rule mt-16">
        <div className="sheet py-8">
          <a
            href="https://github.com/AspectOV/FileLocker"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[color:var(--border)] text-[color:var(--accent)]">
                <FolderLock aria-hidden="true" size={15} />
              </span>
              <p className="copy-sm">
                <span className="text-[color:var(--text)]">
                  Need to check a file instead?
                </span>{' '}
                Use FileLocker to encrypt, hash, and verify local files.
              </p>
            </div>
            <span className="meta-label-plain flex items-center gap-1.5 transition-colors duration-200 group-hover:text-[color:var(--accent)]">
              Get FileLocker
              <ArrowUpRight aria-hidden="true" size={12} />
            </span>
          </a>
        </div>
      </section>
    </div>
  )
}
