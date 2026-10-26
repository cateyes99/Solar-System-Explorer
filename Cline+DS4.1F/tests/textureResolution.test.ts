import test from 'node:test'
import assert from 'node:assert/strict'
import { EARTH_ANALYSIS_WIDTH, QUALITY_SCALE, textureUploadWidth } from '../src/utils/textureResolution.ts'

/**
 * How much of a source map reaches the GPU. Run with `npm test`.
 *
 * The important case is Earth's 8K day map: the tiers must land on 8K / 4K / 2K
 * without ever exceeding what the driver will accept.
 */

const EIGHT_K = 8192
const HEIGHTMAP = 3840 // Earth's DEM, capped at 2048 by TEXTURE_MAX_WIDTH.

test('the quality tiers are full, half and quarter resolution', () => {
  assert.equal(QUALITY_SCALE.high, 1)
  assert.equal(QUALITY_SCALE.medium, 0.5)
  assert.equal(QUALITY_SCALE.low, 0.25)
})

test("Earth's 8K day map uploads at 8K, 4K and 2K", () => {
  assert.equal(textureUploadWidth(EIGHT_K, 'high', undefined, 16384), 8192)
  assert.equal(textureUploadWidth(EIGHT_K, 'medium', undefined, 16384), 4096)
  assert.equal(textureUploadWidth(EIGHT_K, 'low', undefined, 16384), 2048)
})

test('the 8K night map follows the same tiering as the day map', () => {
  // The city lights ship at 8192 px with no per-map ceiling either, so they stay
  // as sharp as the surface at every tier.
  assert.equal(textureUploadWidth(EIGHT_K, 'high', undefined, 16384), 8192)
  assert.equal(textureUploadWidth(EIGHT_K, 'medium', undefined, 16384), 4096)
  assert.equal(textureUploadWidth(EIGHT_K, 'low', undefined, 16384), 2048)
})

test('the 8K map is reduced to the driver limit on weaker hardware', () => {
  assert.equal(textureUploadWidth(EIGHT_K, 'high', undefined, 4096), 4096)
  assert.equal(textureUploadWidth(EIGHT_K, 'medium', undefined, 4096), 4096)
  assert.equal(textureUploadWidth(EIGHT_K, 'low', undefined, 4096), 2048)
  assert.equal(textureUploadWidth(EIGHT_K, 'high', undefined, 2048), 2048)
})

test('a per-map ceiling wins when it is smaller than the tier', () => {
  // The elevation model is 3840 px but is never uploaded above 2048.
  assert.equal(textureUploadWidth(HEIGHTMAP, 'high', 2048, 16384), 2048)
  // Medium is already below the ceiling, so the tier decides.
  assert.equal(textureUploadWidth(HEIGHTMAP, 'medium', 2048, 16384), 1920)
  assert.equal(textureUploadWidth(HEIGHTMAP, 'low', 2048, 16384), 960)
})

test('a 2K source is never upscaled above its native size', () => {
  assert.equal(textureUploadWidth(2048, 'high', undefined, 16384), 2048)
  assert.equal(textureUploadWidth(2048, 'medium', undefined, 16384), 1024)
})

test('the width is never smaller than two pixels, nor above the driver limit', () => {
  assert.equal(textureUploadWidth(0, 'high', undefined, 16384), 2)
  assert.equal(textureUploadWidth(Number.NaN, 'high', undefined, 16384), 2)
  assert.equal(textureUploadWidth(8192, 'high', undefined, 1), 2)
})

test('the analysis resolution stays small even when the map is 8K', () => {
  assert.ok(EARTH_ANALYSIS_WIDTH.high <= 2048)
  assert.ok(EARTH_ANALYSIS_WIDTH.medium <= 2048)
  assert.ok(EARTH_ANALYSIS_WIDTH.low < EARTH_ANALYSIS_WIDTH.high)
})
