# Sentinel Tools

Practical security tools for links, repositories, and files. A monorepo (npm workspaces) containing the Sentinel Tools hub and the individual tools, sharing one design system and one risk-scoring core.

Built by [Jeremy Hayes](https://www.jeremymhayes.com).

## Structure

```
apps/
  hub/    sentineltools.net       — product suite landing       (dev port 3000)
  repo/   repo.sentineltools.net  — RepoSentinel: GitHub repo health scanner (dev port 3001)
  file/   file.sentineltools.net  — FileSentinel: local file integrity checker (dev port 3002)
  link/   link.sentineltools.net  — LinkSentinel: URL privacy & security scanner (dev port 3003)
packages/
  sentinel-ui/      shared design system (AppShell, panels, badges, score blocks, …)
  sentinel-core/    shared risk-scoring model and types
  sentinel-config/  shared tsconfig base
```

Shared packages are consumed as raw TypeScript via Next.js `transpilePackages` — no build step for packages.

## Local development

```bash
npm install          # once, at the repo root

npm run dev:hub      # http://localhost:3000
npm run dev:repo     # http://localhost:3001
npm run dev:file     # http://localhost:3002
npm run dev:link     # http://localhost:3003
```

Run each app in its own terminal. `npm run build`, `npm run typecheck`, and `npm test` at the root cover all workspaces — CI runs the same three.

### Environment variables

- `apps/repo/.env.local` — `GITHUB_TOKEN` (optional). Without it, the GitHub API allows ~60 requests/hour per IP; a token (no scopes needed) raises that to 5,000/hour. See `apps/repo/.env.example`.
- `apps/file/.env.local` — `VIRUSTOTAL_API_KEY` enables the VirusTotal known-reputation lookup (SHA-256 only, after explicit confirmation; "Not configured" otherwise). See `apps/file/.env.example`.
- Cross-app links default to localhost ports in dev. Production builds read the committed `apps/*/.env.production` files (`NEXT_PUBLIC_HUB_URL` etc. → sentineltools.net domains) — these are inlined at build time, so a rebuild is required after changing them.

## Risk scoring (`@sentinel/core`)

Reports start at 100 and subtract per finding: low −3, medium −7, high −14, critical −25 (clamped at 0). Grades:

| Score  | Grade     |
| ------ | --------- |
| 90–100 | Strong    |
| 70–89  | Good      |
| 50–69  | Caution   |
| 30–49  | Risky     |
| 0–29   | High Risk |

Every deduction is listed in the report's score breakdown, so the number is always explainable.

## Language rules

- No tool ever claims something is "safe", "clean", or "virus-free".
- The strongest positive claim is "No obvious issues detected by these checks."
- RepoSentinel masks any detected secret (path + line + masked preview only).
- FileSentinel hashes locally in the browser and never uploads file contents; any future reputation lookup sends the SHA-256 hash only, after explicit confirmation.

## LinkSentinel

Migrated into this monorepo as `apps/link` (2026-06-12) following [docs/LINKSENTINEL_MIGRATION_PLAN.md](docs/LINKSENTINEL_MIGRATION_PLAN.md): shared components now come from `@sentinel/ui`; the URL scanner logic stays app-local under `src/lib/scanner/`. The original standalone project at `PROJECTS/LinkSentinel` is untouched and kept as rollback — archive it once production has been stable for a while.

## Deployment — Cloudflare Workers

Each app deploys as its own Cloudflare Worker via the [OpenNext adapter](https://opennext.js.org/cloudflare). (Cloudflare Pages' Next.js adapter only supports Next ≤ 15; this repo is on Next 16, so Workers + OpenNext is the supported path.)

| App | Worker | Domain | Build command (from repo root) |
| --- | --- | --- | --- |
| `apps/hub` | `sentinel-hub` | `sentineltools.net` | `npm run cf:build -w apps/hub` |
| `apps/repo` | `sentinel-repo` | `repo.sentineltools.net` | `npm run cf:build -w apps/repo` |
| `apps/file` | `sentinel-file` | `file.sentineltools.net` | `npm run cf:build -w apps/file` |
| `apps/link` | `sentinel-link` | `link.sentineltools.net` | `npm run cf:build -w apps/link` |

Quick manual deploy:

```bash
npm ci && npx wrangler login
npm run cf:deploy -w apps/hub     # build + deploy; same for apps/repo, apps/file
```

- Production `NEXT_PUBLIC_*_URL` values ship in committed `apps/*/.env.production` files and are inlined at **build** time — `cf:deploy` needs no extra env setup.
- Set secrets (`GITHUB_TOKEN` for repo, `VIRUSTOTAL_API_KEY` for file — enables the reputation lookup) at **runtime** via `npx wrangler secret put …` — never as `NEXT_PUBLIC_` vars.
- Full instructions incl. git-integrated Workers Builds and custom domains: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Docs

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Cloudflare setup per app
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — monorepo layout, data flow, scoring model
- [docs/SAFETY-LANGUAGE.md](docs/SAFETY-LANGUAGE.md) — banned claims ("safe"/"clean"/"virus-free") and approved phrasings
- [docs/LINKSENTINEL_MIGRATION_PLAN.md](docs/LINKSENTINEL_MIGRATION_PLAN.md) — plan for moving LinkSentinel into `apps/link`
- [SECURITY.md](SECURITY.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [CHANGELOG.md](CHANGELOG.md)
