import { scoreFindings, type Finding, type ScoreResult } from '@sentinel/core'
import {
  fetchFileContent,
  fetchRepoMetadata,
  fetchRepoTree,
  type RepoMetadata,
  type TreeEntry,
} from './github'
import { scanForSecrets } from './secrets'
import type { RepoRef } from './normalize'

export interface RepoReport {
  meta: RepoMetadata
  findings: Finding[]
  score: ScoreResult
  summary: string
  scannedAt: string
  treeTruncated: boolean
  fileCount: number
}

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

interface CommunityFile {
  label: string
  matcher: RegExp
  severity: 'low' | 'medium'
  why: string
  fix: string
}

const COMMUNITY_FILES: CommunityFile[] = [
  {
    label: 'README',
    matcher: /^readme(\.|$)/i,
    severity: 'medium',
    why: 'Without a README, users cannot tell what the project does or how to use it — a basic trust and usability signal.',
    fix: 'Add a README.md describing purpose, installation, and usage.',
  },
  {
    label: 'LICENSE',
    matcher: /^(license|licence|copying)(\.|$)/i,
    severity: 'medium',
    why: 'No license means all rights reserved by default. Users legally cannot reuse, modify, or distribute the code.',
    fix: 'Add a LICENSE file (MIT, Apache-2.0, and GPL-3.0 are common choices).',
  },
  {
    label: 'SECURITY policy',
    matcher: /^(\.github\/)?security(\.|$)/i,
    severity: 'low',
    why: 'Without SECURITY.md, researchers have no sanctioned way to report vulnerabilities privately.',
    fix: 'Add SECURITY.md with a contact route for vulnerability reports.',
  },
  {
    label: 'CONTRIBUTING guide',
    matcher: /^(\.github\/)?contributing(\.|$)/i,
    severity: 'low',
    why: 'Contributors have no documented process for proposing changes.',
    fix: 'Add CONTRIBUTING.md describing how to file issues and open pull requests.',
  },
  {
    label: 'Code of conduct',
    matcher: /^(\.github\/)?code[-_]of[-_]conduct(\.|$)/i,
    severity: 'low',
    why: 'Community standards are undefined, which can deter contributors.',
    fix: 'Add CODE_OF_CONDUCT.md (the Contributor Covenant is a common base).',
  },
  {
    label: 'Dependabot config',
    matcher: /^\.github\/dependabot\.ya?ml$/i,
    severity: 'low',
    why: 'Dependencies will not receive automated update PRs, so known-vulnerable versions linger.',
    fix: 'Add .github/dependabot.yml to enable automated dependency updates.',
  },
  {
    label: 'CI workflows',
    matcher: /^\.github\/workflows\/.+/i,
    severity: 'low',
    why: 'No GitHub Actions workflows found — changes are likely untested before merge.',
    fix: 'Add a CI workflow under .github/workflows/ that runs tests on pull requests.',
  },
]

const PRIVATE_KEY_FILES =
  /(^|\/)(id_rsa|id_dsa|id_ecdsa|id_ed25519)$|\.(pem|p12|pfx|keystore|jks)$/i

const ENV_FILE = /(^|\/)\.env(\.[A-Za-z0-9_.-]+)?$/
const ENV_FILE_SAFE = /\.(example|sample|template|dist)$/i

const LOCKFILES = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'bun.lock',
]

function findingIdFactory() {
  let counter = 0
  return () => `F-${String(++counter).padStart(2, '0')}`
}

