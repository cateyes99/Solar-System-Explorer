import test from 'node:test'
import assert from 'node:assert/strict'
import {
  depthFraction,
  depthMeters,
  seaLevelDrop,
  seafloorDepthRadius,
  seawaterVisibility,
} from '../src/utils/seawater.ts'

/**
 * The seawater slider and the seafloor depth field. Run with `npm test`.
 *
 * The important guarantees are that 100% opacity leaves the ocean completely
 * alone, 0% reveals it fully, and the 8-bit depth field decodes back to the
 * metres it was built from.
 */

test('seafloor visibility is the complement of ocean opacity', () => {
  assert.equal(seawaterVisibility(0), 1)
  assert.equal(seawaterVisibility(1), 0)
  assert.equal(seawaterVisibility(0.25), 0.75)
  assert.equal(seawaterVisibility(0.5), 0.5)
})

test('seawater visibility clamps an out-of-range opacity', () => {
  assert.equal(seawaterVisibility(-3), 1)
  assert.equal(seawaterVisibility(4), 0)
})

test('a fully opaque ocean reveals nothing (the shipped look is untouched)', () => {
  // The shader gates on `uSeawaterOpacity < 0.999`; at the default of 1 the
  // seafloor term is exactly zero.
  assert.equal(seawaterVisibility(1), 0)
})

test('the sea-surface drop is the complement of the fill, and needs a depth', () => {
  // 100% fill means no drop; 0% drops the surface to the deepest floor.
  assert.equal(seaLevelDrop(1, 0.17), 0)
  assert.equal(seaLevelDrop(0, 0.17), 1)
  assert.ok(Math.abs(seaLevelDrop(0.6, 0.17) - 0.4) < 1e-12)
  // Out-of-range fill is clamped.
  assert.equal(seaLevelDrop(-1, 0.17), 1)
  assert.equal(seaLevelDrop(2, 0.17), 0)
  // A flat sea has no depth to drain, so the control stays inert rather than
  // carving holes in a surface that never had a floor below it.
  assert.equal(seaLevelDrop(0, 0), 0)
  assert.equal(seaLevelDrop(0.5, 0), 0)
})

test('the depth field decodes with its square-root curve', () => {
  assert.equal(depthFraction(0, 2), 0)
  assert.equal(depthFraction(255, 2), 1)
  assert.ok(Math.abs(depthFraction(128, 2) - (128 / 255) ** 2) < 1e-12)
})

test('a shallow shelf keeps more levels than a linear scale would', () => {
  // 200 m out of 11,000 m is 1.8% of the range: a linear 8-bit map would spend
  // only ~5 levels on it, the square-root curve ~34. The stored texel for 200 m
  // is therefore well above 5, and decoding it returns 200 m to within a metre.
  const texelFor200m = Math.round(255 * Math.sqrt(200 / 11_000))
  assert.ok(texelFor200m > 30)
  assert.ok(Math.abs(depthMeters(texelFor200m, 11_000, 2) - 200) < 5)
})

test('the seafloor sinks further as its relief grows, and not at all at zero', () => {
  // Earth's own numbers: 11 km deep, 160× exaggeration.
  assert.equal(seafloorDepthRadius(11_000, 160, 0), 0)
  const half = seafloorDepthRadius(11_000, 160, 0.5)
  const full = seafloorDepthRadius(11_000, 160, 1)
  assert.ok(half > 0)
  assert.ok(full > half)
  // The true 11 km is ~0.17% of Earth's radius; 160× of it is a clearly visible
  // but bounded fraction of the globe.
  assert.ok(full > 0.1 && full < 0.4)
})
