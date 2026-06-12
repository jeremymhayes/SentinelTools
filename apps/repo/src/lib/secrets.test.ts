import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { maskSecret, scanForSecrets } from './secrets.ts'

describe('maskSecret', () => {
  it('keeps only the requested prefix', () => {
    const masked = maskSecret('AKIAIOSFODNN7EXAMPLE', 4)
    assert.ok(masked.startsWith('AKIA'))
    assert.ok(!masked.includes('IOSFODNN7EXAMPLE'))
    assert.match(masked.slice(4), /^\*+$/)
  })

  it('caps the visible mask length so secret length is not leaked exactly', () => {
    const masked = maskSecret('x'.repeat(500), 0)
    assert.ok(masked.length <= 24)
  })
})

describe('scanForSecrets', () => {
  it('finds an AWS access key with path and line number', () => {
    const hits = scanForSecrets(
      'config/prod.env',
      'REGION=us-east-1\nAWS_KEY=AKIAIOSFODNN7EXAMPLE\n'
    )
    assert.equal(hits.length, 1)
    assert.equal(hits[0].patternName, 'AWS access key ID')
    assert.equal(hits[0].path, 'config/prod.env')
    assert.equal(hits[0].line, 2)
  })

  it('never returns the raw secret in any field', () => {
    const secret = 'AKIAIOSFODNN7EXAMPLE'
    const hits = scanForSecrets('.env', `key=${secret}`)
    const serialized = JSON.stringify(hits)
    assert.ok(!serialized.includes(secret))
  })

  it('detects GitHub tokens', () => {
    const hits = scanForSecrets(
      '.env',
      `GH=ghp_${'a'.repeat(36)}`
    )
    assert.equal(hits[0]?.patternName, 'GitHub token')
  })

  it('detects private key blocks', () => {
    const hits = scanForSecrets(
      'deploy/key.pem',
      '-----BEGIN RSA PRIVATE KEY-----\nMIIEow...\n'
    )
    assert.equal(hits[0]?.patternName, 'Private key block')
  })

  it('detects generic assigned secrets and masks the value', () => {
    const hits = scanForSecrets(
      'settings.py',
      'api_key = "abcdef0123456789abcdef0123456789"'
    )
    assert.equal(hits[0]?.patternName, 'Generic assigned secret')
    assert.ok(!hits[0].maskedPreview.includes('0123456789abcdef0123456789'))
  })

  it('detects credentials embedded in connection strings', () => {
    const hits = scanForSecrets(
      '.env',
      'DATABASE_URL=postgres://admin:hunter22secret@db.example.com:5432/app'
    )
    assert.equal(hits[0]?.patternName, 'Connection string credential')
    assert.ok(!JSON.stringify(hits).includes('hunter22secret'))
  })

  it('returns nothing for ordinary text', () => {
    const hits = scanForSecrets(
      'README.md',
      'This project uses environment variables for configuration.\nSee docs.'
    )
    assert.deepEqual(hits, [])
  })
})
