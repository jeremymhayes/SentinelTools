export type Severity = 'ok' | 'low' | 'medium' | 'high' | 'critical'

export interface Finding {
  id: string
  severity: Severity
  title: string
  category: string
  summary: string
}

export interface RedirectHop {
  url: string
  status: number
  protocol: 'https' | 'http'
  note?: string
}

export interface HeaderCheck {
  header: string
  present: boolean
  value?: string
  severity: Severity
  note: string
}

export interface CookieFinding {
  name: string
  domain: string
  kind: 'first-party' | 'third-party'
  flags: string[]
  /* failed attribute checks, e.g. "No SameSite", "Missing Secure" */
  issues: string[]
  severity: Severity
}

export interface ScriptFinding {
  host: string
  purpose: string
  severity: Severity
}

export interface Recommendation {
  title: string
  body: string
  snippet?: string
  snippetLabel?: string
  /* per-platform fix examples rendered as extra code windows */
  platformSnippets?: Array<{ label: string; code: string }>
}

export interface ScoreDeduction {
  label: string
  delta: number
}

export interface ScanReport {
  url: string
  scannedAt: string
  scanId: string
  durationMs: number
  score: number
  /* category label: Strong / Good / Caution / Risky / High Risk */
  grade: string
  verdict: Severity
  summary: string
  scoreBreakdown: ScoreDeduction[]
  severityCounts: Record<Severity, number>
  findings: Finding[]
  redirects: RedirectHop[]
  headers: HeaderCheck[]
  cookies: CookieFinding[]
  scripts: ScriptFinding[]
  recommendations: Recommendation[]
}

export type ScanResult =
  | { ok: true; report: ScanReport }
  | { ok: false; error: string }
