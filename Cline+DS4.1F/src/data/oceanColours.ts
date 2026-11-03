import type { OceanColourId } from '../types'

/**
 * The body colours the volumetric ocean can be tinted with.
 *
 * They are the choices under the panel's "Ocean colour" switcher. The ocean is a
 * Beer's-law water body, so each option is two numbers rather than one: an
 * `absorption` — the per-channel extinction that decides how fast the day map's
 * own colour is swallowed with depth — and a `waterTint`, the colour the water
 * scatters back where it is deep. Together they set how deep and how saturated
 * the sea reads from orbit, where all you can see is the large-scale colour.
 *
 * The numbers are tuned for the view from a high altitude or from space, not for
 * a close-up: they change the body colour only, never the waves, the sky
 * reflection or the coastal surf.
 */
export interface OceanColour {
  id: OceanColourId
  /** i18n key for the option's short label in the switcher. */
  labelKey: string
  /** i18n key for the one-line description shown under the switcher. */
  hintKey: string
  /**
   * Beer–Lambert extinction of the water body, linear RGB. Red is absorbed
   * first, which is what leaves deep water blue; raising all three darkens the
   * sea and lets the tint take over from the day map.
   */
  absorption: [number, number, number]
  /** The colour the water scatters back where it is deep. */
  waterTint: string
}

export const OCEAN_COLOURS: readonly OceanColour[] = [
  {
    id: 'blue',
    labelKey: 'planet.oceanColour.blue',
    hintKey: 'planet.oceanColour.blueHint',
    // The shipped Blue Marble blue: the day map's own colour still reads at
    // depth, so the shelves and basins keep their real variation.
    absorption: [0.95, 0.5, 0.32],
    waterTint: '#0a2b4d',
  },
  {
    id: 'deep',
    labelKey: 'planet.oceanColour.deep',
    hintKey: 'planet.oceanColour.deepHint',
    // Deeper and more saturated: the day map is suppressed harder, and the tint
    // is a richer, purer blue, so the open ocean reads as one deep field.
    absorption: [1.7, 1, 0.6],
    waterTint: '#051b4a',
  },
  {
    id: 'abyss',
    labelKey: 'planet.oceanColour.abyss',
    hintKey: 'planet.oceanColour.abyssHint',
    // The darkest option: nearly all of the day map is absorbed, leaving an
    // almost black ink-blue that only the sun glint and the sky lift.
    absorption: [2.4, 1.4, 0.85],
    waterTint: '#03122b',
  },
  {
    id: 'tropical',
    labelKey: 'planet.oceanColour.tropical',
    hintKey: 'planet.oceanColour.tropicalHint',
    // Bright and green-leaning: the absorption is low, so the day map's shallow
    // shelves stay luminous, and the tint is a clear lagoon turquoise.
    absorption: [0.55, 0.28, 0.2],
    waterTint: '#0f7ba3',
  },
]

/**
 * The colour the app ships with: the Blue Marble blue. It is the one the rest of
 * the ocean's look was tuned against, so it is the default.
 */
export const DEFAULT_OCEAN_COLOUR: OceanColourId = 'blue'

/** Looks a colour up by id, falling back to the default for an unknown value. */
export function oceanColourFor(id: OceanColourId | undefined): OceanColour {
  return OCEAN_COLOURS.find((colour) => colour.id === id) ?? OCEAN_COLOURS[0]
}

/** True when the value names an ocean colour the app knows about. */
export function isOceanColourId(value: unknown): value is OceanColourId {
  return typeof value === 'string' && OCEAN_COLOURS.some((colour) => colour.id === value)
}
