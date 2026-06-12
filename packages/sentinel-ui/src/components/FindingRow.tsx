import React from 'react'
import type { Finding } from '@sentinel/core'
import { RiskBadge } from './RiskBadge'

/* One finding: hairline-ruled row, mono index, severity badge,
   optional masked evidence line. Reads like a drafting-sheet line item. */
export const FindingRow: React.FC<{ finding: Finding }> = ({ finding }) => (
  <div className="group grid gap-3 border-t border-[color:var(--border)] py-5 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[3.5rem_1fr_auto] sm:gap-6">
    <span className="font-[family-name:var(--font-mono)] text-xs tracking-[0.1em] text-[color:var(--accent)]">
      {finding.id}
    </span>
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h4 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-[-0.01em]">
          {finding.title}
        </h4>
        <span className="meta-label-plain">{finding.category}</span>
      </div>
      <p className="copy-sm mt-1.5 max-w-2xl">{finding.summary}</p>
      {finding.evidence ? (
        <p className="mt-2 max-w-2xl overflow-x-auto border border-[color:var(--border)] px-3 py-2 font-[family-name:var(--font-mono)] text-[0.75rem] text-[color:var(--text-soft)]">
          {finding.evidence}
        </p>
      ) : null}
      {finding.recommendation ? (
        <p className="copy-sm mt-2 max-w-2xl">
          <span className="meta-label-plain mr-2">Fix</span>
          {finding.recommendation}
        </p>
      ) : null}
    </div>
    <div className="sm:pt-0.5">
      <RiskBadge severity={finding.severity} />
    </div>
  </div>
)
