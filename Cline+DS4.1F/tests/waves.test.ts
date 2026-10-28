import test from 'node:test'
import assert from 'node:assert/strict'
import {
  WAVE_BASELINE_NORMAL_SCALE,
  WAVE_INTENSITY_BASELINE,
  WAVE_INTENSITY_DEFAULT,
  WAVE_MAX_NORMAL_SCALE,
  WAVE_MAX_SPEED_SCALE,
  waveParams,
} from '../src/utils/waves.ts'

/**
 * The "Wave intensity" slider's mapping. Run with `npm test`.
 *
 * The guarantees that matter: 0% is completely still, 25% reproduces the ocean
 * exactly as it shipped, 100% reaches the tuned maximum, the curves never
 * overshoot, and intermediate values move smoothly between them.
 */

test('the default is the baseline (25%), i.e. the shipped look', () => {
  assert.equal(WAVE_INTENSITY_DEFAULT, 0.25)
  assert.equal(WAVE_INTENSITY_DEFAULT, WAVE_INTENSITY_BASELINE)
})

test('0% stops the ocean completely', () => {
  assert.deepEqual(waveParams(0), {
    normalScale: 0,
    driftScale: 0,
    variability: 0,
    coastal: 0,
  })
})

test('25% reproduces the shipped baseline exactly', () => {
  const params = waveParams(WAVE_INTENSITY_BASELINE)
  assert.ok(Math.abs(params.normalScale - WAVE_BASELINE_NORMAL_SCALE) < 1e-12)
  assert.ok(Math.abs(params.driftScale - 1) < 1e-12)
  assert.equal(params.variability, 0)
  assert.equal(params.coastal, 0)
})

test('100% reaches the tuned maximum', () => {
  const params = waveParams(1)
  assert.ok(Math.abs(params.normalScale - WAVE_MAX_NORMAL_SCALE) < 1e-12)
  assert.ok(Math.abs(params.driftScale - WAVE_MAX_SPEED_SCALE) < 1e-12)
  assert.equal(params.variability, 1)
  assert.equal(params.coastal, 1)
})

test('every property rises monotonically with intensity', () => {
  let previous = waveParams(0)
  for (let i = 1; i <= 100; i += 1) {
    const next = waveParams(i / 100)
    assert.ok(next.normalScale >= previous.normalScale)
    assert.ok(next.driftScale >= previous.driftScale)
    assert.ok(next.variability >= previous.variability)
    assert.ok(next.coastal >= previous.coastal)
    previous = next
  }
})

test('the amplitude curve saturates rather than running away', () => {
  // A linear map would put the maximum at 0.45 / 0.25 = 1.8; the saturating
  // curve holds it at 1.05 so the ripple map cannot sparkle at full strength.
  assert.ok(WAVE_MAX_NORMAL_SCALE < WAVE_BASELINE_NORMAL_SCALE / WAVE_INTENSITY_BASELINE)
  // It is still a real increase over the baseline.
  assert.ok(WAVE_MAX_NORMAL_SCALE > WAVE_BASELINE_NORMAL_SCALE * 2)
})

test('the two new effects stay dormant through the baseline', () => {
  // Variability and coastal interaction must not appear until well above 25%,
  // so the shipped look is preserved.
  for (const w of [0, 0.1, 0.2, WAVE_INTENSITY_BASELINE]) {
    const params = waveParams(w)
    assert.equal(params.variability, 0)
    assert.equal(params.coastal, 0)
  }
})

test('an out-of-range intensity is clamped', () => {
  assert.deepEqual(waveParams(-1), waveParams(0))
  assert.deepEqual(waveParams(2), waveParams(1))
})
