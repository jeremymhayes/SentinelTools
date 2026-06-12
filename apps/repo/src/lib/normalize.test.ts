import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizeRepoInput } from './normalize.ts'

describe('normalizeRepoInput', () => {
  it('accepts owner/repo shorthand', () => {
    assert.deepEqual(normalizeRepoInput('vercel/next.js'), {
      owner: 'vercel',
      repo: 'next.js',
    })
  })

  it('accepts full https URLs', () => {
    assert.deepEqual(normalizeRepoInput('https://github.com/vercel/next.js'), {
      owner: 'vercel',
      repo: 'next.js',
    })
  })

  it('accepts github.com URLs without protocol', () => {
    assert.deepEqual(normalizeRepoInput('github.com/torvalds/linux'), {
      owner: 'torvalds',
      repo: 'linux',
    })
  })

  it('accepts www.github.com', () => {
    assert.deepEqual(
      normalizeRepoInput('https://www.github.com/torvalds/linux'),
      { owner: 'torvalds', repo: 'linux' }
    )
  })

  it('strips .git suffixes', () => {
    assert.deepEqual(
      normalizeRepoInput('https://github.com/owner/project.git'),
      { owner: 'owner', repo: 'project' }
    )
  })

  it('ignores deeper paths (tree, blob, issues)', () => {
    assert.deepEqual(
      normalizeRepoInput('https://github.com/owner/repo/tree/main/src'),
      { owner: 'owner', repo: 'repo' }
    )
  })

  it('trims surrounding whitespace', () => {
    assert.deepEqual(normalizeRepoInput('  owner/repo  '), {
      owner: 'owner',
      repo: 'repo',
    })
  })

  it('rejects empty input', () => {
    assert.throws(() => normalizeRepoInput('   '), /Enter a GitHub repository/)
  })

  it('rejects non-GitHub hosts', () => {
    assert.throws(
      () => normalizeRepoInput('https://gitlab.com/owner/repo'),
      /Only public github\.com/
    )
  })

  it('rejects a bare owner with no repo', () => {
    assert.throws(() => normalizeRepoInput('just-an-owner'), /owner\/repo/)
  })

  it('rejects invalid characters', () => {
    assert.throws(
      () => normalizeRepoInput('owner/re po'),
      /invalid characters|owner\/repo/
    )
  })
})
