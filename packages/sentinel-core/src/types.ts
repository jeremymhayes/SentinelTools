/** Severity ramp shared by every Sentinel tool. `ok` means the check passed. */
export type Severity = 'ok' | 'low' | 'medium' | 'high' | 'critical'

/** One result line in a report: what was checked, what was found, what to do. */
export interface Finding {
  id: string
  severity: Severity
  title: string
  category: string
  /** Plain-English explanation of why this matters. */
  summary: string
  /** Plain-English fix guidance. Omit for passed checks. */
  recommendation?: string
  /** Optional evidence (path, line, masked preview). Never raw secrets. */
  evidence?: string
}

export interface ScoreBreakdownEntry {
  label: string
  delta: number
}

export type GradeLabel = 'Strong' | 'Good' | 'Caution' | 'Risky' | 'High Risk'

export interface ScoreResult {
  /** 0–100, starts at 100 and loses points per finding. */
  score: number
  grade: GradeLabel
  /** Worst severity present — drives the verdict badge. */
  verdict: Severity
  breakdown: ScoreBreakdownEntry[]
  severityCounts: Record<Severity, number>
}
