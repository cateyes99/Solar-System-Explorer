import test from 'node:test'
import assert from 'node:assert/strict'
import {
  WAVE_BASELINE_NORMAL_SCALE,
  WAVE_INTENSITY_BASELINE,
  WAVE_INTENSITY_DEFAULT,
  WAVE_MAX_NORMAL_SCALE,
  WAVE_MAX_SPEED_SCALE,
  rippleParams,
  spectralWaveParams,
} from '../src/utils/waves.ts'

/**
 * The "Wave intensity" slider's mapping, for both wave styles. Run with
 * `npm test`.
 *
 * The guarantees that matter: 0% is completely still in either style, the
 * spectral default is already a convincing sea, the ripple baseline (25%)
 * reproduces the tiled ocean exactly as it shipped, 100% reaches each maximum,
 * the curves never overshoot, and intermediate values move smoothly.
 */

test('the default is 25%', () => {
  assert.equal(WAVE_INTENSITY_DEFAULT, 0.25)
  assert.equal(WAVE_INTENSITY_DEFAULT, WAVE_INTENSITY_BASELINE)
})

/* --- The spectral (procedural) style ------------------------------------- */

test('0% stops the spectral sea completely', () => {
  assert.deepEqual(spectralWaveParams(0), {
    amplitude: 0,
    speed: 0,
    variability: 0,
    coastal: 0,
  })
})

test('every spectral property reaches 1 at full intensity', () => {
  const params = spectralWaveParams(1)
  assert.ok(Math.abs(params.amplitude - 1) < 1e-12)
  assert.ok(Math.abs(params.speed - 1) < 1e-12)
  assert.equal(params.variability, 1)
  assert.equal(params.coastal, 1)
})

test('every spectral property rises monotonically with intensity', () => {
  let previous = spectralWaveParams(0)
  for (let i = 1; i <= 100; i += 1) {
    const next = spectralWaveParams(i / 100)
    assert.ok(next.amplitude >= previous.amplitude)
    assert.ok(next.speed >= previous.speed)
    assert.ok(next.variability >= previous.variability)
    assert.ok(next.coastal >= previous.coastal)
    previous = next
  }
})

test('spectral amplitude and speed rise steeply, so the default is already a real sea', () => {
  // A linear map would leave 25% at a quarter strength; the curve puts it well
  // above that, so the out-of-the-box ocean is lively rather than faint.
  const params = spectralWaveParams(WAVE_INTENSITY_DEFAULT)
  assert.ok(params.amplitude > 0.4)
  assert.ok(params.speed >= 0.5)
  // ...but they still flatten toward the top rather than overshooting.
  assert.ok(params.amplitude <= 1)
  assert.ok(params.speed <= 1)
})

test('the spectral chop and surf stay dormant in a gentle sea', () => {
  for (const w of [0, 0.1, 0.2]) {
    assert.equal(spectralWaveParams(w).coastal, 0)
  }
  // The very gentlest seas have almost no chop.
  assert.ok(spectralWaveParams(0.1).variability < 0.05)
})

test('an out-of-range spectral intensity is clamped', () => {
  assert.deepEqual(spectralWaveParams(-1), spectralWaveParams(0))
  assert.deepEqual(spectralWaveParams(2), spectralWaveParams(1))
})

/* --- The ripples (tiling) style ------------------------------------------ */

test('0% stops the tiled ripples completely', () => {
  assert.deepEqual(rippleParams(0), {
    normalScale: 0,
    driftScale: 0,
    variability: 0,
    coastal: 0,
    fadeStrength: 0,
  })
})

test('the ripple baseline (25%) reproduces the shipped ocean exactly', () => {
  const params = rippleParams(WAVE_INTENSITY_BASELINE)
  assert.ok(Math.abs(params.normalScale - WAVE_BASELINE_NORMAL_SCALE) < 1e-12)
  assert.ok(Math.abs(params.driftScale - 1) < 1e-12)
  assert.equal(params.variability, 0)
  assert.equal(params.coastal, 0)
  assert.equal(params.fadeStrength, 0)
})

test('the ripple curves reach their tuned maximum at 100%', () => {
  const params = rippleParams(1)
  assert.ok(Math.abs(params.normalScale - WAVE_MAX_NORMAL_SCALE) < 1e-12)
  assert.ok(Math.abs(params.driftScale - WAVE_MAX_SPEED_SCALE) < 1e-12)
  assert.equal(params.variability, 1)
  assert.equal(params.coastal, 1)
  assert.ok(Math.abs(params.fadeStrength - 1) < 1e-12)
})

test('every ripple property rises monotonically with intensity', () => {
  let previous = rippleParams(0)
  for (let i = 1; i <= 100; i += 1) {
    const next = rippleParams(i / 100)
    assert.ok(next.normalScale >= previous.normalScale)
    assert.ok(next.driftScale >= previous.driftScale)
    assert.ok(next.variability >= previous.variability)
    assert.ok(next.coastal >= previous.coastal)
    assert.ok(next.fadeStrength >= previous.fadeStrength)
    previous = next
  }
})

test('the ripple amplitude curve saturates rather than running away', () => {
  // A linear map would put the maximum at 0.45 / 0.25 = 1.8; the saturating
  // curve holds it at 1.05 so the ripple map cannot sparkle at full strength.
  assert.ok(WAVE_MAX_NORMAL_SCALE < WAVE_BASELINE_NORMAL_SCALE / WAVE_INTENSITY_BASELINE)
  // It is still a real increase over the baseline.
  assert.ok(WAVE_MAX_NORMAL_SCALE > WAVE_BASELINE_NORMAL_SCALE * 2)
})

test('the ripple detail, surf and fade stay dormant through the baseline', () => {
  // They must not appear until well above 25%, so the shipped look is preserved.
  for (const w of [0, 0.1, 0.2, WAVE_INTENSITY_BASELINE]) {
    const params = rippleParams(w)
    assert.equal(params.variability, 0)
    assert.equal(params.coastal, 0)
    assert.equal(params.fadeStrength, 0)
  }
})

test('the ripple view/distance fade only engages above the baseline', () => {
  // Halfway between the baseline and the maximum, it is about half way.
  const mid = (WAVE_INTENSITY_BASELINE + 1) / 2
  assert.ok(Math.abs(rippleParams(mid).fadeStrength - 0.5) < 1e-12)
})

test('an out-of-range ripple intensity is clamped', () => {
  assert.deepEqual(rippleParams(-1), rippleParams(0))
  assert.deepEqual(rippleParams(2), rippleParams(1))
})
