const API = 'https://api.github.com'

export interface RepoMetadata {
  name: string
  fullName: string
  owner: string
  description: string | null
  language: string | null
  stars: number
  forks: number
  openIssues: number
  pushedAt: string
  defaultBranch: string
  license: string | null
  archived: boolean
  fork: boolean
  size: number
}

export interface TreeEntry {
  path: string
  type: 'blob' | 'tree' | 'commit'
  size?: number
}

export interface RepoTree {
  entries: TreeEntry[]
  truncated: boolean
}

function headers(): HeadersInit {
  const base: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'RepoSentinel/0.1 (read-only repository health scanner)',
  }
  if (process.env.GITHUB_TOKEN) {
    base.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return base
}

async function ghFetch(path: string): Promise<Response> {
  return fetch(`${API}${path}`, {
    headers: headers(),
    // Reports should reflect the repo as it is right now.
    cache: 'no-store',
  })
}

export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
  }
}

export async function fetchRepoMetadata(
  owner: string,
  repo: string
): Promise<RepoMetadata> {
  const res = await ghFetch(`/repos/${owner}/${repo}`)
  if (res.status === 404) {
    throw new GitHubError(
      'Repository not found. It may be private, renamed, or misspelled — RepoSentinel can only read public repositories.',
      404
    )
  }
  if (res.status === 403 || res.status === 429) {
    throw new GitHubError(
      'GitHub API rate limit reached. Wait a few minutes and try again, or set a GITHUB_TOKEN environment variable for a higher limit.',
      res.status
    )
  }
  if (!res.ok) {
    throw new GitHubError(`GitHub API error (HTTP ${res.status}).`, res.status)
  }
  const data = await res.json()
  return {
    name: data.name,
    fullName: data.full_name,
    owner: data.owner?.login ?? owner,
    description: data.description,
    language: data.language,
    stars: data.stargazers_count ?? 0,
    forks: data.forks_count ?? 0,
    openIssues: data.open_issues_count ?? 0,
    pushedAt: data.pushed_at,
    defaultBranch: data.default_branch ?? 'main',
    license: data.license?.spdx_id && data.license.spdx_id !== 'NOASSERTION'
      ? data.license.spdx_id
      : data.license?.name ?? null,
    archived: Boolean(data.archived),
    fork: Boolean(data.fork),
    size: data.size ?? 0,
  }
}

/** Single recursive-tree request — file list without cloning anything. */
export async function fetchRepoTree(
  owner: string,
  repo: string,
  branch: string
): Promise<RepoTree> {
  const res = await ghFetch(
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`
  )
  if (!res.ok) {
    // Empty repos return 404/409 here; report an empty tree rather than fail.
    return { entries: [], truncated: false }
  }
  const data = await res.json()
  return {
    entries: (data.tree ?? []).map((entry: TreeEntry) => ({
      path: entry.path,
      type: entry.type,
      size: entry.size,
    })),
    truncated: Boolean(data.truncated),
  }
}

const MAX_CONTENT_BYTES = 100_000

/**
 * Fetch one small file's text content via the contents API.
 * Returns null when missing, too large, or not a file.
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  const res = await ghFetch(
    `/repos/${owner}/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`
  )
  if (!res.ok) return null
  const data = await res.json()
  if (data.type !== 'file' || typeof data.content !== 'string') return null
  if ((data.size ?? 0) > MAX_CONTENT_BYTES) return null
  try {
    return Buffer.from(data.content, 'base64').toString('utf8')
  } catch {
    return null
  }
}
