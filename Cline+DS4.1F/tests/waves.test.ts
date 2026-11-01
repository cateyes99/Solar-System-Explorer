import test from 'node:test'
import assert from 'node:assert/strict'
import { WAVE_INTENSITY_DEFAULT, waveParams } from '../src/utils/waves.ts'

/**
 * The "Wave intensity" slider's mapping. Run with `npm test`.
 *
 * The guarantees that matter: 0% is completely still, the default is already a
 * convincing sea, 100% reaches the maximum, the curves never overshoot, and
 * intermediate values move smoothly between them.
 */

test('the default is 25%', () => {
  assert.equal(WAVE_INTENSITY_DEFAULT, 0.25)
})

test('0% stops the ocean completely', () => {
  assert.deepEqual(waveParams(0), {
    amplitude: 0,
    speed: 0,
    variability: 0,
    coastal: 0,
  })
})

test('every property reaches 1 at full intensity', () => {
  const params = waveParams(1)
  assert.ok(Math.abs(params.amplitude - 1) < 1e-12)
  assert.ok(Math.abs(params.speed - 1) < 1e-12)
  assert.equal(params.variability, 1)
  assert.equal(params.coastal, 1)
})

test('every property rises monotonically with intensity', () => {
  let previous = waveParams(0)
  for (let i = 1; i <= 100; i += 1) {
    const next = waveParams(i / 100)
    assert.ok(next.amplitude >= previous.amplitude)
    assert.ok(next.speed >= previous.speed)
    assert.ok(next.variability >= previous.variability)
    assert.ok(next.coastal >= previous.coastal)
    previous = next
  }
})

test('amplitude and speed rise steeply, so the default is already a real sea', () => {
  // A linear map would leave 25% at a quarter strength; the curve puts it well
  // above that, so the out-of-the-box ocean is lively rather than faint.
  const params = waveParams(WAVE_INTENSITY_DEFAULT)
  assert.ok(params.amplitude > 0.4)
  assert.ok(params.speed >= 0.5)
  // ...but they still flatten toward the top rather than overshooting.
  assert.ok(params.amplitude <= 1)
  assert.ok(params.speed <= 1)
})

test('the chop and the surf stay dormant in a gentle sea', () => {
  for (const w of [0, 0.1, 0.2]) {
    const params = waveParams(w)
    assert.equal(params.coastal, 0)
  }
  // The very gentlest seas have almost no chop.
  assert.ok(waveParams(0.1).variability < 0.05)
})

test('an out-of-range intensity is clamped', () => {
  assert.deepEqual(waveParams(-1), waveParams(0))
  assert.deepEqual(waveParams(2), waveParams(1))
})
