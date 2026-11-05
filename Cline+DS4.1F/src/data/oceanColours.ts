import type { OceanColourId } from '../types'

/**
 * The body colours the volumetric ocean can be tinted with.
 *
 * They are the choices under the panel's "Ocean colour" switcher. Most options
 * recolour the day map's ocean: its real sediment and shelf shading survives as a
 * brightness variation, but its own blue does not, so the colour you pick is the
 * colour you get (a black tint really is black). A preset gives its colour as a
 * single `waterTint` — or, for a two-tone sea, as a `shallowTint` for the shelves
 * and a `deepTint` for the basins, mixed by depth. The `absorption` sets how
 * quickly the water reaches its deep colour.
 *
 * The exception is `natural`, which has **no** tint: it leaves the day map's own
 * ocean colour exactly as it is, with no recolouring at all.
 *
 * Three words are used consistently across these docs and the panel:
 *
 *  - **default** — the preset the app starts on, `natural` (see
 *    `DEFAULT_OCEAN_COLOUR`), so a new session opens on the unrecoloured day map
 *    and the other presets are there to be explored. It is the first entry in the
 *    list.
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
   * The single colour the water is, used for both the shallow and the deep end
   * unless `shallowTint`/`deepTint` override them. Omitted by `natural`, which
   * keeps the day map's own ocean colour instead.
   */
  waterTint?: string
  /**
   * The colour of the shallow shelves, where it differs from `waterTint`. The
   * water mixes from this at the waterline to `deepTint` in the deepest basin,
   * so a preset can be turquoise over the shelves and navy in the deep.
   */
  shallowTint?: string
  /** The colour of the deep basins, where it differs from `waterTint`. */
  deepTint?: string
}

export const OCEAN_COLOURS: readonly OceanColour[] = [
  {
    id: 'natural',
    labelKey: 'planet.oceanColour.natural',
    hintKey: 'planet.oceanColour.naturalHint',
    // The default. No tint: the day map's own ocean colour is left exactly as it
    // is, with no recolouring — sediment, shelves and basins and all. It leads
    // the switcher as the reference every other preset recolours from, so a new
    // session opens on the true day map. The absorption is unused here (the day
    // map already carries the depth shading), but kept for the shared shape.
    absorption: [0.95, 0.5, 0.32],
  },
  {
    id: 'blue',
    labelKey: 'planet.oceanColour.blue',
    hintKey: 'planet.oceanColour.blueHint',
    // A teal-blue over the shelves falling to a deep navy in the basins. The day
    // map's real sediment and shelf shading is kept as a brightness variation;
    // only the hue is replaced.
    absorption: [0.95, 0.5, 0.32],
    shallowTint: '#1a6b8f',
    deepTint: '#0a2b4d',
  },
  {
    id: 'deep',
    labelKey: 'planet.oceanColour.deep',
    hintKey: 'planet.oceanColour.deepHint',
    // Deeper and more saturated: a blue-teal shelf over a richer, purer blue
    // basin, so the open ocean reads as one deep field.
    absorption: [1.7, 1, 0.6],
    shallowTint: '#155a78',
    deepTint: '#051b4a',
  },
  {
    id: 'abyss',
    labelKey: 'planet.oceanColour.abyss',
    hintKey: 'planet.oceanColour.abyssHint',
    // The darkest option: a dark steel shelf over an almost black ink-blue basin
    // that only the sun glint and the sky lift.
    absorption: [2.4, 1.4, 0.85],
    shallowTint: '#0b3a55',
    deepTint: '#03122b',
  },
  {
    id: 'tropical',
    labelKey: 'planet.oceanColour.tropical',
    hintKey: 'planet.oceanColour.tropicalHint',
    // Bright and green-leaning: a clear lagoon turquoise over a slightly deeper
    // teal, with the basins darkened only gently.
    absorption: [0.55, 0.28, 0.2],
    shallowTint: '#2f9fb0',
    deepTint: '#0f7ba3',
  },
]

/**
 * The **default** preset: `natural`, which leaves the day map's own ocean colour
 * unrecoloured. A new session opens on the true day map, with the recolouring
 * presets as things to explore rather than the starting point. It is also the
 * first entry in the list.
 */
export const DEFAULT_OCEAN_COLOUR: OceanColourId = 'natural'

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
