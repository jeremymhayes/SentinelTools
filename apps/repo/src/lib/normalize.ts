export interface RepoRef {
  owner: string
  repo: string
}

/**
 * Accepts "owner/repo", "github.com/owner/repo", full https URLs
 * (with optional .git suffix or deeper paths), and normalizes to a RepoRef.
 * Throws with a user-facing message on anything else.
 */
export function normalizeRepoInput(raw: string): RepoRef {
  const trimmed = raw.trim()
  if (!trimmed) {
    throw new Error('Enter a GitHub repository URL or owner/repo.')
  }

  let path = trimmed
  if (/^https?:\/\//i.test(trimmed) || /^github\.com\//i.test(trimmed)) {
    let url: URL
    try {
      url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
    } catch {
      throw new Error('That does not look like a valid URL.')
    }
    if (url.hostname !== 'github.com' && url.hostname !== 'www.github.com') {
      throw new Error('Only public github.com repositories are supported.')
    }
    path = url.pathname.replace(/^\/+/, '')
  }

  const segments = path.split('/').filter(Boolean)
  if (segments.length < 2) {
    throw new Error('Use the form owner/repo or a full GitHub repository URL.')
  }

  const owner = segments[0]
  const repo = segments[1].replace(/\.git$/i, '')

  const namePattern = /^[A-Za-z0-9_.-]+$/
  if (!namePattern.test(owner) || !namePattern.test(repo)) {
    throw new Error('Owner or repository name contains invalid characters.')
  }

  return { owner, repo }
}
