'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FileSearch, RotateCcw, UploadCloud } from 'lucide-react'
import {
  BracketPanel,
  FindingRow,
  MetadataLabel,
  RiskBadge,
  ScoreBlock,
  TechnicalPanel,
  cn,
} from '@sentinel/ui'
import { scoreFindings, type Finding, type ScoreResult } from '@sentinel/core'
import { hashFile, type FileHashes } from '@/lib/hash'
import { analyzeFileTraits, formatBytes, getExtensions } from '@/lib/traits'

interface AnalysisResult {
  fileName: string
  size: number
  mimeType: string
  extension: string
  lastModified: string
  hashes: FileHashes
  findings: Finding[]
  score: ScoreResult
}

type HashMatch = 'match' | 'mismatch' | 'unrecognized' | null

const HASH_LENGTH_TO_ALGO: Record<number, keyof FileHashes> = {
  64: 'sha256',
  40: 'sha1',
  32: 'md5',
}

/* Whole-file hashing happens in browser memory; past ~1.5 GiB the
   ArrayBuffer allocation reliably fails on most machines. */
const MAX_HASHABLE_BYTES = 1.5 * 1024 ** 3

type ReputationState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'unknown' }
  | {
      phase: 'known'
      malicious: number
      suspicious: number
      totalEngines: number
      permalink: string
    }

