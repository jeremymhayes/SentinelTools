/**
 * Cross-app URLs. Local dev defaults; override per environment with
 * NEXT_PUBLIC_* env vars (production: sentineltools.com subdomains).
 * LinkSentinel lives in a separate repo for now — run it on port 3003
 * locally (`next dev -p 3003`) until it migrates into this monorepo.
 */
export const TOOL_URLS = {
  hub: process.env.NEXT_PUBLIC_HUB_URL ?? 'http://localhost:3000',
  repo: process.env.NEXT_PUBLIC_REPO_URL ?? 'http://localhost:3001',
  file: process.env.NEXT_PUBLIC_FILE_URL ?? 'http://localhost:3002',
  link: process.env.NEXT_PUBLIC_LINKSENTINEL_URL ?? 'http://localhost:3003',
} as const
