# Deployment

Each app deploys to Cloudflare **Workers** as its own Worker, built with the
[OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare).

> **Why Workers, not Cloudflare Pages?** Pages' Next.js adapter
> (`@cloudflare/next-on-pages`) supports Next.js ≤ 15 only; this repo is on
> Next.js 16. The OpenNext adapter is Cloudflare's currently recommended path
> for Next.js and supports the Node runtime (which RepoSentinel's server-side
> GitHub scanning uses).

## Domain map

| App | Worker name | Domain |
| --- | --- | --- |
| `apps/hub` | `sentinel-hub` | `sentineltools.net` |
| `apps/repo` | `sentinel-repo` | `repo.sentineltools.net` |
| `apps/file` | `sentinel-file` | `file.sentineltools.net` |
| `apps/link` | `sentinel-link` | `link.sentineltools.net` |

## Per-app configuration

Identical pattern for all three apps:

| Setting | Value |
| --- | --- |
| Root directory | repo root (npm workspaces — installs must run at root) |
| Install command | `npm ci` |
| Build command | `npm run cf:build -w apps/<app>` |
| Deploy command | `npx wrangler deploy -c apps/<app>/wrangler.jsonc` (or `npm run cf:deploy -w apps/<app>`) |
| Output | `.open-next/` inside the app (consumed by wrangler, not uploaded as static files) |

`cf:build` runs `next build --webpack` under the hood — OpenNext cannot
consume Turbopack output yet. Local `npm run dev` / `npm run build` keep
Turbopack; only the Cloudflare bundle uses webpack.

### Environment variables

`NEXT_PUBLIC_*` URLs are **build-time** (inlined into the client bundle).
Each app ships a committed `.env.production` with the production values, so
`cf:build` picks them up automatically — no shell exports needed. (`next
build` loads `.env.production`; local dev ignores it and falls back to the
localhost defaults.) If a domain ever changes, update the three
`.env.production` files:

```
NEXT_PUBLIC_HUB_URL=https://sentineltools.net
NEXT_PUBLIC_REPO_URL=https://repo.sentineltools.net
NEXT_PUBLIC_FILE_URL=https://file.sentineltools.net
NEXT_PUBLIC_LINKSENTINEL_URL=https://link.sentineltools.net
```

> Deploying without these inlined produces a live site whose buttons point
> at `localhost` — if you see that in production, the worker was built
> before `.env.production` existed; rebuild and redeploy.

Secrets are **runtime** values and must never use the `NEXT_PUBLIC_` prefix:

| App | Secret | How to set |
| --- | --- | --- |
| `apps/repo` | `GITHUB_TOKEN` — **effectively required in production.** Cloudflare egress IPs are shared, so the unauthenticated 60 req/h quota is usually already exhausted and scans fail with a rate-limit error. A token (fine-grained PAT, no scopes needed for public repos) gives 5,000 req/h tied to the token instead of the IP. | `cd apps/repo && npx wrangler secret put GITHUB_TOKEN` |
| `apps/file` | `VIRUSTOTAL_API_KEY` — enables the VirusTotal reputation lookup (SHA-256 only, sent after explicit user confirmation). UI shows "Not configured" until set. Free key: virustotal.com profile → API Key (4 lookups/min, 500/day). | `cd apps/file && npx wrangler secret put VIRUSTOTAL_API_KEY` |

## Manual deploy from a workstation

```bash
npm ci
npx wrangler login                      # once
npm run cf:deploy -w apps/hub           # production URLs come from .env.production
npm run cf:deploy -w apps/repo
npm run cf:deploy -w apps/file
```

Preview a production bundle locally without deploying:

```bash
npm run cf:preview -w apps/repo    # wrangler dev against the built worker
```

## Git-integrated deploys (Workers Builds)

In the Cloudflare dashboard, create one Worker per app connected to the
GitHub repo. For each:

- **Root directory:** `/` (repo root — required for npm workspaces)
- **Build command:** `npm ci && npm run cf:build -w apps/<app>`
- **Deploy command:** `npx wrangler deploy -c apps/<app>/wrangler.jsonc`
- **Build watch paths:** `apps/<app>/**`, `packages/**` (avoids rebuilding
  every worker on every commit)
- **Variables:** the four `NEXT_PUBLIC_*` URLs as build variables; secrets
  via the Worker's Settings → Variables & Secrets.

## Custom domains

Once `sentineltools.net` DNS is on Cloudflare, attach domains per Worker
(Settings → Domains & Routes → Custom domain), or uncomment the `routes`
block in each `wrangler.jsonc`:

```jsonc
"routes": [{ "pattern": "repo.sentineltools.net", "custom_domain": true }]
```

## LinkSentinel

Migrated into the monorepo as `apps/link` (2026-06-12) and deploys exactly
like the other apps (`npm run cf:deploy -w apps/link` → `sentinel-link`
worker → `link.sentineltools.net`). The original standalone project at
`PROJECTS/LinkSentinel` is kept untouched as rollback; see
[LINKSENTINEL_MIGRATION_PLAN.md](LINKSENTINEL_MIGRATION_PLAN.md) for what
moved.
