# Security Policy

Sentinel Tools is an independent, student-built project. Security reports
are taken seriously, handled personally by the maintainer, and genuinely
appreciated — please be patient with response times.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Email **jeremy@jeremymhayes.com** with:

- A description of the issue and where it lives (app, file, route)
- Steps to reproduce, or a proof of concept
- Impact as you understand it

You can expect an acknowledgment within **7 days**. Please allow up to
**90 days** for a fix before any public disclosure, and longer by mutual
agreement if the fix is complicated.

## Scope

In scope:

- The apps in this repository (`apps/hub`, `apps/repo`, `apps/file`)
  and the shared packages they use
- Logic errors that would make reports misleading in a dangerous
  direction (e.g. a real secret displayed unmasked by RepoSentinel, or
  FileSentinel uploading file contents anywhere)

Out of scope:

- Vulnerabilities in GitHub, Cloudflare, or other third-party services
- Findings the tools *report on* (e.g. a secret committed to someone
  else's repository) — report those to the affected repository's owner
- Denial-of-service via the public GitHub rate limit (it is expected to
  run out; the app degrades with an error message)

## What these tools promise (and don't)

By design, no Sentinel tool claims anything is "safe", "clean", or
"virus-free". If you find UI copy that breaks that rule, that is a bug —
report it like any other (a public issue is fine for language bugs).

## Handling of sensitive data

- **FileSentinel** computes hashes locally in the browser and uploads
  nothing.
- **RepoSentinel** reads public GitHub data only, and masks any detected
  secret (path + line + masked preview). If you can make it print a raw
  secret, that is a vulnerability — please report it privately.
- API keys (`GITHUB_TOKEN`, `VIRUSTOTAL_API_KEY`) are server-side runtime
  secrets and must never appear in client bundles or `NEXT_PUBLIC_*` vars.
