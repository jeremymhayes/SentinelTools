import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { analyzeScripts } from './analyze.ts'

describe('analyzeScripts', () => {
  it('reports third-party script hosts and ignores first-party hosts', () => {
    const scripts = analyzeScripts(
      [
        '<script src="/app.js"></script>',
        '<script src="https://cdn.example.com/app.js"></script>',
        '<script src="https://www.googletagmanager.com/gtm.js"></script>',
      ].join(''),
      'example.com'
    )

    assert.deepEqual(
      scripts.map((script) => script.host),
      ['www.googletagmanager.com']
    )
  })
})
