import type { WaveStyleId } from '../types'

/**
 * The wave models the volumetric ocean can draw with.
 *
 * They are the two choices under the "Volumetric" seawater mode: the living,
 * procedural sea the app now ships with, and the tiling ripple normal map it
 * used before. Each entry is the single source of truth for one style — the
 * names the switcher and the shared slider show — so the planet panel reads
 * this list rather than special-casing anything. Adding a third model is one
 * new entry here, its i18n strings and its rendering branch.
 */
export interface WaveStyle {
  id: WaveStyleId
  /** i18n key for the option's short label in the switcher. */
  labelKey: string
  /** i18n key for the one-line description shown under the switcher. */
  hintKey: string
}

export const WAVE_STYLES: readonly WaveStyle[] = [
  {
    id: 'spectral',
    labelKey: 'planet.waveStyle.spectral',
    hintKey: 'planet.waveStyle.spectralHint',
  },
  {
    id: 'ripples',
    labelKey: 'planet.waveStyle.ripples',
    hintKey: 'planet.waveStyle.ripplesHint',
  },
]

/**
 * The style the app ships with: the living, procedural sea. It is the newer of
 * the two and the one the current ocean was tuned around.
 */
export const DEFAULT_WAVE_STYLE: WaveStyleId = 'spectral'

/** Looks a style up by id, falling back to the default for an unknown value. */
export function waveStyleFor(id: WaveStyleId | undefined): WaveStyle {
  return WAVE_STYLES.find((style) => style.id === id) ?? WAVE_STYLES[0]
}

/** True when the value names a wave style the app knows about. */
export function isWaveStyleId(value: unknown): value is WaveStyleId {
  return typeof value === 'string' && WAVE_STYLES.some((style) => style.id === value)
}
