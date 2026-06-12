import type {
  Finding,
  GradeLabel,
  ScoreResult,
  Severity,
} from './types'

/** Points subtracted from 100 per finding, by severity. */
export const SEVERITY_PENALTY: Record<Severity, number> = {
  ok: 0,
  low: 3,
  medium: 7,
  high: 14,
  critical: 25,
}

const SEVERITY_RANK: Record<Severity, number> = {
  ok: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
}

export function gradeForScore(score: number): GradeLabel {
  if (score >= 90) return 'Strong'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Caution'
  if (score >= 30) return 'Risky'
  return 'High Risk'
}

/**
 * Score a set of findings. Starts at 100, subtracts a penalty per
 * non-passing finding, clamps to 0, and returns an explainable breakdown.
 */
export function scoreFindings(findings: Finding[]): ScoreResult {
  const severityCounts: Record<Severity, number> = {
    ok: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  }

  const breakdown: ScoreResult['breakdown'] = []
  let score = 100
  let verdict: Severity = 'ok'

  for (const finding of findings) {
    severityCounts[finding.severity] += 1
    if (SEVERITY_RANK[finding.severity] > SEVERITY_RANK[verdict]) {
      verdict = finding.severity
    }
    const penalty = SEVERITY_PENALTY[finding.severity]
    if (penalty > 0) {
      score -= penalty
      breakdown.push({ label: finding.title, delta: -penalty })
    }
  }

  score = Math.max(0, score)
  return {
    score,
    grade: gradeForScore(score),
    verdict,
    breakdown,
    severityCounts,
  }
}
