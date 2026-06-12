import React from 'react'
import type { HeaderCheck } from '@/lib/demoScan'
import { RiskBadge } from '@sentinel/ui'

/* Hairline-ruled table of security headers. Grid, not <table>, so rows
   can stack cleanly on mobile. */
export const HeaderCheckTable: React.FC<{ checks: HeaderCheck[] }> = ({
  checks,
}) => (
  <div role="table" aria-label="Security header checks">
    <div
      role="row"
      className="hidden border-b border-[color:var(--border)] pb-2.5 md:grid md:grid-cols-[15rem_1fr_auto] md:gap-6"
    >
      <span role="columnheader" className="meta-label-plain">
        Header
      </span>
      <span role="columnheader" className="meta-label-plain">
        Observed / Note
      </span>
      <span role="columnheader" className="meta-label-plain">
        Result
      </span>
    </div>

    {checks.map((check) => (
      <div
        key={check.header}
        role="row"
        className="grid gap-2 border-b border-[color:var(--border)] py-4 last:border-b-0 last:pb-0 md:grid-cols-[15rem_1fr_auto] md:gap-6"
      >
        <code
          role="cell"
          className="font-[family-name:var(--font-mono)] text-[0.82rem] text-[color:var(--text)]"
        >
          {check.header}
        </code>
        <div role="cell" className="min-w-0">
          {check.value ? (
            <code className="block truncate font-[family-name:var(--font-mono)] text-[0.78rem] text-[color:var(--accent-muted)]">
              {check.value}
            </code>
          ) : null}
          <p className="copy-sm mt-0.5 text-[0.85rem]">{check.note}</p>
        </div>
        <div role="cell">
          <RiskBadge
            severity={check.severity}
            label={check.present ? undefined : 'Missing'}
          />
        </div>
      </div>
    ))}
  </div>
)
