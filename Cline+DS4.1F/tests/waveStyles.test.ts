import test from 'node:test'
import assert from 'node:assert/strict'
import type { WaveStyleId } from '../src/types.ts'
import {
  DEFAULT_WAVE_STYLE,
  WAVE_STYLES,
  isWaveStyleId,
  waveStyleFor,
} from '../src/data/waveStyles.ts'

/**
 * The wave-model registry. Run with `npm test`.
 *
 * The guarantees that matter: the app defaults to the procedural "spectral" sea,
 * the switcher offers both models in a stable order, every listed style is
 * recognised (and nothing else is), and an unknown id falls back to the default.
 */

test('the default wave model is the procedural "spectral" sea', () => {
  assert.equal(DEFAULT_WAVE_STYLE, 'spectral')
  assert.equal(waveStyleFor(DEFAULT_WAVE_STYLE).id, 'spectral')
})

test('the switcher offers the spectral sea and the tiling ripples, in that order', () => {
  assert.deepEqual(
    WAVE_STYLES.map((style) => style.id),
    ['spectral', 'ripples'],
  )
})

test('every listed style is recognised, and nothing else is', () => {
  for (const style of WAVE_STYLES) {
    assert.ok(isWaveStyleId(style.id))
  }
  assert.ok(!isWaveStyleId('option-c'))
  assert.ok(!isWaveStyleId(undefined))
  assert.ok(!isWaveStyleId(3))
})

test('an unknown or missing style id falls back to the default entry', () => {
  assert.equal(waveStyleFor('nope' as WaveStyleId).id, DEFAULT_WAVE_STYLE)
  assert.equal(waveStyleFor(undefined).id, DEFAULT_WAVE_STYLE)
})
