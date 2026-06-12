import React from 'react'
import { BracketPanel, MetadataLabel } from '@sentinel/ui'
import { RepoScanInput } from '@/components/RepoScanInput'

const checkLabels = [
  'Metadata',
  'Hygiene files',
  'Dependencies',
  'Risk indicators',
]

export default function HomePage() {
  return (
    <div>
      <section className="pt-6 pb-16 sm:pt-10">
        <div className="sheet">
          <div className="mx-auto w-full max-w-3xl text-center">
            <h1 className="anim-mask-line display-title-xl">
              <span className="mask-line">
                <span className="block" style={{ animationDelay: '0.08s' }}>
                  Read a repo before
                </span>
              </span>
              <span className="mask-line">
                <span
                  className="display-em block"
                  style={{ animationDelay: '0.2s' }}
                >
                  you clone it.
                </span>
              </span>
            </h1>

            <p
              className="anim-rise lede mx-auto mt-5 max-w-xl"
              style={{ animationDelay: '0.4s' }}
            >
              Paste any public GitHub repository. RepoSentinel checks
              metadata, hygiene files, dependency manifests, and common risk
              indicators — read-only, nothing is cloned or executed.
            </p>
          </div>

          <div
            className="anim-rise mx-auto mt-10 w-full max-w-4xl"
            style={{ animationDelay: '0.55s' }}
          >
            <BracketPanel className="p-6 text-left sm:p-8">
              <div className="mb-5">
                <MetadataLabel className="!text-[0.8rem] !tracking-[0.16em] !text-[color:var(--text)]">
                  Scan a repository
                </MetadataLabel>
              </div>
              <RepoScanInput autoFocus />
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

            <p className="copy-sm mx-auto mt-6 max-w-xl text-center">
              Reports describe what these checks can see — they never declare
              a repository &ldquo;safe&rdquo;. Secrets found during scanning
              are always masked.
            </p>
            <div className="mt-4 text-center">
              <a
                href="/sample-report"
                className="link-underline font-[family-name:var(--font-mono)] text-[0.78rem] uppercase tracking-[0.12em] text-[color:var(--text-muted)]"
              >
                See what a report looks like →
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
