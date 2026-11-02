// Unit tests for src/lib/progress.ts (pure selectors). Run: node scripts/test-progress.mjs
import assert from 'node:assert/strict'
import { frontierOf, isBlockComplete, isOptionalStep } from '../src/lib/progress.ts'

const steps = [
  { key: 'a:worked', block: 0 },
  { key: 'e1', block: 0, ex: { id: 'e1', type: 'predict' } },
  { key: 'e3', block: 0, ex: { id: 'e3', type: 'write', twin: 'e4' } },
  { key: 'e4', block: 0, ex: { id: 'e4', type: 'write', twin: 'e3' } },
  { key: 'f1', block: 1, ex: { id: 'f1', type: 'predict' } },
]
const done = (clean = true) => ({ done: true, clean })
let n = 0
const t = (name, fn) => {
  fn()
  n++
  console.log('ok  ' + name)
}

t('twin is optional after a clean solve', () => {
  const recs = { 'a:worked': done(), e1: done(), e3: done(true) }
  assert.equal(isOptionalStep(steps, 3, recs), true)
  assert.equal(isBlockComplete(steps, 0, recs), true)
  assert.equal(frontierOf(steps, recs), 4)
})

t('twin is required after a solve with a hint or a reveal', () => {
  const recs = { 'a:worked': done(), e1: done(), e3: done(false) }
  assert.equal(isOptionalStep(steps, 3, recs), false)
  assert.equal(isBlockComplete(steps, 0, recs), false)
  assert.equal(frontierOf(steps, recs), 3)
})

t('a skipped optional twin (recorded done, not clean) still completes the block', () => {
  const recs = { 'a:worked': done(), e1: done(), e3: done(true), e4: done(false) }
  assert.equal(isBlockComplete(steps, 0, recs), true)
})

t('the first of a pair is never optional', () => {
  assert.equal(isOptionalStep(steps, 2, { e4: done(true) }), false)
})

t('an unfinished block is incomplete and the frontier points at its first open step', () => {
  const recs = { 'a:worked': done() }
  assert.equal(isBlockComplete(steps, 0, recs), false)
  assert.equal(frontierOf(steps, recs), 1)
})

t('all blocks done puts the frontier at the quiz', () => {
  const recs = { 'a:worked': done(), e1: done(), e3: done(true), f1: done() }
  assert.equal(frontierOf(steps, recs), steps.length)
})

console.log(`${n} passed`)
