import { NextResponse } from 'next/server'

/**
 * Known-malware-reputation lookup against VirusTotal, by SHA-256 only.
 * The file itself never reaches this server — the client sends just the
 * hash, and only after the user explicitly clicks the lookup button.
 * The API key stays server-side; only summarized stats go back out.
 */

export const dynamic = 'force-dynamic'

const SHA256_PATTERN = /^[0-9a-f]{64}$/

/** GET: runtime config probe — lets the client know whether lookups work.
    Runtime (not build-time) because on Cloudflare the key is a secret that
    only exists when the worker runs. */
export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.VIRUSTOTAL_API_KEY),
  })
}

export async function POST(request: Request) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Known reputation lookup is not configured on this server.' },
      { status: 503 }
    )
  }

  let sha256: unknown
  try {
    const body = await request.json()
    sha256 = body?.sha256
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (typeof sha256 !== 'string' || !SHA256_PATTERN.test(sha256.toLowerCase())) {
    return NextResponse.json(
      { error: 'Expected a 64-character hex SHA-256 hash.' },
      { status: 400 }
    )
  }

  const hash = sha256.toLowerCase()
  let res: Response
  try {
    res = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
      headers: { 'x-apikey': apiKey, Accept: 'application/json' },
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json(
      { error: 'Could not reach VirusTotal. Try again in a moment.' },
      { status: 502 }
    )
  }

  if (res.status === 404) {
    // Not in VT's corpus — explicitly "Unknown", never "clean".
    return NextResponse.json({ status: 'unknown' })
  }
  if (res.status === 429) {
    return NextResponse.json(
      { error: 'VirusTotal rate limit reached (free tier: 4 lookups/minute). Wait a minute and retry.' },
      { status: 429 }
    )
  }
  if (res.status === 401 || res.status === 403) {
    return NextResponse.json(
      { error: 'VirusTotal rejected the API key. Check the VIRUSTOTAL_API_KEY secret.' },
      { status: 502 }
    )
  }
  if (!res.ok) {
    return NextResponse.json(
      { error: `VirusTotal error (HTTP ${res.status}).` },
      { status: 502 }
    )
  }

  const data = await res.json()
  const stats = data?.data?.attributes?.last_analysis_stats ?? {}
  const malicious = Number(stats.malicious ?? 0)
  const suspicious = Number(stats.suspicious ?? 0)
  const harmless = Number(stats.harmless ?? 0)
  const undetected = Number(stats.undetected ?? 0)
  const totalEngines = malicious + suspicious + harmless + undetected

  return NextResponse.json({
    status: 'known',
    malicious,
    suspicious,
    totalEngines,
    // public per-hash page; contains no information about the user
    permalink: `https://www.virustotal.com/gui/file/${hash}`,
  })
}
