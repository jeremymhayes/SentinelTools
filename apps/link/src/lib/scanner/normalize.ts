export function normalizeScanUrl(rawUrl: string): URL {
  const trimmed = rawUrl.trim()

  if (!trimmed) {
    throw new Error('Enter a URL to scan.')
  }

  if (/\s/.test(trimmed)) {
    throw new Error('URLs cannot contain spaces.')
  }

  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(trimmed)?.[1]
  const hasSchemeSeparator = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
  const looksLikeDomainPort = !!scheme && scheme.includes('.') && !hasSchemeSeparator

  if (
    scheme &&
    !looksLikeDomainPort &&
    scheme.toLowerCase() !== 'http' &&
    scheme.toLowerCase() !== 'https'
  ) {
    throw new Error('Only http:// and https:// URLs can be scanned.')
  }

  const candidate =
    scheme && !looksLikeDomainPort ? trimmed : `https://${trimmed}`

  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    throw new Error('That does not look like a valid URL.')
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only http:// and https:// URLs can be scanned.')
  }

  if (!url.hostname) {
    throw new Error('That does not look like a valid URL.')
  }

  url.hash = ''
  return url
}
