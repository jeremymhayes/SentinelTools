/**
 * Secret detection with strict redaction. Matches are never returned raw:
 * only the path, line number, pattern name, and a masked preview
 * (first few characters + asterisks) ever leave this module.
 */

export interface SecretHit {
  patternName: string
  path: string
  line: number
  maskedPreview: string
}

interface SecretPattern {
  name: string
  regex: RegExp
  /** Visible prefix length in the masked preview. */
  keep: number
}

const PATTERNS: SecretPattern[] = [
  { name: 'AWS access key ID', regex: /\bAKIA[0-9A-Z]{16}\b/g, keep: 4 },
  { name: 'GitHub token', regex: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g, keep: 4 },
  { name: 'OpenAI-style API key', regex: /\bsk-[A-Za-z0-9_-]{20,}\b/g, keep: 3 },
  { name: 'Slack token', regex: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g, keep: 5 },
  {
    name: 'Private key block',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY(?: BLOCK)?-----/g,
    keep: 10,
  },
  {
    name: 'Generic assigned secret',
    regex:
      /\b(?:api[_-]?key|secret|token|password|passwd)\b\s*[:=]\s*['"]([A-Za-z0-9_\-/+=]{16,})['"]/gi,
    keep: 3,
  },
  {
    name: 'Connection string credential',
    regex: /\b(?:mongodb|postgres|postgresql|mysql|redis|amqp):\/\/[^\s:@'"]+:([^\s@'"]{6,})@/gi,
    keep: 0,
  },
]

export function maskSecret(value: string, keep: number): string {
  const visible = value.slice(0, keep)
  const hiddenLength = Math.min(Math.max(value.length - keep, 8), 24)
  return `${visible}${'*'.repeat(hiddenLength)}`
}

/** Scan file text; return masked hits only. */
export function scanForSecrets(path: string, text: string): SecretHit[] {
  const hits: SecretHit[] = []
  const lines = text.split(/\r?\n/)

  lines.forEach((lineText, index) => {
    for (const pattern of PATTERNS) {
      pattern.regex.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = pattern.regex.exec(lineText)) !== null) {
        // Prefer the captured secret group when present, else whole match.
        const secret = match[1] ?? match[0]
        hits.push({
          patternName: pattern.name,
          path,
          line: index + 1,
          maskedPreview: maskSecret(secret, pattern.keep),
        })
        // One hit per pattern per line is enough evidence.
        break
      }
    }
  })

  return hits
}
