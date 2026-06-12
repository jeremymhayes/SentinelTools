# Architecture

npm-workspaces monorepo. Three Next.js 16 (App Router) apps share three
local packages. Shared packages ship raw TypeScript and are compiled by
each app via `transpilePackages` — there is no package build step.

```
apps/
  hub/    landing page for the suite          (static, dev port 3000)
  repo/   RepoSentinel — GitHub repo scanner  (server-rendered report, dev port 3001)
  file/   FileSentinel — local file checker   (fully client-side, dev port 3002)
packages/
  sentinel-ui/      design system + shared components
  sentinel-core/    severity types, risk scoring, cross-app URLs
  sentinel-config/  shared tsconfig base
```

## Data flow

### RepoSentinel (`apps/repo`)

```
ScanInput (client)
  → normalizeRepoInput()            src/lib/normalize.ts   owner/repo or URL → RepoRef
  → /report?repo=owner/repo         server component, force-dynamic
    → analyzeRepo()                 src/lib/analyze.ts
        fetchRepoMetadata()         GET /repos/{o}/{r}
        fetchRepoTree()             GET /repos/{o}/{r}/git/trees/{branch}?recursive=1
        fetchFileContent()          GET /repos/{o}/{r}/contents/{path}  (small files only)
        scanForSecrets()            src/lib/secrets.ts — masked output only
    → scoreFindings()               @sentinel/core
    → report UI                     @sentinel/ui components
```

All GitHub access is read-only over the REST API — nothing is cloned,
installed, or executed. `GITHUB_TOKEN` (optional) stays server-side.
2–4 API requests per scan, plus one per scanned `.env`-named file (max 3).

### FileSentinel (`apps/file`)

Entirely client-side. The file is read into memory in the browser;
SHA-256/SHA-1 come from Web Crypto, MD5 from a local implementation
(`src/lib/hash.ts`). Trait heuristics in `src/lib/traits.ts`. **No file
bytes ever leave the machine.** The reputation panel is a placeholder —
when implemented it will send the SHA-256 hash only, server-side, after
explicit user confirmation.

### Hub (`apps/hub`)

Static marketing/index pages. All cross-app links come from
`TOOL_URLS` in `@sentinel/core` (env-driven with localhost fallbacks).

## Scoring model (`@sentinel/core`)

`scoreFindings(findings)` starts at 100 and subtracts per non-passing
finding: low −3, medium −7, high −14, critical −25, clamped at 0.
Grades: 90–100 Strong · 70–89 Good · 50–69 Caution · 30–49 Risky ·
0–29 High Risk. Verdict = worst severity present. Every deduction is
returned in `breakdown` so reports can show exactly why a score is what
it is.

## Design system (`@sentinel/ui`)

Extracted from LinkSentinel: dark editorial sheet, hairline borders, blue
accent, mono uppercase metadata, severity color ramp reserved for
scan-result contexts. Tokens and component classes live in
`src/styles.css`; apps import it after Tailwind and point a Tailwind
`@source` directive at the package source so utility classes inside
shared components are generated.

Component inventory: AppShell, SiteHeader, SiteFooter, ToolCard,
TechnicalPanel, BracketPanel, SectionEyebrow, MetadataLabel, ScoreBlock,
RiskBadge, FindingRow, RecommendationBlock, CodeSnippet, EmptyState,
ScanInput.

## Build targets

- **Local:** `next dev` / `next build` with Turbopack.
- **Cloudflare Workers:** OpenNext adapter (`cf:build` scripts) — forces
  `next build --webpack` because OpenNext cannot consume Turbopack output.
  See [DEPLOYMENT.md](DEPLOYMENT.md).

## Deliberate non-goals

No authentication, payments, accounts, user dashboards, browser
extensions, status pages, or generative-AI features.
