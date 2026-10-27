import test from 'node:test'
import assert from 'node:assert/strict'
import type { SeawaterModeId } from '../src/types.ts'
import {
  DEFAULT_SEAWATER_MODE,
  SEAWATER_MODES,
  isSeawaterModeId,
  seafloorOpacityFor,
  seawaterModeFor,
} from '../src/data/seawaterModes.ts'

/**
 * The ocean-mode registry. Run with `npm test`.
 *
 * The guarantees that matter: the app defaults to the cheaper "surface" mode,
 * every listed mode is recognised (and nothing else is), and the shared slider
 * maps onto the surface material's opacity in the documented way per mode.
 */

test('the default mode is the cheaper "surface" implementation', () => {
  assert.equal(DEFAULT_SEAWATER_MODE, 'surface')
  assert.equal(seawaterModeFor(DEFAULT_SEAWATER_MODE).id, 'surface')
})

test('every listed mode is recognised, and nothing else is', () => {
  for (const mode of SEAWATER_MODES) {
    assert.ok(isSeawaterModeId(mode.id))
  }
  assert.ok(!isSeawaterModeId('option-c'))
  assert.ok(!isSeawaterModeId(undefined))
  assert.ok(!isSeawaterModeId(3))
})

test('an unknown or missing mode id falls back to the default entry', () => {
  assert.equal(seawaterModeFor('nope' as SeawaterModeId).id, DEFAULT_SEAWATER_MODE)
  assert.equal(seawaterModeFor(undefined).id, DEFAULT_SEAWATER_MODE)
})

test('a fading mode passes the slider straight to the surface opacity', () => {
  const mode = seawaterModeFor('surface')
  assert.equal(seafloorOpacityFor(mode, 0), 0)
  assert.equal(seafloorOpacityFor(mode, 0.5), 0.5)
  assert.equal(seafloorOpacityFor(mode, 1), 1)
})

test('a layered mode pins the surface fully drained', () => {
  const mode = seawaterModeFor('volumetric')
  assert.equal(seafloorOpacityFor(mode, 0), 0)
  assert.equal(seafloorOpacityFor(mode, 0.5), 0)
  assert.equal(seafloorOpacityFor(mode, 1), 0)
})

test('only the layered mode draws the separate water layer', () => {
  assert.equal(seawaterModeFor('surface').layeredWater, false)
  assert.equal(seawaterModeFor('volumetric').layeredWater, true)
})
