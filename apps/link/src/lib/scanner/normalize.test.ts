import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizeScanUrl } from './normalize.ts'

describe('normalizeScanUrl', () => {
  it('adds https to bare domains', () => {
    assert.equal(normalizeScanUrl('google.com').toString(), 'https://google.com/')
  })

  it('trims leading and trailing whitespace', () => {
    assert.equal(
      normalizeScanUrl('  https://example.com/path  ').toString(),
      'https://example.com/path'
    )
  })

  it('keeps explicit http and https protocols', () => {
    assert.equal(normalizeScanUrl('http://example.com').toString(), 'http://example.com/')
    assert.equal(normalizeScanUrl('https://example.com').toString(), 'https://example.com/')
  })

  it('allows bare domains with ports', () => {
    assert.equal(
      normalizeScanUrl('example.com:8443/status').toString(),
      'https://example.com:8443/status'
    )
  })

  it('rejects unsupported explicit protocols', () => {
    assert.throws(
      () => normalizeScanUrl('ftp://example.com'),
      /Only http:\/\/ and https:\/\//
    )
    assert.throws(
      () => normalizeScanUrl('file:///etc/passwd'),
      /Only http:\/\/ and https:\/\//
    )
  })

  it('rejects internal whitespace instead of silently rewriting input', () => {
    assert.throws(() => normalizeScanUrl('goo gle.com'), /cannot contain spaces/)
  })

  it('removes URL fragments because they are not sent over HTTP', () => {
    assert.equal(
      normalizeScanUrl('https://example.com/docs#pricing').toString(),
      'https://example.com/docs'
    )
  })
})
