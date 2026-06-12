# Contributing

Thanks for your interest. This is a small personal project, so the process
is lightweight.

## Setup

```bash
npm install        # at the repo root (npm workspaces)
npm run dev:hub    # localhost:3000
npm run dev:repo   # localhost:3001
npm run dev:file   # localhost:3002
```

## Before opening a PR

```bash
npm run typecheck
npm run build
npm test
```

All three must pass. CI runs the same commands.

## Ground rules

- **Read [docs/SAFETY-LANGUAGE.md](docs/SAFETY-LANGUAGE.md) before touching
  any user-facing copy.** No "safe", "clean", or "virus-free" claims —
  ever.
- Don't redesign the visual identity. New UI goes through
  `packages/sentinel-ui`; don't copy-paste styles between apps.
- FileSentinel must never upload file contents. RepoSentinel must never
  display an unmasked secret.
- No auth, payments, accounts, AI features, browser extensions, or status
  pages — deliberately out of scope.
- Secrets stay server-side. Anything prefixed `NEXT_PUBLIC_` is public.
- Prefer small, focused PRs.

## Project layout

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Deployment:
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
