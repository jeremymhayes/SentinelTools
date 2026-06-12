import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

/* SSRF guard: the scanner fetches user-supplied URLs from the server, so
   every hop must be validated against internal/private targets before any
   request is made. DNS is re-checked per hop; a rebinding window between
   lookup and fetch remains, which is acceptable for a read-only scanner
   with no internal services on the same network namespace. */

const BLOCKED_HOSTNAMES = new Set(['localhost', 'localhost.localdomain'])

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4) return true
  const [a, b] = parts
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local / cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224 // multicast + reserved
  )
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  if (lower === '::' || lower === '::1') return true
  if (lower.startsWith('::ffff:')) {
    const mapped = lower.slice(7)
    return isIP(mapped) === 4 ? isPrivateIPv4(mapped) : true
  }
  return (
    lower.startsWith('fc') ||
    lower.startsWith('fd') || // unique local
    lower.startsWith('fe8') ||
    lower.startsWith('fe9') ||
    lower.startsWith('fea') ||
    lower.startsWith('feb') // link-local
  )
}

function isPrivateIp(ip: string): boolean {
  const version = isIP(ip)
  if (version === 4) return isPrivateIPv4(ip)
  if (version === 6) return isPrivateIPv6(ip)
  return true
}

/* Validates scheme + hostname and resolves DNS, rejecting anything that
   points at a private or special-purpose address. Throws with a
   user-presentable message. */
export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('That does not look like a valid URL.')
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only http:// and https:// URLs can be scanned.')
  }

  if (url.username || url.password) {
    throw new Error('URLs with embedded credentials are not scanned.')
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()

  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    !hostname.includes('.')
  ) {
    throw new Error('Local and internal hostnames cannot be scanned.')
  }

  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error('Private network addresses cannot be scanned.')
    }
    return url
  }

  let addresses
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true })
  } catch {
    throw new Error(`Could not resolve ${hostname}. Check the spelling.`)
  }

  if (addresses.length === 0) {
    throw new Error(`Could not resolve ${hostname}. Check the spelling.`)
  }

  for (const { address } of addresses) {
    if (isPrivateIp(address)) {
      throw new Error('That hostname resolves to a private network address.')
    }
  }

  return url
}
