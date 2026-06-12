import type { Finding } from '@sentinel/core'

/**
 * Heuristic suspicious-trait checks on file metadata. These are
 * indicators, never verdicts — the UI language reflects that.
 */

const EXECUTABLE_EXTENSIONS = new Set([
  'exe', 'dll', 'scr', 'com', 'pif', 'msi', 'msp', 'cpl', 'jar',
  'bat', 'cmd', 'ps1', 'vbs', 'vbe', 'js', 'jse', 'wsf', 'wsh',
  'hta', 'sh', 'app', 'apk', 'deb', 'rpm',
])

const DOCUMENT_LIKE_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf',
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'mp3', 'mp4', 'avi',
  'mov', 'zip', 'csv', 'html', 'htm',
])

/** Extension → expected MIME prefixes for mismatch detection. */
const EXPECTED_MIME: Record<string, string[]> = {
  pdf: ['application/pdf'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  gif: ['image/gif'],
  svg: ['image/svg'],
  mp3: ['audio/'],
  mp4: ['video/'],
  txt: ['text/plain'],
  html: ['text/html'],
  htm: ['text/html'],
  zip: ['application/zip', 'application/x-zip'],
  json: ['application/json'],
  csv: ['text/csv', 'application/vnd.ms-excel'],
  doc: ['application/msword'],
  docx: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  xls: ['application/vnd.ms-excel'],
  xlsx: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
}

const HUGE_FILE_BYTES = 1024 * 1024 * 1024 // 1 GiB

export function getExtensions(name: string): string[] {
  const parts = name.toLowerCase().split('.')
  return parts.length > 1 ? parts.slice(1) : []
}

export function analyzeFileTraits(file: File): Finding[] {
  const findings: Finding[] = []
  let counter = 0
  const nextId = () => `T-${String(++counter).padStart(2, '0')}`

  const extensions = getExtensions(file.name)
  const finalExtension = extensions[extensions.length - 1] ?? ''

  /* double extension: document-looking name ending in an executable type */
  if (
    extensions.length >= 2 &&
    EXECUTABLE_EXTENSIONS.has(finalExtension) &&
    DOCUMENT_LIKE_EXTENSIONS.has(extensions[extensions.length - 2])
  ) {
    findings.push({
      id: nextId(),
      severity: 'high',
      title: 'Suspicious indicator: double extension',
      category: 'Naming',
      summary: `The filename ends in ".${extensions[extensions.length - 2]}.${finalExtension}" — it looks like a document but is actually an executable type. This naming trick is a common malware disguise.`,
      recommendation:
        'Do not open this file unless you fully trust its source and expected an executable.',
      evidence: file.name,
    })
  } else if (EXECUTABLE_EXTENSIONS.has(finalExtension)) {
    findings.push({
      id: nextId(),
      severity: 'medium',
      title: 'Executable or script file type',
      category: 'Naming',
      summary: `".${finalExtension}" files run code when opened. That is not inherently bad — but only open executables you deliberately downloaded from a source you trust.`,
      recommendation:
        'Verify the publisher and compare the SHA-256 against an officially published checksum before running.',
      evidence: file.name,
    })
  } else {
    findings.push({
      id: nextId(),
      severity: 'ok',
      title: 'No executable extension',
      category: 'Naming',
      summary: 'The file extension is not an executable or script type.',
    })
  }

  /* MIME / extension mismatch (browser-reported MIME, best effort) */
  const expected = EXPECTED_MIME[finalExtension]
  if (expected && file.type) {
    const matches = expected.some((prefix) => file.type.startsWith(prefix))
    if (!matches) {
      findings.push({
        id: nextId(),
        severity: 'medium',
        title: 'Suspicious indicator: MIME/extension mismatch',
        category: 'Type',
        summary: `The browser reports this file's type as "${file.type}", which does not match what a ".${finalExtension}" file usually is. The content may not be what the name claims.`,
        recommendation:
          'Inspect the file with a dedicated tool before opening it in its default application.',
        evidence: `reported: ${file.type} · expected for .${finalExtension}: ${expected.join(' or ')}`,
      })
    } else {
      findings.push({
        id: nextId(),
        severity: 'ok',
        title: 'MIME type matches extension',
        category: 'Type',
        summary: `Reported type "${file.type}" is consistent with ".${finalExtension}".`,
      })
    }
  }

  /* huge file */
  if (file.size > HUGE_FILE_BYTES) {
    findings.push({
      id: nextId(),
      severity: 'low',
      title: 'Very large file',
      category: 'Size',
      summary:
        'Files over 1 GiB are unusual for documents and downloads. Some malware pads itself with junk bytes to evade size-limited scanners.',
      recommendation:
        'Confirm the published file size from the source matches what you received.',
      evidence: formatBytes(file.size),
    })
  }

  return findings
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KiB', 'MiB', 'GiB', 'TiB']
  let value = bytes
  let unitIndex = -1
  do {
    value /= 1024
    unitIndex++
  } while (value >= 1024 && unitIndex < units.length - 1)
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unitIndex]}`
}
