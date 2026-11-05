import test from 'node:test'
import assert from 'node:assert/strict'
import type { OceanColourId } from '../src/types.ts'
import {
  DEFAULT_OCEAN_COLOUR,
  OCEAN_COLOURS,
  isOceanColourId,
  oceanColourFor,
} from '../src/data/oceanColours.ts'

/**
 * The ocean-colour registry. Run with `npm test`.
 *
 * The guarantees that matter: the app defaults to the "natural" preset, every
 * colour carries a usable Beer's-law absorption with a unique id and valid hex
 * tints, the deeper options really do absorb more than blue (so their basins
 * read darker), the two-tone presets really do differ end to end, and an unknown
 * id falls back to the default.
 */

test('the default ocean colour is "natural"', () => {
  assert.equal(DEFAULT_OCEAN_COLOUR, 'natural')
  assert.equal(oceanColourFor(DEFAULT_OCEAN_COLOUR).id, 'natural')
})

test('every colour has a unique id, usable numbers and valid tints', () => {
  const ids = new Set<string>()
  const hex = /^#[0-9a-f]{6}$/i
  for (const colour of OCEAN_COLOURS) {
    assert.ok(!ids.has(colour.id), `duplicate id ${colour.id}`)
    ids.add(colour.id)
    assert.ok(isOceanColourId(colour.id))
    assert.equal(colour.absorption.length, 3)
    for (const channel of colour.absorption) {
      assert.ok(Number.isFinite(channel) && channel > 0, `bad absorption ${channel}`)
    }
    for (const tint of [colour.waterTint, colour.shallowTint, colour.deepTint]) {
      if (tint !== undefined) assert.match(tint, hex)
    }
  }
})

test('exactly one colour, "natural", has no tint at all', () => {
  const untinted = OCEAN_COLOURS.filter(
    (colour) =>
      colour.waterTint === undefined &&
      colour.shallowTint === undefined &&
      colour.deepTint === undefined,
  )
  assert.deepEqual(
    untinted.map((colour) => colour.id),
    ['natural'],
  )
})

test('the two-tone presets really are two-tone', () => {
  for (const id of ['blue', 'deep', 'abyss', 'tropical'] as const) {
    const colour = oceanColourFor(id)
    assert.ok(colour.shallowTint !== undefined, `${id} should have a shallow tint`)
    assert.ok(colour.deepTint !== undefined, `${id} should have a deep tint`)
    assert.notEqual(colour.shallowTint, colour.deepTint, `${id} should differ end to end`)
  }
})

test('the deeper colours absorb more than blue', () => {
  const absorbed = (colour: { absorption: number[] }) =>
    colour.absorption.reduce((total, channel) => total + channel, 0)
  const blue = absorbed(oceanColourFor('blue'))
  const deep = absorbed(oceanColourFor('deep'))
  const abyss = absorbed(oceanColourFor('abyss'))
  assert.ok(deep > blue, 'deep should absorb more than blue')
  assert.ok(abyss > deep, 'abyss should absorb more than deep')
})

test('the tropical colour absorbs less than blue', () => {
  const absorbed = (colour: { absorption: number[] }) =>
    colour.absorption.reduce((total, channel) => total + channel, 0)
  assert.ok(absorbed(oceanColourFor('tropical')) < absorbed(oceanColourFor('blue')))
})

test('every listed colour is recognised, and nothing else is', () => {
  for (const colour of OCEAN_COLOURS) {
    assert.ok(isOceanColourId(colour.id))
  }
  assert.ok(!isOceanColourId('teal'))
  assert.ok(!isOceanColourId(undefined))
  assert.ok(!isOceanColourId(3))
})

test('an unknown or missing colour id falls back to the default entry', () => {
  assert.equal(oceanColourFor('nope' as OceanColourId).id, DEFAULT_OCEAN_COLOUR)
  assert.equal(oceanColourFor(undefined).id, DEFAULT_OCEAN_COLOUR)
})
