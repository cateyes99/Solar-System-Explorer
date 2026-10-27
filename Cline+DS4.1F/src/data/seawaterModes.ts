import type { SeawaterModeId } from '../types'

/**
 * The ocean implementations the Earth panel can switch between.
 *
 * Each entry is the single source of truth for one mode: the names the switcher
 * and the shared slider show, and the two rendering choices that distinguish it.
 * The panel reads this list to build its switcher and to relabel the slider, and
 * the scene reads the two behaviour flags to decide how to draw. Adding a future
 * "Option C" is therefore one new entry here, its i18n strings and its rendering
 * branch — nothing in the panel or the slider has to change.
 */
export interface SeawaterMode {
  id: SeawaterModeId
  /** i18n key for the option's short label in the switcher. */
  labelKey: string
  /** i18n key for the one-line description shown under the switcher. */
  hintKey: string
  /**
   * i18n key for the shared slider's label. It differs per mode because the
   * same control means slightly different things: in `surface` it fades the
   * painted ocean away, in `volumetric` it thins a real water layer.
   */
  sliderLabelKey: string
  /** i18n key for the shared slider's hint. */
  sliderHintKey: string
  /**
   * Whether the mode draws the separate transparent water layer (`Ocean.tsx`)
   * over the drained seafloor. That layer reads the shared slider itself.
   */
  layeredWater: boolean
  /**
   * How the shared slider drives the *surface* material's seafloor opacity:
   *  - `slider`  : the surface fades in place (the "faded floor").
   *  - `drained` : the floor is always fully drained; only the separate water
   *                layer above it responds to the slider.
   */
  surfaceFade: 'slider' | 'drained'
}

export const SEAWATER_MODES: readonly SeawaterMode[] = [
  {
    id: 'surface',
    labelKey: 'planet.seawaterMode.surface',
    hintKey: 'planet.seawaterMode.surfaceHint',
    sliderLabelKey: 'planet.seawaterFade',
    sliderHintKey: 'planet.seawaterFadeHint',
    layeredWater: false,
    surfaceFade: 'slider',
  },
  {
    id: 'volumetric',
    labelKey: 'planet.seawaterMode.volumetric',
    hintKey: 'planet.seawaterMode.volumetricHint',
    sliderLabelKey: 'planet.seawaterOpacity',
    sliderHintKey: 'planet.seawaterOpacityHint',
    layeredWater: true,
    surfaceFade: 'drained',
  },
]

/**
 * The mode the app ships with. It is the single-mesh "faded floor": one mesh and
 * one material, so it is the cheaper of the two and the chosen default.
 */
export const DEFAULT_SEAWATER_MODE: SeawaterModeId = 'surface'

/** Looks a mode up by id, falling back to the default for an unknown value. */
export function seawaterModeFor(id: SeawaterModeId | undefined): SeawaterMode {
  return SEAWATER_MODES.find((mode) => mode.id === id) ?? SEAWATER_MODES[0]
}

/** True when the value names a mode the app knows about. */
export function isSeawaterModeId(value: unknown): value is SeawaterModeId {
  return typeof value === 'string' && SEAWATER_MODES.some((mode) => mode.id === value)
}

/**
 * The seafloor opacity the *surface* material should use for a mode and a slider
 * value. In a fading mode the slider passes straight through; in a layered mode
 * the floor is pinned fully drained (0) and the water layer above it carries the
 * opacity instead.
 */
export function seafloorOpacityFor(mode: SeawaterMode, sliderValue: number): number {
  return mode.surfaceFade === 'drained' ? 0 : sliderValue
}
