import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { gradeForScore, scoreFindings, SEVERITY_PENALTY } from './scoring.ts'
import type { Finding, Severity } from './types.ts'

const finding = (severity: Severity, title = `${severity} finding`): Finding => ({
  id: 'F-XX',
  severity,
  title,
  category: 'Test',
  summary: 'test',
})

describe('gradeForScore', () => {
  it('maps the documented bands', () => {
    assert.equal(gradeForScore(100), 'Strong')
    assert.equal(gradeForScore(90), 'Strong')
    assert.equal(gradeForScore(89), 'Good')
    assert.equal(gradeForScore(70), 'Good')
    assert.equal(gradeForScore(69), 'Caution')
    assert.equal(gradeForScore(50), 'Caution')
    assert.equal(gradeForScore(49), 'Risky')
    assert.equal(gradeForScore(30), 'Risky')
    assert.equal(gradeForScore(29), 'High Risk')
    assert.equal(gradeForScore(0), 'High Risk')
  })
})

describe('scoreFindings', () => {
  it('returns a perfect score for no findings', () => {
    const result = scoreFindings([])
    assert.equal(result.score, 100)
    assert.equal(result.grade, 'Strong')
    assert.equal(result.verdict, 'ok')
    assert.deepEqual(result.breakdown, [])
  })

  it('passing checks cost nothing', () => {
    const result = scoreFindings([finding('ok'), finding('ok')])
    assert.equal(result.score, 100)
    assert.equal(result.severityCounts.ok, 2)
    assert.deepEqual(result.breakdown, [])
  })

  it('subtracts the documented penalty per severity', () => {
    for (const severity of ['low', 'medium', 'high', 'critical'] as const) {
      const result = scoreFindings([finding(severity)])
      assert.equal(result.score, 100 - SEVERITY_PENALTY[severity])
    }
  })

  it('accumulates penalties across findings', () => {
    const result = scoreFindings([
      finding('low'),
      finding('medium'),
      finding('high'),
    ])
    assert.equal(result.score, 100 - 3 - 7 - 14)
    assert.equal(result.breakdown.length, 3)
  })

  it('clamps at zero', () => {
    const result = scoreFindings(Array.from({ length: 6 }, () => finding('critical')))
    assert.equal(result.score, 0)
    assert.equal(result.grade, 'High Risk')
  })

  it('verdict is the worst severity present', () => {
    const result = scoreFindings([finding('low'), finding('high'), finding('ok')])
    assert.equal(result.verdict, 'high')
  })

  it('breakdown explains every deduction by title', () => {
    const result = scoreFindings([finding('medium', 'Missing LICENSE')])
    assert.deepEqual(result.breakdown, [{ label: 'Missing LICENSE', delta: -7 }])
  })
})
