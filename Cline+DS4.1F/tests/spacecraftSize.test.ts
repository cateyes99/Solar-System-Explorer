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

test('every level n scales the model by n / 100', () => {
  for (let level = SPACECRAFT_SIZE_MIN; level <= SPACECRAFT_SIZE_MAX; level += 1) {
    assert.equal(spacecraftScaleForLevel(level), level / SPACECRAFT_SIZE_LEVELS)
  }
})

test('the range is 1…100 and level 100 is full size', () => {
  assert.equal(SPACECRAFT_SIZE_MIN, 1)
  assert.equal(SPACECRAFT_SIZE_MAX, 100)
  assert.equal(SPACECRAFT_SIZE_LEVELS, 100)
  assert.equal(spacecraftScaleForLevel(100), 1)
})

test('representative levels map to their percentages', () => {
  assert.equal(spacecraftScaleForLevel(1), 0.01)
  assert.equal(spacecraftScaleForLevel(10), 0.1)
  assert.equal(spacecraftScaleForLevel(25), 0.25)
  assert.equal(spacecraftScaleForLevel(50), 0.5)
  assert.equal(spacecraftScaleForLevel(100), 1)
})

test('the default size is level 10 — 10% of full size', () => {
  assert.equal(DEFAULT_SPACECRAFT_SIZE, 10)
  assert.equal(spacecraftScaleForLevel(DEFAULT_SPACECRAFT_SIZE), 0.1)
})

test('levels are clamped to the range and rounded to a whole level', () => {
  assert.equal(spacecraftScaleForLevel(0), 0.01)
  assert.equal(spacecraftScaleForLevel(-3), 0.01)
  assert.equal(spacecraftScaleForLevel(101), 1)
  assert.equal(spacecraftScaleForLevel(24.4), 0.24)
  assert.equal(spacecraftScaleForLevel(24.6), 0.25)
})

test('a non-finite level falls back to the default', () => {
  const fallback = DEFAULT_SPACECRAFT_SIZE / SPACECRAFT_SIZE_LEVELS
  assert.equal(spacecraftScaleForLevel(Number.NaN), fallback)
  assert.equal(spacecraftScaleForLevel(Number.POSITIVE_INFINITY), fallback)
})

test('clampSpacecraftSize returns a whole level inside the range', () => {
  assert.equal(clampSpacecraftSize(24.7), 25)
  assert.equal(clampSpacecraftSize(-5), SPACECRAFT_SIZE_MIN)
  assert.equal(clampSpacecraftSize(1000), SPACECRAFT_SIZE_MAX)
})
