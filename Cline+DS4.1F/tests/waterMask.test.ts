import test from 'node:test'
import assert from 'node:assert/strict'
import { roughnessChannels, waterGloss, waterMaskFromColor } from '../src/utils/waterMask.ts'

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

/**
 * The gloss curve that turns the mask into a roughness value. Its job is to
 * keep the shoreline matte: a blurred lake edge must not land in the middle of
 * the glossy range, or it catches the sun as a bright outline around the lake.
 */
test('dry land is fully matte', () => {
  assert.equal(waterGloss(0), 0)
  assert.equal(waterGloss(0.3), 0, 'uncertain half-land still reads as land')
})

test('open ocean is fully glossy', () => {
  assert.equal(waterGloss(0.95), 1)
  assert.equal(waterGloss(1), 1)
})

test('the shoreline stays on the matte side of the ramp', () => {
  // A blurred lake edge sits around 0.5; it must not become glossy.
  assert.equal(waterGloss(0.5), 0)
  assert.ok(waterGloss(0.6) < 0.1, 'the ramp only just begins here')
})

test('gloss rises monotonically with the mask', () => {
  let previous = -1
  for (let mask = 0; mask <= 1; mask += 0.01) {
    const gloss = waterGloss(mask)
    assert.ok(gloss >= previous, `gloss fell at mask ${mask}`)
    assert.ok(gloss >= 0 && gloss <= 1, `gloss out of range at mask ${mask}`)
    previous = gloss
  }
})

/**
 * The roughness map's channels. The mask must not ride in alpha: a 2D canvas
 * premultiplies, so opaque land with alpha 0 would come back as black (perfectly
 * smooth) and the blurred coast ring would become a matte rectangle — the
 * "golden frame" artifact around every lake.
 */
test('the roughness map is opaque, with the mask in red', () => {
  const land = roughnessChannels(0, waterGloss(0))
  assert.deepEqual(land, { r: 0, g: 235, b: 235, a: 255 }, 'dry land is matte and opaque')

  const sea = roughnessChannels(1, waterGloss(1))
  assert.deepEqual(sea, { r: 255, g: 26, b: 26, a: 255 }, 'open sea is glossy and opaque')
})

test('every roughness texel is fully opaque, whatever the mask', () => {
  for (let mask = 0; mask <= 1; mask += 0.01) {
    const texel = roughnessChannels(mask, waterGloss(mask))
    assert.equal(texel.a, 255, `alpha must be opaque at mask ${mask}`)
    assert.ok(texel.r >= 0 && texel.r <= 255)
  }
})

test('the water mask reaches red at full strength', () => {
  assert.equal(roughnessChannels(0.5, 0).r, 128)
  assert.equal(roughnessChannels(1, 0).r, 255)
})
