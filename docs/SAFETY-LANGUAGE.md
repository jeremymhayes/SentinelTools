# Safety language rules

Sentinel Tools are first-pass checkers, not certification authorities. The
copy must never promise more than the checks can deliver. These rules apply
to all UI text, docs, READMEs, and report output in every app.

## Banned claims

Never state or imply any of the following, in any phrasing:

- "safe" / "this file/repo/link is safe"
- "clean"
- "virus-free" / "malware-free"
- "100% secure" / "guaranteed"
- "verified safe" / "trusted"

A scan that finds nothing has only proven that *these particular checks
found nothing*. Malware authors specifically engineer around known checks,
so absence of findings is weak evidence by design.

## Approved phrasings

| Situation | Say this |
| --- | --- |
| Scan found nothing | "No obvious issues detected by these checks." |
| Reputation lookup hit | "Known malware reputation" |
| Reputation lookup miss / not run | "Unknown" |
| Heuristic trigger (double extension, MIME mismatch, …) | "Suspicious indicator" |
| Hash equals expected hash | "Hash match — the file content is exactly what that checksum describes." (a match verifies *integrity*, not *harmlessness*) |
| Hash differs | "Hash mismatch — the file differs from what the checksum describes." |
| Overall positive verdict | the score + grade ("Strong", "Good") with the breakdown — never a safety adjective |

## Required disclosures

- **FileSentinel:** state that it is *not an antivirus* and that hashing is
  local-only (no upload) anywhere results are shown.
- **RepoSentinel:** reports state they are read-only and list what the
  checks cover; detected secrets are always masked (path + line + masked
  preview only — never the raw value).
- **MD5:** always labeled legacy/insecure; offered only for comparing
  against historically published checksums.

## Review checklist for new copy

1. Does it claim or imply a safety guarantee? Rephrase per the table.
2. Does it name what the check actually inspected? If not, add it.
3. Could a non-technical reader leave thinking "this tool said it's fine"?
   If yes, soften to "no obvious issues detected by these checks."
