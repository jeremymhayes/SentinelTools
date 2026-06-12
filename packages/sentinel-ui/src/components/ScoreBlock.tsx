import React from 'react'
import type { Severity } from '@sentinel/core'
import { RiskBadge } from './RiskBadge'
import { MetadataLabel } from './Primitives'

const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low', 'ok']

const severityName: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  ok: 'Passed',
}

/* Overall risk readout: oversized serif numeral, grade, verdict badge,
   and a segmented severity breakdown bar. */
export const ScoreBlock: React.FC<{
  score: number
  grade: string
  verdict: Severity
  counts: Record<Severity, number>
}> = ({ score, grade, verdict, counts }) => {
  const total = severityOrder.reduce((sum, sev) => sum + counts[sev], 0)

  return (
    <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[auto_1fr] md:items-end">
      <div className="flex items-end gap-5">
        <span className="font-[family-name:var(--font-display)] text-[clamp(4.5rem,10vw,8rem)] font-semibold leading-[0.8] tracking-[-0.03em]">
          {score}
        </span>
        <div className="flex flex-col gap-2 pb-2">
          <MetadataLabel plain>
            {grade} · {score}/100
          </MetadataLabel>
          <RiskBadge
            severity={verdict}
            label={verdict === 'ok' ? 'No findings' : `${severityName[verdict]} risk`}
          />
        </div>
      </div>

      <div>
        <div
          className="flex h-2 w-full overflow-hidden border border-[color:var(--border)]"
          role="img"
          aria-label={`Severity breakdown of ${total} checks`}
        >
          {severityOrder.map((sev) =>
            counts[sev] > 0 ? (
              <span
                key={sev}
                className={`sev-${sev} block h-full bg-[color:var(--sev)]`}
                style={{ width: `${(counts[sev] / total) * 100}%` }}
              />
            ) : null
          )}
        </div>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {severityOrder.map((sev) => (
            <div key={sev} className={`sev-${sev} flex items-baseline gap-2`}>
              <dt className="meta-label-plain flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="block h-1.5 w-1.5 bg-[color:var(--sev)]"
                />
                {severityName[sev]}
              </dt>
              <dd className="font-[family-name:var(--font-mono)] text-sm text-[color:var(--text)]">
                {counts[sev]}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
