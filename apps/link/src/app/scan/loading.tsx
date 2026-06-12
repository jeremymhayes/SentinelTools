import React from 'react'
import { BracketPanel, MetadataLabel } from '@sentinel/ui'

export default function ScanLoading() {
  return (
    <section className="section-block">
      <div className="sheet max-w-3xl">
        <div className="anim-fade flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border)] pb-4">
          <MetadataLabel>Scan in progress</MetadataLabel>
          <MetadataLabel plain>Tracing redirects · reading headers</MetadataLabel>
        </div>

        <BracketPanel className="scan-sweep mt-10 p-8 sm:p-10">
          <p className="caret-blink font-[family-name:var(--font-mono)] text-base text-[color:var(--text)]">
            Scanning target
          </p>
          <div className="mt-8 grid gap-3">
            {[
              'Following redirect chain',
              'Grading security headers',
              'Inventorying cookies',
              'Extracting third-party scripts',
            ].map((step, i) => (
              <p
                key={step}
                className="anim-rise meta-label-plain"
                style={{ animationDelay: `${0.3 + i * 0.5}s` }}
              >
                {String(i + 1).padStart(2, '0')} — {step}
              </p>
            ))}
          </div>
        </BracketPanel>
      </div>
    </section>
  )
}
