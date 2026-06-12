import React from 'react'
import {
  BracketPanel,
  FindingRow,
  MetadataLabel,
  ScoreBlock,
  TechnicalPanel,
} from '@sentinel/ui'
import type { RepoReport } from '@/lib/analyze'
import { RepoScanInput } from './RepoScanInput'

function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isFinite(date.getTime())
    ? date.toISOString().slice(0, 10)
    : '—'
}

const LIMITATIONS = [
  'Only the default branch is inspected — other branches, tags, and git history are not scanned. A secret removed from the latest commit may still exist in history.',
  'Checks cover repository metadata, hygiene files, dependency manifests, and common risk-indicator filenames. The code itself is not reviewed, executed, or audited.',
  'Dependencies are detected, not vulnerability-scanned. A committed lockfile says nothing about whether the pinned versions have known CVEs.',
  'Secret detection is pattern-based on a handful of small committed files; it cannot find every credential and never inspects files over 20 KB.',
  'A high score means these checks found little — it is not a statement that the project is trustworthy, maintained, or free of malicious code.',
]

/* Full report layout, shared by the live /report route and /sample-report. */
export const RepoReportView: React.FC<{
  report: RepoReport
  sample?: boolean
}> = ({ report, sample = false }) => {
  const { meta, findings, score, summary } = report
  const issues = findings.filter((finding) => finding.severity !== 'ok')
  const passed = findings.filter((finding) => finding.severity === 'ok')

  const metadataRows: Array<[string, React.ReactNode]> = [
    ['Repository', meta.fullName],
    ['Owner', meta.owner],
    ['Description', meta.description ?? '—'],
    ['Primary language', meta.language ?? '—'],
    ['Stars', meta.stars.toLocaleString()],
    ['Forks', meta.forks.toLocaleString()],
    ['Open issues', meta.openIssues.toLocaleString()],
    ['Last push', formatDate(meta.pushedAt)],
    ['Default branch', meta.defaultBranch],
    ['License', meta.license ?? 'None detected'],
    ['Files in tree', report.fileCount.toLocaleString()],
  ]

  return (
    <div className="sheet pt-6 sm:pt-10">
      {/* report head */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <MetadataLabel>
            {sample ? 'Sample report — static demo data' : 'Repository report'}
          </MetadataLabel>
          <h1 className="display-title mt-4 break-all">{meta.fullName}</h1>
          <p className="meta-label-plain mt-3">
            {sample ? 'Example output · no API request made' : `Scanned ${report.scannedAt}`}{' '}
            · read-only · default branch {meta.defaultBranch}
          </p>
        </div>
        <div className="w-full max-w-md">
          <RepoScanInput />
        </div>
      </div>

      {/* score */}
      <BracketPanel className="mt-10">
        <ScoreBlock
          score={score.score}
          grade={score.grade}
          verdict={score.verdict}
          counts={score.severityCounts}
        />
      </BracketPanel>

      {/* summary */}
      <TechnicalPanel title="Plain-English summary" className="mt-6">
        <p className="copy-sm max-w-3xl">{summary}</p>
        {report.treeTruncated ? (
          <p className="meta-label-plain mt-4">
            Note: this repository&rsquo;s file tree is very large and was
            truncated by the GitHub API — file checks cover a partial listing.
          </p>
        ) : null}
      </TechnicalPanel>

      {/* score breakdown */}
      {score.breakdown.length > 0 ? (
        <TechnicalPanel
          title="Score breakdown"
          meta="100 − penalties"
          className="mt-6"
        >
          <ul>
            {score.breakdown.map((entry, i) => (
              <li
                key={`${entry.label}-${i}`}
                className="flex items-baseline justify-between gap-4 border-t border-[color:var(--border)] py-2.5 first:border-t-0 first:pt-0 last:pb-0"
              >
                <span className="copy-sm">{entry.label}</span>
                <span className="font-[family-name:var(--font-mono)] text-sm text-[color:var(--critical)]">
                  {entry.delta}
                </span>
              </li>
            ))}
          </ul>
        </TechnicalPanel>
      ) : null}

      {/* metadata table */}
      <TechnicalPanel title="Repository metadata" className="mt-6">
        <dl className="grid gap-x-8 sm:grid-cols-2">
          {metadataRows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-4 border-t border-[color:var(--border)] py-2.5 first:border-t-0 sm:[&:nth-child(2)]:border-t-0"
            >
              <dt className="meta-label-plain shrink-0">{label}</dt>
              <dd className="break-all text-right font-[family-name:var(--font-mono)] text-[0.82rem] text-[color:var(--text)]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </TechnicalPanel>

      {/* findings */}
      <TechnicalPanel
        title="Findings"
        meta={`${issues.length} item${issues.length === 1 ? '' : 's'}`}
        className="mt-6"
      >
        {issues.length === 0 ? (
          <p className="copy-sm">
            No obvious issues detected by these checks.
          </p>
        ) : (
          issues.map((finding) => (
            <FindingRow key={finding.id} finding={finding} />
          ))
        )}
      </TechnicalPanel>

      {/* passed checks */}
      <TechnicalPanel
        title="Passed checks"
        meta={`${passed.length} item${passed.length === 1 ? '' : 's'}`}
        className="mt-6"
      >
        {passed.length === 0 ? (
          <p className="copy-sm">None of the checks passed cleanly.</p>
        ) : (
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {passed.map((finding) => (
              <li
                key={finding.id}
                className="sev-ok flex items-center gap-2.5 border-t border-[color:var(--border)] py-2.5 first:border-t-0 sm:[&:nth-child(2)]:border-t-0"
              >
                <span
                  aria-hidden="true"
                  className="block h-1.5 w-1.5 shrink-0 bg-[color:var(--sev)]"
                />
                <span className="copy-sm">{finding.title}</span>
              </li>
            ))}
          </ul>
        )}
      </TechnicalPanel>

      {/* limitations */}
      <TechnicalPanel
        title="Scan limitations"
        meta="read before trusting the score"
        className="mt-6"
      >
        <ul>
          {LIMITATIONS.map((limitation, i) => (
            <li
              key={i}
              className="flex gap-4 border-t border-[color:var(--border)] py-3 first:border-t-0 first:pt-0 last:pb-0"
            >
              <span className="font-[family-name:var(--font-mono)] text-xs tracking-[0.1em] text-[color:var(--accent)]">
                L-{String(i + 1).padStart(2, '0')}
              </span>
              <p className="copy-sm max-w-3xl">{limitation}</p>
            </li>
          ))}
        </ul>
      </TechnicalPanel>

      <p className="meta-label-plain mt-8 text-center">
        Read-only scan via the GitHub API. Nothing was cloned, installed, or
        executed. Secrets, if detected, are always masked.
      </p>
    </div>
  )
}
