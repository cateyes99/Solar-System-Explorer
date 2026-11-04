import type { OceanColourId } from '../types'

/**
 * The body colours the volumetric ocean can be tinted with.
 *
 * They are the choices under the panel's "Ocean colour" switcher. Most options
 * are a `waterTint` — the colour the sea takes on, which is what you see from
 * orbit — plus an `absorption` that darkens the deep basins. The day map's own
 * ocean colour is recoloured by the tint: its real sediment and shelf shading
 * survives as a brightness variation, but its own blue does not, so the colour
 * you pick is the colour you get (a black tint really is black).
 *
 * The exception is `natural`, which has **no** `waterTint`: it leaves the day
 * map's own ocean colour exactly as it is, with no recolouring at all.
 *
 * Three words are used consistently across these docs and the panel:
 *
 *  - **default** — the preset the app starts on, `blue` (see
 *    `DEFAULT_OCEAN_COLOUR`). It is not the first entry in the list.
 *  - **natural** — the preset with no tint, which keeps the day map's own ocean
 *    colour. Its look is "the day map's own colour".
 *  - **original** — the ocean's appearance *before* these presets existed (the
 *    old `dayMap * T + tint * (1 − T)` mix). Neither `blue` nor `natural`
 *    reproduces it exactly, so the word is only used historically.
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
   * Beer–Lambert extinction of the water body, linear RGB. Its overall level
   * sets how quickly the water reaches its deep colour: the higher it is, the
   * sooner the basins fall away from the brighter shelves. Unused by `natural`,
   * whose depth shading already comes from the day map.
   */
  absorption: [number, number, number]
  /**
   * The colour the water is — the tint it takes on, deep or shallow. Omitted by
   * `natural`, which keeps the day map's own ocean colour instead.
   */
  waterTint?: string
}

export const OCEAN_COLOURS: readonly OceanColour[] = [
  {
    id: 'natural',
    labelKey: 'planet.oceanColour.natural',
    hintKey: 'planet.oceanColour.naturalHint',
    // No tint: the day map's own ocean colour is left exactly as it is, with no
    // recolouring — sediment, shelves and basins and all. It leads the switcher
    // as the reference every other preset recolours from. The absorption is
    // unused here (the day map already carries the depth shading), but kept for
    // the shared shape.
    absorption: [0.95, 0.5, 0.32],
  },
  {
    id: 'blue',
    labelKey: 'planet.oceanColour.blue',
    hintKey: 'planet.oceanColour.blueHint',
    // The default: a deep navy. The day map's real sediment and shelf shading is
    // kept as a brightness variation, but its colour is recoloured to this blue.
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
 * The **default** preset: a deep navy that recolours the day map's ocean. It is
 * the one the rest of the water's look was tuned against, so the app starts on
 * it — and note it is not the first entry in the list, which is `natural`.
 */
export const DEFAULT_OCEAN_COLOUR: OceanColourId = 'blue'

/** Looks a colour up by id, falling back to the default for an unknown value. */
export function oceanColourFor(id: OceanColourId | undefined): OceanColour {
  return (
    OCEAN_COLOURS.find((colour) => colour.id === id) ??
    OCEAN_COLOURS.find((colour) => colour.id === DEFAULT_OCEAN_COLOUR) ??
    OCEAN_COLOURS[0]
  )
}

/** True when the value names an ocean colour the app knows about. */
export function isOceanColourId(value: unknown): value is OceanColourId {
  return typeof value === 'string' && OCEAN_COLOURS.some((colour) => colour.id === value)
}
