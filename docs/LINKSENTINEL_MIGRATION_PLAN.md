# LinkSentinel migration plan

> **Status: EXECUTED 2026-06-12.** LinkSentinel now lives at `apps/link`,
> deployed as the `sentinel-link` worker on `link.sentineltools.net`.
> Deviations from the plan below: the local `ScanInput` was kept at its
> original path as a thin wrapper around the shared component (so page
> imports stayed unchanged), and `demoScan.ts` still uses the scanner's own
> types (structural-compatible with `@sentinel/core` — optional second-pass
> cleanup). The original standalone project at `PROJECTS\LinkSentinel`
> remains untouched as rollback; archive it after a stable period
> (step 9 below — the only step not yet done).

This document was the plan for moving the standalone app at
`C:\Users\jerem\PROJECTS\LinkSentinel` into this monorepo as `apps/link`.

## Goal state

- `apps/link` in this monorepo, dev port **3003**, deployed to
  `link.sentineltools.net` via the same OpenNext/Workers pattern as the
  other apps.
- Visual components come from `@sentinel/ui` (which was extracted from
  LinkSentinel, so this is mostly a swap-back).
- Scanner logic stays app-local (`src/lib/scanner/`) — it is
  LinkSentinel-specific and does not belong in `sentinel-core`.

## What moves

| From (LinkSentinel) | To (`apps/link`) | Notes |
| --- | --- | --- |
| `src/app/*` (all routes) | `src/app/*` | keep every route, see below |
| `src/lib/scanner/*` (+ tests) | `src/lib/scanner/*` | unchanged; wire tests into `npm test` |
| `src/lib/demoScan.ts` | `src/lib/demoScan.ts` | re-export `Severity`/`Finding` from `@sentinel/core` instead of local types where they line up |
| `package.json` deps | merged into app `package.json` | same versions as the other apps already use |
| `src/app/globals.css` | **deleted** | replaced by `@import '@sentinel/ui/styles.css'` + `@source` like the other apps |

## Component replacement map

| LinkSentinel local component | Replace with |
| --- | --- |
| `components/AppShell.tsx` | `AppShell` from `@sentinel/ui` (pass brand `[LS] Link/Sentinel`, nav, footer links) |
| `components/SiteHeader.tsx` | `SiteHeader` via `AppShell` props |
| `components/ui/Primitives.tsx` (`cn`, `MetadataLabel`, `SectionEyebrow`, `TechnicalPanel`, `BracketPanel`, `EmptyState`, `CodeSnippet`) | same names from `@sentinel/ui` |
| `components/scan/RiskBadge.tsx` | `RiskBadge` from `@sentinel/ui` |
| `components/scan/ScoreBlock.tsx` | `ScoreBlock` from `@sentinel/ui` (check prop shape — monorepo version takes `counts` record) |
| `components/scan/FindingRow.tsx` | `FindingRow` from `@sentinel/ui` (monorepo `Finding` adds optional `recommendation`/`evidence`) |
| `components/scan/RecommendationBlock.tsx` | **keep local** — LinkSentinel's version supports `platformSnippets`, the shared one doesn't (or extend the shared one first) |
| `components/scan/ScanInput.tsx` | shared `ScanInput` + a thin `LinkScanInput` wrapper doing URL normalization + router push (same pattern as `RepoScanInput` in `apps/repo`) |
| `components/scan/HeaderCheckTable.tsx`, `RedirectChain.tsx` | **keep local** — link-scanner-specific |

## Routes that remain (all of them)

`/` (scanner), `/report`, `/sample-report`, `/scan` (loading), `/learn`,
`/privacy`, `/terms`. None are obsoleted by the hub.

## Type reconciliation

LinkSentinel's `Severity` = `'ok'|'low'|'medium'|'high'|'critical'` —
identical to `@sentinel/core`. Its `ScanReport` scoring is bespoke
(`scoreBreakdown` computed in-scanner). First pass: keep the scanner's own
scoring and only adopt shared *types*. Second pass (optional): route
findings through `scoreFindings()` if the penalties line up.

## Step-by-step

1. Branch in this monorepo. Do **not** delete or modify
   `PROJECTS\LinkSentinel` yet.
2. Scaffold `apps/link` by copying `apps/repo`'s config files
   (`package.json` renamed + port 3003, `tsconfig.json`, `next.config.ts`,
   `postcss.config.mjs`, `globals.css`, `wrangler.jsonc` named
   `sentinel-link`, `open-next.config.ts`).
3. Copy LinkSentinel `src/` in; delete its `globals.css`,
   `components/AppShell.tsx`, `components/SiteHeader.tsx`,
   `components/ui/Primitives.tsx`, `components/scan/{RiskBadge,ScoreBlock,FindingRow}.tsx`.
4. Update imports per the replacement map; fix prop differences.
5. Wire scanner tests into the root `npm test`.
6. Verify: `npm run typecheck && npm run build && npm test`, then visual
   diff dev:3003 against the original LinkSentinel on another port.
7. Add `dev:link` to root scripts, update README + DEPLOYMENT.md +
   CI watch paths, set `NEXT_PUBLIC_LINKSENTINEL_URL` defaults.
8. Deploy `sentinel-link` worker to `link.sentineltools.net`.
9. Only after production is verified: archive the old repo/project (do not
   delete — keep it as rollback for at least one release cycle).

## Risks

- **Prop drift** between the extracted `@sentinel/ui` components and
  LinkSentinel's originals (e.g. `ScoreBlock` props, `Recommendation`
  shape). Mitigation: TypeScript will catch all of it at step 6; budget
  time for it.
- **Tailwind class generation**: shared components rely on the `@source`
  directive; missing it silently drops styles. Mitigation: copy
  `globals.css` from an existing app, visual-diff at step 6.
- **Scanner runtime behavior on Workers**: LinkSentinel's `fetchChain`
  does outbound fetches with redirect handling; verify under
  `cf:preview` (workerd), not just Node, before DNS cutover.
- **Old project breakage**: none expected — the plan never edits the
  original until the archive step, and archiving is reversible.
