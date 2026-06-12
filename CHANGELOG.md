# Changelog

All notable changes to this project will be documented in this file.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/);
the project does not use semantic version releases yet.

## [Unreleased]

### Added

- LinkSentinel migrated into the monorepo as `apps/link` (URL scanner,
  dev port 3003), now sharing `@sentinel/ui` components and deployed as
  the `sentinel-link` worker on `link.sentineltools.net`. The original
  standalone project is retained as rollback.

- Initial monorepo MVP: hub landing page (`apps/hub`), RepoSentinel
  GitHub repository scanner (`apps/repo`), FileSentinel local file
  integrity checker (`apps/file`).
- Shared packages: `@sentinel/ui` (design system), `@sentinel/core`
  (risk scoring), `@sentinel/config` (tsconfig base).
- Cloudflare Workers deployment via the OpenNext adapter
  (`cf:build` / `cf:preview` / `cf:deploy` per app).
- GitHub Actions CI (typecheck, build, tests).
- Unit tests for scoring, repo input parsing, secret redaction, and
  file trait detection.
- Project docs: deployment, architecture, safety-language rules,
  LinkSentinel migration plan, security policy, contributing guide.
