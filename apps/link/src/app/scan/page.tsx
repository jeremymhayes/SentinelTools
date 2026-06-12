import React from 'react'
import type { Metadata } from 'next'
import { Download, Link2, Share2 } from 'lucide-react'
import {
  BracketPanel,
  MetadataLabel,
  SectionEyebrow,
  TechnicalPanel,
} from '@sentinel/ui'
import { ScanInput } from '@/components/scan/ScanInput'
import { ScoreBlock } from '@sentinel/ui'
import { RiskBadge } from '@sentinel/ui'
import { FindingRow } from '@sentinel/ui'
import { RedirectChain } from '@/components/scan/RedirectChain'
import { HeaderCheckTable } from '@/components/scan/HeaderCheckTable'
import { RecommendationBlock } from '@/components/scan/RecommendationBlock'
import { EmptyState } from '@sentinel/ui'
import { demoReport } from '@/lib/demoScan'
import { runScan } from '@/lib/scanner'

export const metadata: Metadata = {
  title: 'Scan report',
}

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>
}) {
  const { url } = await searchParams
  const isSample = !url
  const result = url ? await runScan(url) : { ok: true as const, report: demoReport }

  if (!result.ok) {
    return (
      <section className="section-block">
        <div className="sheet max-w-2xl">
          <EmptyState
            title="Scan failed"
            detail={result.error}
            action={<ScanInput className="w-full min-w-[20rem]" autoFocus />}
          />
        </div>
      </section>
    )
  }

  const report = result.report

  return (
    <div>
      {/* ============ REPORT HEAD ============ */}
      <section className="section-block-tight">
        <div className="sheet-wide">
          <div className="anim-fade flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border)] pb-4">
            <MetadataLabel>
              {isSample ? 'Sample report — demo data' : `Scan report — ${report.scanId}`}
            </MetadataLabel>
            <MetadataLabel plain>
              {report.scannedAt} · {(report.durationMs / 1000).toFixed(1)}s ·{' '}
              {report.findings.length} findings
            </MetadataLabel>
          </div>

          <div className="anim-rise mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-4" style={{ animationDelay: '0.1s' }}>
            <div className="flex min-w-0 items-center gap-3">
              <Link2
                aria-hidden="true"
                size={16}
                className="shrink-0 text-[color:var(--text-soft)]"
              />
              <h1 className="truncate font-[family-name:var(--font-mono)] text-base text-[color:var(--text)] sm:text-lg">
                {report.url}
              </h1>
            </div>
            <div className="flex items-center gap-2.5">
              {/* share/export placeholders — wire to API later */}
              <button type="button" className="button button-secondary min-h-0 px-3.5 py-2 text-[0.74rem]">
                <Share2 aria-hidden="true" size={13} />
                Share
              </button>
              <button type="button" className="button button-secondary min-h-0 px-3.5 py-2 text-[0.74rem]">
                <Download aria-hidden="true" size={13} />
                Export PDF
              </button>
            </div>
          </div>

          <BracketPanel className="anim-rise mt-8" >
            <ScoreBlock
              score={report.score}
              grade={report.grade}
              verdict={report.verdict}
              counts={report.severityCounts}
            />
            <div className="grid border-t border-[color:var(--border)] md:grid-cols-[1.4fr_1fr]">
              <div className="px-6 py-5 sm:px-8">
                <MetadataLabel plain>Plain-English summary</MetadataLabel>
                <p className="copy-sm mt-2 max-w-3xl text-[0.98rem]">
                  {report.summary}
                </p>
              </div>
              {/* score ledger: every deduction visible, no mystery number */}
              <div className="border-t border-[color:var(--border)] px-6 py-5 sm:px-8 md:border-l md:border-t-0">
                <MetadataLabel plain>How the score was computed</MetadataLabel>
                <dl className="mt-3 font-[family-name:var(--font-mono)] text-[0.78rem]">
                  <div className="flex items-baseline justify-between gap-4 py-1">
                    <dt className="text-[color:var(--text-muted)]">
                      Base score
                    </dt>
                    <dd className="text-[color:var(--text)]">100</dd>
                  </div>
                  {report.scoreBreakdown.map((deduction) => (
                    <div
                      key={deduction.label}
                      className="flex items-baseline justify-between gap-4 border-t border-[color:var(--border)] py-1"
                    >
                      <dt className="truncate text-[color:var(--text-muted)]">
                        {deduction.label}
                      </dt>
                      <dd className="sev-medium shrink-0 text-[color:var(--sev)]">
                        {deduction.delta}
                      </dd>
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between gap-4 border-t border-[color:var(--border-strong)] py-1">
                    <dt className="text-[color:var(--text)]">Final score</dt>
                    <dd className="text-[color:var(--accent)]">
                      {report.score}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </BracketPanel>
        </div>
      </section>

      {/* ============ FINDINGS ============ */}
      <section className="section-block-tight">
        <div className="sheet-wide grid gap-6">
          <TechnicalPanel
            title="Findings"
            meta={`${report.findings.length} items · sorted by severity`}
            className="reveal"
          >
            {report.findings.length > 0 ? (
              report.findings.map((finding) => (
                <FindingRow key={finding.id} finding={finding} />
              ))
            ) : (
              <p className="copy-sm">
                No issues found. Every check this scanner runs came back clean.
              </p>
            )}
          </TechnicalPanel>

          <div className="grid gap-6 lg:grid-cols-2">
            <TechnicalPanel
              title="Redirect chain"
              meta={`${report.redirects.length} hops`}
              className="reveal"
            >
              <RedirectChain hops={report.redirects} />
            </TechnicalPanel>

            <TechnicalPanel
              title="Cookies / privacy"
              meta={`${report.cookies.length} set on load`}
              className="reveal"
            >
              <div>
                {report.cookies.length === 0 ? (
                  <p className="copy-sm">
                    No cookies were set during page load.
                  </p>
                ) : null}
                {report.cookies.map((cookie) => (
                  <div
                    key={cookie.name + cookie.domain}
                    className="grid gap-1.5 border-t border-[color:var(--border)] py-3.5 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <code className="font-[family-name:var(--font-mono)] text-[0.85rem] text-[color:var(--text)]">
                          {cookie.name}
                        </code>
                        <span className="meta-label-plain">
                          {cookie.domain} · {cookie.kind}
                        </span>
                      </div>
                      <p className="mt-1 flex flex-wrap gap-1.5">
                        {cookie.flags.map((flag) => (
                          <span key={flag} className="chip">
                            {flag}
                          </span>
                        ))}
                        {cookie.issues.map((issue) => (
                          <span
                            key={issue}
                            className="chip sev-medium !border-[color:color-mix(in_oklab,var(--sev)_45%,transparent)] !text-[color:var(--sev)]"
                          >
                            {issue}
                          </span>
                        ))}
                      </p>
                    </div>
                    <RiskBadge severity={cookie.severity} />
                  </div>
                ))}
              </div>
            </TechnicalPanel>
          </div>

          <TechnicalPanel
            title="Security headers"
            meta="graded against OWASP secure headers project"
            className="reveal"
          >
            <HeaderCheckTable checks={report.headers} />
          </TechnicalPanel>

          <TechnicalPanel
            title="Third-party scripts"
            meta={`${report.scripts.length} external hosts`}
            className="reveal"
          >
            <div>
              {report.scripts.length === 0 ? (
                <p className="copy-sm">
                  No external scripts detected in the page source.
                </p>
              ) : null}
              {report.scripts.map((script) => (
                <div
                  key={script.host}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--border)] py-3.5 first:border-t-0 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <code className="font-[family-name:var(--font-mono)] text-[0.85rem] text-[color:var(--text)]">
                      {script.host}
                    </code>
                    <p className="meta-label-plain mt-1">{script.purpose}</p>
                  </div>
                  <RiskBadge severity={script.severity} />
                </div>
              ))}
              <p className="copy-sm mt-5 border-t border-[color:var(--border)] pt-4 text-[0.85rem]">
                Third-party scripts are external code loaded by the page. They
                are not automatically bad, but each one can read page content
                and affect privacy and security.
              </p>
            </div>
          </TechnicalPanel>
        </div>
      </section>

      {/* ============ RECOMMENDATIONS ============ */}
      <section className="section-band section-block">
        <div className="sheet">
          <SectionEyebrow
            label="Fix guidance"
            title="Close the gaps"
            index="→"
          >
            Ordered by impact. Each fix includes the exact value to ship.
          </SectionEyebrow>

          <div className="reveal mt-10">
            {report.recommendations.length > 0 ? (
              report.recommendations.map((rec, i) => (
                <RecommendationBlock key={rec.title} recommendation={rec} index={i} />
              ))
            ) : (
              <p className="copy-sm">
                Nothing to fix from this scan — the destination already follows
                the practices this scanner checks for.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ============ RE-SCAN ============ */}
      <section className="section-block-tight">
        <div className="sheet">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <MetadataLabel>Run another scan</MetadataLabel>
            <ScanInput size="compact" className="max-w-xl flex-1" />
          </div>
        </div>
      </section>
    </div>
  )
}
