import test from 'node:test'
import assert from 'node:assert/strict'
import { waterMaskFromColor } from '../src/utils/waterMask.ts'

/**
 * The day-map water classifier. Run with `npm test`.
 *
 * The case that matters is the Arctic ice cap. Sea ice is bright and only faintly
 * blue, so a raw blue-lead test marked it as water — which is what put the ocean's
 * waves and the seafloor drop onto the ice. The classifier must call the ice land
 * while still calling every kind of sea water. The colours below are sampled from
 * the shipped 8K day map.
 */

test('open ocean is water', () => {
  assert.ok(waterMaskFromColor(30, 59, 117) > 0.95, 'deep ocean')
  assert.ok(waterMaskFromColor(41, 66, 123) > 0.95, 'high-latitude ocean')
})

test('bright turquoise shallows are still water', () => {
  // The Bahamas: a very bright, cyan sea that a brightness-only test would drop.
  assert.ok(waterMaskFromColor(37, 194, 210) > 0.3)
})

test('the polar ice caps are land, not water', () => {
  assert.ok(waterMaskFromColor(221, 225, 235) < 0.05, 'Arctic pack ice')
  assert.ok(waterMaskFromColor(208, 214, 227) < 0.05, 'Arctic ice edge')
  assert.ok(waterMaskFromColor(218, 218, 220) < 0.05, 'Antarctic sheet')
})

test('land that leans away from blue is never water', () => {
  assert.equal(waterMaskFromColor(204, 179, 150), 0, 'desert')
  assert.equal(waterMaskFromColor(60, 110, 40), 0, 'vegetation')
  assert.equal(waterMaskFromColor(150, 150, 150), 0, 'neutral grey')
})

test('the ice cap and the ocean beside it separate cleanly', () => {
  const ice = waterMaskFromColor(213, 217, 229)
  const sea = waterMaskFromColor(31, 60, 118)
  assert.ok(ice < 0.05, `ice should be land, got ${ice}`)
  assert.ok(sea > 0.95, `sea should be water, got ${sea}`)
})

test('more blue lead means more water', () => {
  assert.ok(waterMaskFromColor(30, 59, 117) > waterMaskFromColor(120, 140, 150))
})
