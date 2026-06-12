import { assertPublicHttpUrl } from './guard'
import type { RedirectHop } from './types'

const MAX_HOPS = 8
const REQUEST_TIMEOUT_MS = 8000
const MAX_BODY_BYTES = 1_500_000
const USER_AGENT =
  'Mozilla/5.0 (compatible; LinkSentinel/1.0; +https://www.jeremymhayes.com)'

export interface ChainResult {
  hops: RedirectHop[]
  finalUrl: URL
  finalStatus: number
  finalHeaders: Headers
  setCookies: string[]
  html: string | null
}

async function readBodyCapped(res: Response): Promise<string> {
  if (!res.body) return ''
  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8', { fatal: false })
  let out = ''
  let bytes = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    bytes += value.byteLength
    out += decoder.decode(value, { stream: true })
    if (bytes >= MAX_BODY_BYTES) {
      await reader.cancel()
      break
    }
  }
  return out
}

function hopNote(status: number, index: number, isFinal: boolean): string {
  if (index === 0 && isFinal) return 'no redirects'
  if (index === 0) return 'initial request'
  if (isFinal) return 'final destination'
  if (status === 301 || status === 308) return 'permanent redirect'
  if (status === 302 || status === 307) return 'temporary redirect'
  if (status === 303) return 'see other'
  return 'redirect'
}

/* Follows the redirect chain hop by hop. Every hop re-runs the SSRF guard
   so a public site cannot bounce the scanner into a private address. */
export async function followChain(startUrl: string): Promise<ChainResult> {
  const hops: RedirectHop[] = []
  const setCookies: string[] = []
  let current = await assertPublicHttpUrl(startUrl)

  for (let i = 0; i < MAX_HOPS; i++) {
    let res: Response
    try {
      res = await fetch(current.toString(), {
        method: 'GET',
        redirect: 'manual',
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          'user-agent': USER_AGENT,
          accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9',
        },
      })
    } catch (cause) {
      if (i === 0) {
        throw new Error(
          `Could not reach ${current.hostname} — the site did not respond.`,
          { cause }
        )
      }
      throw new Error(
        `The redirect chain broke at ${current.hostname} — hop ${i} did not respond.`,
        { cause }
      )
    }

    setCookies.push(...res.headers.getSetCookie())

    const location = res.headers.get('location')
    const isRedirect = res.status >= 300 && res.status < 400 && !!location

    hops.push({
      url: current.toString(),
      status: res.status,
      protocol: current.protocol === 'https:' ? 'https' : 'http',
      note: hopNote(res.status, i, !isRedirect),
    })

    if (!isRedirect) {
      const contentType = res.headers.get('content-type') ?? ''
      const html =
        res.ok && contentType.includes('text/html')
          ? await readBodyCapped(res)
          : null
      return {
        hops,
        finalUrl: current,
        finalStatus: res.status,
        finalHeaders: res.headers,
        setCookies,
        html,
      }
    }

    await res.body?.cancel()
    const next = new URL(location, current)
    current = await assertPublicHttpUrl(next.toString())
  }

  throw new Error(
    `Gave up after ${MAX_HOPS} redirects — the chain never settled on a destination.`
  )
}
