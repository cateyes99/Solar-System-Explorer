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
 * The guarantees that matter: the app defaults to the shipped Blue Marble blue,
 * every colour carries a usable Beer's-law absorption and tint with a unique id,
 * the deeper options really do absorb more than the shipped blue (so they read
 * darker and more saturated), and an unknown id falls back to the default.
 */

test('the default ocean colour is the deep navy "blue"', () => {
  assert.equal(DEFAULT_OCEAN_COLOUR, 'blue')
  assert.equal(oceanColourFor(DEFAULT_OCEAN_COLOUR).id, 'blue')
})

test('every colour has a unique id and usable Beer’s-law numbers', () => {
  const ids = new Set<string>()
  for (const colour of OCEAN_COLOURS) {
    assert.ok(!ids.has(colour.id), `duplicate id ${colour.id}`)
    ids.add(colour.id)
    assert.ok(isOceanColourId(colour.id))
    assert.equal(colour.absorption.length, 3)
    for (const channel of colour.absorption) {
      assert.ok(Number.isFinite(channel) && channel > 0, `bad absorption ${channel}`)
    }
    // `natural` has no tint (it keeps the day map's own colour); the rest do.
    if (colour.waterTint !== undefined) {
      assert.match(colour.waterTint, /^#[0-9a-f]{6}$/i)
    }
  }
})

test('exactly one colour, "natural", has no tint', () => {
  const untinted = OCEAN_COLOURS.filter((colour) => colour.waterTint === undefined)
  assert.deepEqual(
    untinted.map((colour) => colour.id),
    ['natural'],
  )
})

test('the deeper colours absorb more than the default blue', () => {
  const absorbed = (colour: { absorption: number[] }) =>
    colour.absorption.reduce((total, channel) => total + channel, 0)
  const blue = absorbed(oceanColourFor('blue'))
  const deep = absorbed(oceanColourFor('deep'))
  const abyss = absorbed(oceanColourFor('abyss'))
  assert.ok(deep > blue, 'deep should absorb more than blue')
  assert.ok(abyss > deep, 'abyss should absorb more than deep')
})

test('the tropical colour absorbs less than the default blue', () => {
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
