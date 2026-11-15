import test from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import {
  EARTH_TEXTURE_IDS,
  TEXTURE_IDS,
  textureIdsForScope,
} from '../src/utils/textureSources.ts'
import type { TextureId } from '../src/data/visuals.ts'
import { clampCameraToSphere } from '../src/utils/freeOrbitControls.ts'

/**
 * Solo Earth mode. Run with `npm test`.
 *
 * Two things have to hold: the mode must actually offload the other bodies'
 * textures (not just hide their meshes), and the camera must never be able to
 * get inside the globe.
 */

test('the earth scope builds only Earth and the sky', () => {
  assert.deepEqual(textureIdsForScope('earth'), EARTH_TEXTURE_IDS)
  assert.deepEqual(textureIdsForScope('all'), TEXTURE_IDS)
})

test('the earth scope is a strict subset of the full set', () => {
  assert.ok(EARTH_TEXTURE_IDS.length < TEXTURE_IDS.length)
  for (const id of EARTH_TEXTURE_IDS) {
    assert.ok(TEXTURE_IDS.includes(id), `${id} is not in the full set`)
  }
})

test('the earth scope keeps every map the globe and its sky need', () => {
  const needed: TextureId[] = [
    'earth',
    'earthHeightmap',
    'earthBathymetry',
    'earthClouds',
    'earthNight',
    'earthRoughness',
    'seafloorRamp',
    'waterNormal',
    'star',
    'nebula',
  ]
  for (const id of needed) {
    assert.ok(EARTH_TEXTURE_IDS.includes(id), `${id} is missing from the earth scope`)
  }
})

test('the earth scope leaves out the Sun, the Moon and every other world', () => {
  const offloaded: TextureId[] = [
    'sun',
    'glow',
    'moon',
    'mercury',
    'venus',
    'mars',
    'jupiter',
    'saturn',
    'saturnRings',
    'uranus',
    'uranusRings',
    'neptune',
    'pluto',
    'comet',
    'cometNucleus',
  ]
  for (const id of offloaded) {
    assert.ok(!EARTH_TEXTURE_IDS.includes(id), `${id} should be offloaded`)
  }
})

test('earth is built before the maps that derive from it', () => {
  // Building `earth` runs the land/water analysis the roughness and the painted
  // city lights read back, so it must come first.
  assert.ok(EARTH_TEXTURE_IDS.indexOf('earth') < EARTH_TEXTURE_IDS.indexOf('earthRoughness'))
  assert.ok(EARTH_TEXTURE_IDS.indexOf('earth') < EARTH_TEXTURE_IDS.indexOf('earthNight'))
})

test('a camera outside the sphere is left exactly where it is', () => {
  const position = new Vector3(0, 0, 10)
  assert.equal(clampCameraToSphere(position, new Vector3(0, 0, 0), 5), false)
  assert.deepEqual([position.x, position.y, position.z], [0, 0, 10])
})

test('a camera inside the sphere is pushed straight back out to its surface', () => {
  const position = new Vector3(0, 0, 1)
  assert.equal(clampCameraToSphere(position, new Vector3(0, 0, 0), 5), true)
  assert.ok(Math.abs(position.length() - 5) < 1e-9)
  // It stays on the same ray out of the centre.
  assert.ok(position.clone().normalize().distanceTo(new Vector3(0, 0, 1)) < 1e-9)
})

test('the clamp respects an off-origin centre', () => {
  const centre = new Vector3(3, 0, 0)
  const position = new Vector3(3, 0, 1)
  assert.equal(clampCameraToSphere(position, centre, 5), true)
  assert.ok(Math.abs(position.distanceTo(centre) - 5) < 1e-9)
})

test('a camera exactly at the centre is placed on the surface', () => {
  const position = new Vector3(0, 0, 0)
  assert.equal(clampCameraToSphere(position, new Vector3(0, 0, 0), 5), true)
  assert.ok(Math.abs(position.length() - 5) < 1e-9)
})
