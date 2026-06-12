import { randomBytes } from 'node:crypto'
import { followChain } from './fetchChain'
import {
  analyzeCookies,
  analyzeHeaders,
  analyzeScripts,
  buildAnalysis,
} from './analyze'
import { normalizeScanUrl } from './normalize'
import type { ScanResult } from './types'

export type { ScanReport, ScanResult, Severity } from './types'

function formatScannedAt(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`
}

export async function runScan(rawUrl: string): Promise<ScanResult> {
  const started = Date.now()
  const now = new Date()

  try {
    const requestedUrl = normalizeScanUrl(rawUrl)
    const chain = await followChain(requestedUrl.toString())

    const headerChecks = analyzeHeaders(chain.finalHeaders)
    const cookies = analyzeCookies(chain.setCookies, chain.finalUrl.hostname)
    const scripts = analyzeScripts(chain.html, chain.finalUrl.hostname)
    const analysis = buildAnalysis(
      chain,
      headerChecks,
      cookies,
      scripts,
      requestedUrl
    )

    const pad = (n: number) => String(n).padStart(2, '0')
    const scanId = `LS-${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(
      now.getUTCDate()
    )}-${randomBytes(2).toString('hex').toUpperCase()}`

    return {
      ok: true,
      report: {
        url: requestedUrl.toString(),
        scannedAt: formatScannedAt(now),
        scanId,
        durationMs: Date.now() - started,
        score: analysis.score,
        grade: analysis.grade,
        verdict: analysis.verdict,
        summary: analysis.summary,
        scoreBreakdown: analysis.scoreBreakdown,
        severityCounts: analysis.severityCounts,
        findings: analysis.findings,
        redirects: chain.hops,
        headers: headerChecks,
        cookies,
        scripts,
        recommendations: analysis.recommendations,
      },
    }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'The scan failed for an unknown reason.',
    }
  }
}
