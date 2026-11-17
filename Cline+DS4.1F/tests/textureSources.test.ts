import test from 'node:test'
import assert from 'node:assert/strict'
import { textureFileFor } from '../src/utils/textureSources.ts'

/**
 * Which file each map loads at each quality tier. Run with `npm test`.
 *
 * The point of the Ultra tier is that only Earth's day and night maps change:
 * every other map, and every other tier, must keep loading exactly what it did
 * before, or the "leave Low/Medium/High untouched" promise is broken.
 */

test('Earth day and night use the 16K file only at Ultra', () => {
  assert.equal(textureFileFor('earth', 'ultra'), '16k_earth_daymap.jpg')
  assert.equal(textureFileFor('earth', 'high'), '8k_earth_daymap.jpg')
  assert.equal(textureFileFor('earthNight', 'ultra'), '16k_earth_nightmap.jpg')
  assert.equal(textureFileFor('earthNight', 'medium'), '8k_earth_nightmap.jpg')
})

test('the lower tiers are unchanged by the new tier', () => {
  assert.equal(textureFileFor('earth', 'low'), '8k_earth_daymap.jpg')
  assert.equal(textureFileFor('earth', 'medium'), '8k_earth_daymap.jpg')
})

test('every other map loads the same file at every tier', () => {
  const qualities = ['low', 'medium', 'high', 'ultra'] as const
  for (const quality of qualities) {
    assert.equal(textureFileFor('moon', quality), '2k_moon.jpg')
    assert.equal(textureFileFor('sun', quality), '2k_sun.jpg')
    assert.equal(textureFileFor('jupiter', quality), '2k_jupiter.jpg')
  }
})

test('a map with no source file has no file at any tier', () => {
  // The roughness mask is derived from the day map; the star sprite is painted.
  assert.equal(textureFileFor('earthRoughness', 'ultra'), undefined)
  assert.equal(textureFileFor('star', 'high'), undefined)
})