export async function analyzeRepo(ref: RepoRef): Promise<RepoReport> {
  const meta = await fetchRepoMetadata(ref.owner, ref.repo)
  const tree = await fetchRepoTree(ref.owner, ref.repo, meta.defaultBranch)
  const blobs = tree.entries.filter((entry) => entry.type === 'blob')
  const paths = blobs.map((entry) => entry.path)
  const nextId = findingIdFactory()
  const findings: Finding[] = []

  /* ---- metadata checks ---- */
  if (meta.archived) {
    findings.push({
      id: nextId(),
      severity: 'medium',
      title: 'Repository is archived',
      category: 'Metadata',
      summary:
        'Archived repositories are read-only and no longer maintained. Bugs and vulnerabilities will not be fixed.',
      recommendation:
        'Prefer an actively maintained fork or alternative if you depend on this code.',
    })
  }

  if (!meta.description) {
    findings.push({
      id: nextId(),
      severity: 'low',
      title: 'No repository description',
      category: 'Metadata',
      summary:
        'The repository has no description, making its purpose harder to evaluate at a glance.',
      recommendation: 'Add a one-line description in the repository settings.',
    })
  } else {
    findings.push({
      id: nextId(),
      severity: 'ok',
      title: 'Description present',
      category: 'Metadata',
      summary: 'The repository has a description.',
    })
  }

  if (!meta.license) {
    findings.push({
      id: nextId(),
      severity: 'medium',
      title: 'No license detected',
      category: 'Metadata',
      summary:
        'GitHub reports no license for this repository. Without one, reuse rights are legally unclear.',
      recommendation: 'Add a LICENSE file so users know their rights.',
    })
  } else {
    findings.push({
      id: nextId(),
      severity: 'ok',
      title: `License: ${meta.license}`,
      category: 'Metadata',
      summary: 'A license is declared and recognized by GitHub.',
    })
  }

  const pushedAt = new Date(meta.pushedAt).getTime()
  if (Number.isFinite(pushedAt) && Date.now() - pushedAt > ONE_YEAR_MS) {
    findings.push({
      id: nextId(),
      severity: 'low',
      title: 'No pushes in over a year',
      category: 'Metadata',
      summary:
        'The last push was more than a year ago. The project may be unmaintained, so security issues may go unpatched.',
      recommendation:
        'Check open issues and forks to gauge whether the project is still alive.',
    })
  } else if (Number.isFinite(pushedAt)) {
    findings.push({
      id: nextId(),
      severity: 'ok',
      title: 'Recently active',
      category: 'Metadata',
      summary: 'The repository received pushes within the last year.',
    })
  }

  /* ---- community / hygiene file checks ---- */
  for (const file of COMMUNITY_FILES) {
    const present = paths.some((path) => file.matcher.test(path))
    if (present) {
      findings.push({
        id: nextId(),
        severity: 'ok',
        title: `${file.label} present`,
        category: 'Hygiene',
        summary: `${file.label} was found in the repository.`,
      })
    } else {
      findings.push({
        id: nextId(),
        severity: file.severity,
        title: `Missing ${file.label}`,
        category: 'Hygiene',
        summary: file.why,
        recommendation: file.fix,
      })
    }
  }

  /* ---- dependency manifest checks ---- */
  const manifests: string[] = []
  if (paths.includes('package.json')) manifests.push('package.json')
  if (paths.includes('requirements.txt')) manifests.push('requirements.txt')
  if (paths.includes('pyproject.toml')) manifests.push('pyproject.toml')
  if (paths.includes('Directory.Packages.props'))
    manifests.push('Directory.Packages.props')
  const csprojFiles = paths.filter((path) => path.endsWith('.csproj'))
  if (csprojFiles.length > 0) manifests.push(`${csprojFiles.length} .csproj`)

  if (manifests.length > 0) {
    findings.push({
      id: nextId(),
      severity: 'ok',
      title: 'Dependency manifests found',
      category: 'Dependencies',
      summary: `Detected: ${manifests.join(', ')}.`,
    })
  }

  if (paths.includes('package.json')) {
    const hasLockfile = LOCKFILES.some((lock) => paths.includes(lock))
    if (!hasLockfile) {
      findings.push({
        id: nextId(),
        severity: 'medium',
        title: 'package.json without a lockfile',
        category: 'Dependencies',
        summary:
          'Without a committed lockfile, installs are not reproducible and dependency versions can drift silently — including to compromised releases.',
        recommendation:
          'Commit package-lock.json (or yarn.lock / pnpm-lock.yaml) to pin the dependency tree.',
      })
    } else {
      findings.push({
        id: nextId(),
        severity: 'ok',
        title: 'Lockfile committed',
        category: 'Dependencies',
        summary: 'A JavaScript lockfile pins dependency versions.',
      })
    }

    const packageJsonText = await fetchFileContent(
      ref.owner,
      ref.repo,
      'package.json'
    )
    if (packageJsonText) {
      try {
        const pkg = JSON.parse(packageJsonText) as {
          scripts?: Record<string, string>
        }
        const riskyScriptNames = ['preinstall', 'install', 'postinstall'].filter(
          (name) => pkg.scripts?.[name]
        )
        if (riskyScriptNames.length > 0) {
          findings.push({
            id: nextId(),
            severity: 'medium',
            title: 'Install-time lifecycle scripts present',
            category: 'Risk indicators',
            summary:
              'Scripts that run automatically during `npm install` (' +
              riskyScriptNames.join(', ') +
              ') execute arbitrary code on every machine that installs this package. Legitimate uses exist, but this is also the main supply-chain attack vector.',
            recommendation:
              'Read these scripts in package.json before installing. Consider `npm install --ignore-scripts` for a first look.',
            evidence: `package.json — scripts: ${riskyScriptNames.join(', ')}`,
          })
        }
      } catch {
        // unparseable package.json — skip the script check silently
      }
    }
  }

  /* ---- risk indicator checks ---- */
  const envFiles = blobs.filter(
    (entry) => ENV_FILE.test(entry.path) && !ENV_FILE_SAFE.test(entry.path)
  )
  for (const envFile of envFiles.slice(0, 5)) {
    findings.push({
      id: nextId(),
      severity: 'high',
      title: 'Committed .env file',
      category: 'Risk indicators',
      summary:
        'Environment files typically hold credentials and configuration secrets. Committing one to a public repository exposes whatever it contains.',
      recommendation:
        'Remove the file, rotate any credentials it held, and add .env to .gitignore. Note: the values remain in git history until it is rewritten.',
      evidence: envFile.path,
    })
  }

  const keyFiles = blobs.filter((entry) => PRIVATE_KEY_FILES.test(entry.path))
  for (const keyFile of keyFiles.slice(0, 5)) {
    findings.push({
      id: nextId(),
      severity: 'critical',
      title: 'Possible private key file committed',
      category: 'Risk indicators',
      summary:
        'A file matching a private key naming pattern is in the repository. If it is a real private key, anyone can impersonate or decrypt whatever it protects.',
      recommendation:
        'Verify the file. If it is a real key, revoke and rotate it immediately, then purge it from git history.',
      evidence: keyFile.path,
    })
  }

  /* ---- content scan of small committed env files (masked output only) ---- */
  const scanTargets = envFiles
    .filter((entry) => (entry.size ?? 0) > 0 && (entry.size ?? 0) < 20_000)
    .slice(0, 3)
  for (const target of scanTargets) {
    const text = await fetchFileContent(ref.owner, ref.repo, target.path)
    if (!text) continue
    for (const hit of scanForSecrets(target.path, text).slice(0, 5)) {
      findings.push({
        id: nextId(),
        severity: 'critical',
        title: `Possible secret: ${hit.patternName}`,
        category: 'Risk indicators',
        summary:
          'A string matching a known credential pattern was found in a committed file. The value below is masked — RepoSentinel never displays real secrets.',
        recommendation:
          'Treat this credential as compromised: revoke and rotate it now, then remove it from git history.',
        evidence: `${hit.path}:${hit.line} — ${hit.maskedPreview}`,
      })
    }
  }

  if (envFiles.length === 0 && keyFiles.length === 0) {
    findings.push({
      id: nextId(),
      severity: 'ok',
      title: 'No committed .env or key files',
      category: 'Risk indicators',
      summary:
        'No environment files or private-key-named files were found in the default branch tree.',
    })
  }

  const score = scoreFindings(findings)
  const issueCount = findings.filter((f) => f.severity !== 'ok').length

  const summary =
    issueCount === 0
      ? 'No obvious issues detected by these checks. That is not a guarantee of safety — these checks only cover repository metadata, hygiene files, dependency manifests, and common risk indicators on the default branch.'
      : `These checks surfaced ${issueCount} item${issueCount === 1 ? '' : 's'} worth reviewing across metadata, hygiene files, dependencies, and risk indicators. ` +
        (score.severityCounts.critical > 0 || score.severityCounts.high > 0
          ? 'At least one finding involves potentially exposed credentials or unmaintained-project risk — review those first.'
          : 'Nothing here indicates active malice; the findings are mostly hygiene and reproducibility gaps.') +
        ' This report covers only what these checks can see on the default branch.'

  return {
    meta,
    findings,
    score,
    summary,
    scannedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    treeTruncated: tree.truncated,
    fileCount: blobs.length,
  }
}
