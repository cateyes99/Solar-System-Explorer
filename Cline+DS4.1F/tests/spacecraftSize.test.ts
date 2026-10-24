import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_SPACECRAFT_SIZE,
  SPACECRAFT_SIZE_LEVELS,
  SPACECRAFT_SIZE_MAX,
  SPACECRAFT_SIZE_MIN,
  clampSpacecraftSize,
  spacecraftScaleForLevel,
} from '../src/utils/spacecraftSize.ts'

/**
 * The spacecraft's size levels. Run with `npm test` (Node's built-in test
 * runner; no extra dependencies).
 */

test('every level n scales the model by n / 10', () => {
  for (let level = SPACECRAFT_SIZE_MIN; level <= SPACECRAFT_SIZE_MAX; level += 1) {
    assert.equal(spacecraftScaleForLevel(level), level / SPACECRAFT_SIZE_LEVELS)
  }
})

test('the end points and a middle level are the expected factors', () => {
  assert.equal(spacecraftScaleForLevel(1), 0.1)
  assert.equal(spacecraftScaleForLevel(4), 0.4)
  assert.equal(spacecraftScaleForLevel(10), 1)
})

test('the default size is level 4 — 40% of full size', () => {
  assert.equal(DEFAULT_SPACECRAFT_SIZE, 4)
  assert.equal(spacecraftScaleForLevel(DEFAULT_SPACECRAFT_SIZE), 0.4)
})

test('levels are clamped to the range and rounded to a whole level', () => {
  assert.equal(spacecraftScaleForLevel(0), 0.1)
  assert.equal(spacecraftScaleForLevel(-3), 0.1)
  assert.equal(spacecraftScaleForLevel(99), 1)
  assert.equal(spacecraftScaleForLevel(4.4), 0.4)
  assert.equal(spacecraftScaleForLevel(4.6), 0.5)
})

test('a non-finite level falls back to the default', () => {
  const fallback = DEFAULT_SPACECRAFT_SIZE / SPACECRAFT_SIZE_LEVELS
  assert.equal(spacecraftScaleForLevel(Number.NaN), fallback)
  assert.equal(spacecraftScaleForLevel(Number.POSITIVE_INFINITY), fallback)
})

test('clampSpacecraftSize returns a whole level inside the range', () => {
  assert.equal(clampSpacecraftSize(3.7), 4)
  assert.equal(clampSpacecraftSize(-5), SPACECRAFT_SIZE_MIN)
  assert.equal(clampSpacecraftSize(100), SPACECRAFT_SIZE_MAX)
})
