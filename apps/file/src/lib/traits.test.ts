import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { analyzeFileTraits, formatBytes, getExtensions } from './traits.ts'

/* analyzeFileTraits only reads name/size/type, so a plain object stands in
   for a real File in tests. */
const fakeFile = (name: string, type = '', size = 1024): File =>
  ({ name, type, size }) as File

const flagged = (file: File) =>
  analyzeFileTraits(file).filter((finding) => finding.severity !== 'ok')

describe('getExtensions', () => {
  it('returns all extensions in order', () => {
    assert.deepEqual(getExtensions('invoice.pdf.exe'), ['pdf', 'exe'])
  })

  it('returns empty for extensionless names', () => {
    assert.deepEqual(getExtensions('README'), [])
  })
})

describe('analyzeFileTraits', () => {
  it('flags document.exe double extensions as high', () => {
    const findings = flagged(fakeFile('invoice.pdf.exe'))
    const doubleExt = findings.find((f) => f.title.includes('double extension'))
    assert.ok(doubleExt)
    assert.equal(doubleExt.severity, 'high')
  })

  it('flags bare executables as medium, not high', () => {
    const findings = flagged(fakeFile('setup.exe'))
    const exe = findings.find((f) => f.title.includes('Executable'))
    assert.ok(exe)
    assert.equal(exe.severity, 'medium')
  })

  it('flags script extensions (.ps1)', () => {
    const findings = flagged(fakeFile('cleanup.ps1'))
    assert.ok(findings.some((f) => f.category === 'Naming'))
  })

  it('does not flag ordinary documents', () => {
    const findings = flagged(fakeFile('thesis.pdf', 'application/pdf'))
    assert.deepEqual(findings, [])
  })

  it('flags MIME/extension mismatches', () => {
    const findings = flagged(fakeFile('photo.png', 'application/x-msdownload'))
    assert.ok(findings.some((f) => f.title.includes('MIME/extension mismatch')))
  })

  it('accepts matching MIME prefixes', () => {
    const findings = flagged(fakeFile('clip.mp4', 'video/mp4'))
    assert.deepEqual(findings, [])
  })

  it('flags files over 1 GiB as very large', () => {
    const findings = flagged(
      fakeFile('archive.zip', 'application/zip', 2 * 1024 ** 3)
    )
    assert.ok(findings.some((f) => f.title === 'Very large file'))
  })

  it('uses indicator language, never verdict language', () => {
    const findings = analyzeFileTraits(fakeFile('invoice.pdf.exe'))
    const text = JSON.stringify(findings).toLowerCase()
    for (const banned of ['virus-free', '100% safe', 'is clean', 'malware-free']) {
      assert.ok(!text.includes(banned), `banned phrase present: ${banned}`)
    }
  })
})

describe('formatBytes', () => {
  it('formats common sizes', () => {
    assert.equal(formatBytes(512), '512 B')
    assert.equal(formatBytes(2048), '2.0 KiB')
    assert.equal(formatBytes(5 * 1024 ** 2), '5.0 MiB')
  })
})
