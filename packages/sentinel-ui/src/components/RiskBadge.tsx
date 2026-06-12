import React from 'react'
import type { Severity } from '@sentinel/core'
import { cn } from '../cn'

const severityLabel: Record<Severity, string> = {
  ok: 'Pass',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

/* Severity-colored badge. The ONLY place warning/danger/success colors
   appear — scan-result contexts. */
export const RiskBadge: React.FC<{
  severity: Severity
  label?: string
  className?: string
}> = ({ severity, label, className }) => (
  <span className={cn(`risk-badge sev-${severity}`, className)}>
    {label ?? severityLabel[severity]}
  </span>
)