export const FileAnalyzer: React.FC = () => {
  const [dragActive, setDragActive] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [expectedHash, setExpectedHash] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  /* Runtime probe (not build-time): on Cloudflare the key is a secret that
     only exists when the worker runs. Only a boolean crosses the wire. */
  const [reputationConfigured, setReputationConfigured] = useState(false)
  const [reputation, setReputation] = useState<ReputationState>({
    phase: 'idle',
  })

  useEffect(() => {
    let cancelled = false
    fetch('/api/reputation')
      .then((res) => (res.ok ? res.json() : { configured: false }))
      .then((data) => {
        if (!cancelled) setReputationConfigured(Boolean(data.configured))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const lookupReputation = useCallback(async (sha256: string) => {
    setReputation({ phase: 'loading' })
    try {
      const res = await fetch('/api/reputation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sha256 }),
      })
      const data = await res.json()
      if (!res.ok) {
        setReputation({
          phase: 'error',
          message: data.error ?? `Lookup failed (HTTP ${res.status}).`,
        })
        return
      }
      setReputation(
        data.status === 'known'
          ? {
              phase: 'known',
              malicious: data.malicious,
              suspicious: data.suspicious,
              totalEngines: data.totalEngines,
              permalink: data.permalink,
            }
          : { phase: 'unknown' }
      )
    } catch {
      setReputation({
        phase: 'error',
        message: 'Could not reach the lookup service. Try again.',
      })
    }
  }, [])

  const analyze = useCallback(async (file: File) => {
    if (file.size > MAX_HASHABLE_BYTES) {
      setResult(null)
      setError(
        `This file is ${formatBytes(file.size)}. FileSentinel hashes files entirely in browser memory, which becomes unreliable past ~1.5 GiB — hashing was not attempted. For files this large, use a command-line tool instead: certutil -hashfile <file> SHA256 (Windows) or shasum -a 256 <file> (macOS/Linux).`
      )
      return
    }
    setWorking(true)
    setError(null)
    setResult(null)
    setReputation({ phase: 'idle' })
    try {
      const hashes = await hashFile(file)
      const findings = analyzeFileTraits(file)
      setResult({
        fileName: file.name,
        size: file.size,
        mimeType: file.type || 'unknown (not reported by browser)',
        extension: getExtensions(file.name).join('.') || 'none',
        lastModified: new Date(file.lastModified)
          .toISOString()
          .replace('T', ' ')
          .slice(0, 16),
        hashes,
        findings,
        score: scoreFindings(findings),
      })
    } catch {
      setError(
        'Could not read or hash this file. The browser may have run out of memory, or the file changed/moved while being read. Try again, or use a command-line hasher for very large files (certutil -hashfile <file> SHA256 on Windows, shasum -a 256 <file> on macOS/Linux).'
      )
    } finally {
      setWorking(false)
    }
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setDragActive(false)
      const file = event.dataTransfer.files?.[0]
      if (file) void analyze(file)
    },
    [analyze]
  )

  /* expected-hash comparison */
  const normalizedExpected = expectedHash.trim().toLowerCase().replace(/^0x/, '')
  let hashMatch: HashMatch = null
  let matchedAlgo: keyof FileHashes | null = null
  if (result && normalizedExpected) {
    const algo = HASH_LENGTH_TO_ALGO[normalizedExpected.length]
    if (!algo || !/^[0-9a-f]+$/.test(normalizedExpected)) {
      hashMatch = 'unrecognized'
    } else {
      matchedAlgo = algo
      hashMatch =
        result.hashes[algo] === normalizedExpected ? 'match' : 'mismatch'
    }
  }

  const hashRows: Array<{
    label: string
    value: string
    note?: string
  }> = result
    ? [
        { label: 'SHA-256', value: result.hashes.sha256 },
        { label: 'SHA-1', value: result.hashes.sha1, note: 'weak — avoid for new uses' },
        { label: 'MD5', value: result.hashes.md5, note: 'legacy / insecure — comparison only' },
      ]
    : []

  return (
    <div>
      {/* ---- drop zone ---- */}
      <BracketPanel className="p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <MetadataLabel className="!text-[0.8rem] !tracking-[0.16em] !text-[color:var(--text)]">
            Check a file
          </MetadataLabel>
          <MetadataLabel plain>Hashed locally — never uploaded</MetadataLabel>
        </div>

        <div
          role="button"
          tabIndex={0}
          aria-label="Drop a file here or press Enter to browse"
          data-active={dragActive}
          className={cn(
            'drop-zone flex cursor-pointer flex-col items-center gap-3 px-6 py-12 text-center',
            working && 'scan-sweep pointer-events-none opacity-70'
          )}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
        >
          <UploadCloud
            aria-hidden="true"
            size={28}
            className="text-[color:var(--accent)]"
          />
          {working ? (
            <p className="meta-label-plain caret-blink">Hashing</p>
          ) : (
            <>
              <p className="copy-sm text-[color:var(--text)]">
                Drop a file here, or click to browse.
              </p>
              <p className="meta-label-plain">
                SHA-256 · SHA-1 · MD5 (legacy) · metadata · trait checks
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void analyze(file)
              event.target.value = ''
            }}
          />
        </div>

        {error ? (
          <p className="mt-3 font-[family-name:var(--font-mono)] text-[0.75rem] text-[color:var(--critical)]">
            {error}
          </p>
        ) : null}
      </BracketPanel>

      {result ? (
        <>
          {/* ---- score ---- */}
          <BracketPanel className="mt-8">
            <ScoreBlock
              score={result.score.score}
              grade={result.score.grade}
              verdict={result.score.verdict}
              counts={result.score.severityCounts}
            />
          </BracketPanel>

          {/* ---- metadata ---- */}
          <TechnicalPanel title="File metadata" className="mt-6">
            <dl className="grid gap-x-8 sm:grid-cols-2">
              {(
                [
                  ['Filename', result.fileName],
                  ['Size', `${formatBytes(result.size)} (${result.size.toLocaleString()} bytes)`],
                  ['MIME type', result.mimeType],
                  ['Extension', result.extension],
                  ['Last modified', result.lastModified],
                ] as Array<[string, string]>
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-4 border-t border-[color:var(--border)] py-2.5 first:border-t-0 sm:[&:nth-child(2)]:border-t-0"
                >
                  <dt className="meta-label-plain shrink-0">{label}</dt>
                  <dd className="break-all text-right font-[family-name:var(--font-mono)] text-[0.82rem] text-[color:var(--text)]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </TechnicalPanel>

          {/* ---- hashes ---- */}
          <TechnicalPanel title="Hashes" meta="computed in-browser" className="mt-6">
            <ul>
              {hashRows.map((row) => (
                <li
                  key={row.label}
                  className="grid gap-1 border-t border-[color:var(--border)] py-3 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[6rem_1fr]"
                >
                  <span className="meta-label-plain pt-0.5">
                    {row.label}
                  </span>
                  <span className="min-w-0">
                    <code className="block break-all font-[family-name:var(--font-mono)] text-[0.8rem] text-[color:var(--text)]">
                      {row.value}
                    </code>
                    {row.note ? (
                      <span className="meta-label-plain mt-1 block !text-[color:var(--high)]">
                        {row.note}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>

            {/* expected hash compare */}
            <div className="mt-6 border-t border-[color:var(--border)] pt-5">
              <label
                htmlFor="expected-hash"
                className="meta-label-plain block"
              >
                Compare against an expected hash (SHA-256, SHA-1, or MD5)
              </label>
              <div className="scan-strip mt-3">
                <input
                  id="expected-hash"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="paste the checksum published by the file's source…"
                  value={expectedHash}
                  onChange={(event) => setExpectedHash(event.target.value)}
                />
              </div>
              {hashMatch === 'match' && matchedAlgo ? (
                <p className="mt-3 flex items-center gap-2.5">
                  <RiskBadge severity="ok" label="Hash match" />
                  <span className="copy-sm">
                    Matches the computed {matchedAlgo.toUpperCase()} — the file
                    content is exactly what that checksum describes. This
                    verifies integrity (the file was not altered in transit),
                    not harmlessness.
                    {matchedAlgo !== 'sha256'
                      ? ` Note: ${matchedAlgo.toUpperCase()} is cryptographically weak — prefer comparing a SHA-256 checksum when the source publishes one.`
                      : ''}
                  </span>
                </p>
              ) : null}
              {hashMatch === 'mismatch' && matchedAlgo ? (
                <p className="mt-3 flex items-center gap-2.5">
                  <RiskBadge severity="high" label="Hash mismatch" />
                  <span className="copy-sm">
                    Does not match the computed {matchedAlgo.toUpperCase()}.
                    The file differs from what the checksum describes — it may
                    be corrupted, a different version, or tampered with.
                  </span>
                </p>
              ) : null}
              {hashMatch === 'unrecognized' ? (
                <p className="mt-3 font-[family-name:var(--font-mono)] text-[0.75rem] text-[color:var(--medium)]">
                  Not a recognized hex hash (expected 64, 40, or 32 hex
                  characters).
                </p>
              ) : null}
            </div>
          </TechnicalPanel>

          {/* ---- trait findings ---- */}
          <TechnicalPanel
            title="Trait checks"
            meta={`${result.findings.filter((f) => f.severity !== 'ok').length} flagged`}
            className="mt-6"
          >
            {result.findings.filter((f) => f.severity !== 'ok').length === 0 ? (
              <p className="copy-sm">
                No suspicious indicators detected by these checks. This is not
                a malware verdict — only a check of naming, type, and size
                traits.
              </p>
            ) : null}
            {result.findings
              .filter((finding) => finding.severity !== 'ok')
              .map((finding) => (
                <FindingRow key={finding.id} finding={finding} />
              ))}
          </TechnicalPanel>

          {/* ---- reputation lookup ---- */}
          <TechnicalPanel
            title="Known malware reputation"
            meta="VirusTotal · SHA-256"
            className="mt-6"
          >
            {!reputationConfigured ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileSearch
                    aria-hidden="true"
                    size={16}
                    className="shrink-0 text-[color:var(--text-soft)]"
                  />
                  <p className="copy-sm max-w-xl">
                    Reputation status:{' '}
                    <span className="text-[color:var(--text)]">Unknown</span> —
                    known reputation lookup not configured on this server.
                    When enabled, this panel queries VirusTotal by SHA-256
                    only (the hash, never the file) and only after you
                    explicitly confirm.
                  </p>
                </div>
                <span className="chip">Not configured</span>
              </div>
            ) : (
              <div>
                {reputation.phase === 'idle' ? (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="copy-sm max-w-xl">
                      Check whether this file&rsquo;s SHA-256 is known to
                      VirusTotal. Only the hash is sent — never the file or
                      its contents.
                    </p>
                    <button
                      type="button"
                      className="button button-secondary shrink-0"
                      onClick={() => void lookupReputation(result.hashes.sha256)}
                    >
                      <FileSearch aria-hidden="true" size={14} />
                      Send SHA-256 to VirusTotal
                    </button>
                  </div>
                ) : null}

                {reputation.phase === 'loading' ? (
                  <p className="meta-label-plain caret-blink">
                    Querying VirusTotal
                  </p>
                ) : null}

                {reputation.phase === 'error' ? (
                  <p className="font-[family-name:var(--font-mono)] text-[0.78rem] text-[color:var(--medium)]">
                    {reputation.message}
                  </p>
                ) : null}

                {reputation.phase === 'unknown' ? (
                  <p className="copy-sm flex flex-wrap items-center gap-2.5">
                    <RiskBadge severity="low" label="Unknown" />
                    <span>
                      This hash is not in VirusTotal&rsquo;s database. That
                      means no engine has seen this exact file — it is not
                      evidence of harmlessness either way.
                    </span>
                  </p>
                ) : null}

                {reputation.phase === 'known' ? (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <RiskBadge
                      severity={
                        reputation.malicious > 0
                          ? 'critical'
                          : reputation.suspicious > 0
                            ? 'medium'
                            : 'ok'
                      }
                      label={
                        reputation.malicious > 0
                          ? 'Known malware reputation'
                          : reputation.suspicious > 0
                            ? 'Suspicious indicator'
                            : 'No engine flags'
                      }
                    />
                    <span className="copy-sm">
                      {reputation.malicious + reputation.suspicious > 0
                        ? `${reputation.malicious} malicious and ${reputation.suspicious} suspicious verdicts across ${reputation.totalEngines} engines. Treat this file as hostile until proven otherwise.`
                        : `0 of ${reputation.totalEngines} engines currently flag this hash. That is an absence of known bad reputation — not a safety verdict.`}{' '}
                      <a
                        href={reputation.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-underline text-[color:var(--text)]"
                      >
                        Full report on VirusTotal ↗
                      </a>
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </TechnicalPanel>

          {/* ---- privacy + limitations ---- */}
          <TechnicalPanel title="Privacy & limitations" className="mt-6">
            <ul className="grid gap-3 sm:grid-cols-2">
              <li className="copy-sm flex gap-2.5">
                <span aria-hidden="true" className="mt-2 block h-1.5 w-1.5 shrink-0 bg-[color:var(--accent)]" />
                Everything on this page ran locally in your browser. The file,
                its contents, and its hashes were not uploaded or sent
                anywhere.
              </li>
              <li className="copy-sm flex gap-2.5">
                <span aria-hidden="true" className="mt-2 block h-1.5 w-1.5 shrink-0 bg-[color:var(--accent)]" />
                FileSentinel is not an antivirus. It checks integrity and
                surface traits only — it does not inspect file contents for
                malicious behavior and cannot declare a file harmless.
              </li>
              <li className="copy-sm flex gap-2.5">
                <span aria-hidden="true" className="mt-2 block h-1.5 w-1.5 shrink-0 bg-[color:var(--accent)]" />
                A hash match proves the bytes equal what the checksum
                describes — if the published checksum itself came from a
                compromised source, the match proves nothing.
              </li>
              <li className="copy-sm flex gap-2.5">
                <span aria-hidden="true" className="mt-2 block h-1.5 w-1.5 shrink-0 bg-[color:var(--accent)]" />
                MD5 and SHA-1 are provided only for comparing against legacy
                published checksums. Both are broken for security purposes;
                trust SHA-256 where available.
              </li>
            </ul>
          </TechnicalPanel>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                setResult(null)
                setExpectedHash('')
                setError(null)
              }}
            >
              <RotateCcw aria-hidden="true" size={14} />
              Check another file
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
