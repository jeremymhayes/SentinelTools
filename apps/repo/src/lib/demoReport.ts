import { scoreFindings, type Finding } from '@sentinel/core'
import type { RepoReport } from './analyze'

/**
 * Static demo data for /sample-report — lets the UI be previewed without
 * spending GitHub API requests. Modeled on a typical small open-source
 * project with mixed hygiene.
 */

const findings: Finding[] = [
  {
    id: 'F-01',
    severity: 'ok',
    title: 'Description present',
    category: 'Metadata',
    summary: 'The repository has a description.',
  },
  {
    id: 'F-02',
    severity: 'ok',
    title: 'License: MIT',
    category: 'Metadata',
    summary: 'A license is declared and recognized by GitHub.',
  },
  {
    id: 'F-03',
    severity: 'ok',
    title: 'Recently active',
    category: 'Metadata',
    summary: 'The repository received pushes within the last year.',
  },
  {
    id: 'F-04',
    severity: 'ok',
    title: 'README present',
    category: 'Hygiene',
    summary: 'README was found in the repository.',
  },
  {
    id: 'F-05',
    severity: 'ok',
    title: 'LICENSE present',
    category: 'Hygiene',
    summary: 'LICENSE was found in the repository.',
  },
  {
    id: 'F-06',
    severity: 'low',
    title: 'Missing SECURITY policy',
    category: 'Hygiene',
    summary:
      'Without SECURITY.md, researchers have no sanctioned way to report vulnerabilities privately.',
    recommendation: 'Add SECURITY.md with a contact route for vulnerability reports.',
  },
  {
    id: 'F-07',
    severity: 'low',
    title: 'Missing Dependabot config',
    category: 'Hygiene',
    summary:
      'Dependencies will not receive automated update PRs, so known-vulnerable versions linger.',
    recommendation: 'Add .github/dependabot.yml to enable automated dependency updates.',
  },
  {
    id: 'F-08',
    severity: 'ok',
    title: 'CI workflows present',
    category: 'Hygiene',
    summary: 'CI workflows was found in the repository.',
  },
  {
    id: 'F-09',
    severity: 'ok',
    title: 'Dependency manifests found',
    category: 'Dependencies',
    summary: 'Detected: package.json.',
  },
  {
    id: 'F-10',
    severity: 'medium',
    title: 'package.json without a lockfile',
    category: 'Dependencies',
    summary:
      'Without a committed lockfile, installs are not reproducible and dependency versions can drift silently — including to compromised releases.',
    recommendation:
      'Commit package-lock.json (or yarn.lock / pnpm-lock.yaml) to pin the dependency tree.',
  },
  {
    id: 'F-11',
    severity: 'medium',
    title: 'Install-time lifecycle scripts present',
    category: 'Risk indicators',
    summary:
      'Scripts that run automatically during `npm install` (postinstall) execute arbitrary code on every machine that installs this package. Legitimate uses exist, but this is also the main supply-chain attack vector.',
    recommendation:
      'Read these scripts in package.json before installing. Consider `npm install --ignore-scripts` for a first look.',
    evidence: 'package.json — scripts: postinstall',
  },
  {
    id: 'F-12',
    severity: 'critical',
    title: 'Possible secret: OpenAI-style API key',
    category: 'Risk indicators',
    summary:
      'A string matching a known credential pattern was found in a committed file. The value below is masked — RepoSentinel never displays real secrets.',
    recommendation:
      'Treat this credential as compromised: revoke and rotate it now, then remove it from git history.',
    evidence: 'examples/.env.backup:3 — sk-************************',
  },
  {
    id: 'F-13',
    severity: 'high',
    title: 'Committed .env file',
    category: 'Risk indicators',
    summary:
      'Environment files typically hold credentials and configuration secrets. Committing one to a public repository exposes whatever it contains.',
    recommendation:
      'Remove the file, rotate any credentials it held, and add .env to .gitignore. Note: the values remain in git history until it is rewritten.',
    evidence: 'examples/.env.backup',
  },
]

const score = scoreFindings(findings)

export const demoReport: RepoReport = {
  meta: {
    name: 'parcel-tracker',
    fullName: 'acme-oss/parcel-tracker',
    owner: 'acme-oss',
    description: 'Self-hosted parcel tracking dashboard with carrier webhooks.',
    language: 'TypeScript',
    stars: 1284,
    forks: 96,
    openIssues: 23,
    pushedAt: '2026-05-28T09:14:00Z',
    defaultBranch: 'main',
    license: 'MIT',
    archived: false,
    fork: false,
    size: 4821,
  },
  findings,
  score,
  summary:
    'These checks surfaced 5 items worth reviewing across metadata, hygiene files, dependencies, and risk indicators. At least one finding involves potentially exposed credentials or unmaintained-project risk — review those first. This report covers only what these checks can see on the default branch.',
  scannedAt: '2026-06-11 12:00 UTC',
  treeTruncated: false,
  fileCount: 412,
}
