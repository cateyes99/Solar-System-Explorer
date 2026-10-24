import { LANGUAGES } from '../i18n'
import type { Language } from '../i18n'
import { useSimulationStore } from '../store/simulationStore'
import type { SettingsPatch } from '../store/simulationStore'
import {
  DEFAULT_SPACECRAFT_SIZE,
  SPACECRAFT_SIZE_MAX,
  SPACECRAFT_SIZE_MIN,
} from '../utils/spacecraftSize'

/**
 * JSONC configuration.
 *
 * A single, human-editable file (`public/config.jsonc`) holds the settings a
 * visitor is most likely to want to change: Earth's atmosphere and clouds, the
 * opacity of the two side panels, and the display language. It is fetched and
 * applied *before the first render* (see `main.tsx`), so the chosen language and
 * visual settings are in place from the very first frame.
 *
 * The file is JSON with comments — `//`, `/* … *​/` and trailing commas are all
 * accepted — so it can be documented inline. Everything is optional and every
 * value is validated: a missing file, a broken file, an unknown key or an
 * out-of-range number is reported (in development) and the matching default is
 * used, so the app always starts.
 *
 * The keys are deliberately human-readable. They map onto the store's own
 * identifiers — the same state that the panel sliders and the shaders read — so
 * the file, the controls and the rendering can never drift apart.
 */

export interface AppConfig {
  language: Language
  /** Earth's atmosphere haze, 0…1 (store: `earthAtmosphereOpacity`). */
  earthAtmosphereOpacity: number
  /** Earth's cloud coverage, 0…1 (store: `earthCloudCoverage`). */
  earthCloudCoverage: number
  /** Earth's cloud opacity, 0…1 (store: `earthCloudOpacity`). */
  earthCloudOpacity: number
  /** Earth's cloud dynamics, 0…1 (store: `earthCloudDynamics`). */
  earthCloudDynamics: number
  /** Opacity of the left controls panel, 0…1 (store: `ui.leftPanelOpacity`). */
  leftPanelOpacity: number
  /** Opacity of the right information panel, 0…1 (store: `ui.rightPanelOpacity`). */
  rightPanelOpacity: number
  /**
   * The spacecraft's size, as a level from 1 (a tenth of the model) to 10 (the
   * model's full size). See `utils/spacecraftSize`.
   */
  spacecraftSize: number
}

/**
 * The values used when the file is missing, or when a setting is absent or
 * invalid. These are exactly the app's built-in defaults, so removing the file
 * restores the original out-of-the-box behaviour.
 */
export const DEFAULT_APP_CONFIG: AppConfig = {
  language: 'en',
  earthAtmosphereOpacity: 0.45,
  earthCloudCoverage: 0.5,
  earthCloudOpacity: 0.5,
  earthCloudDynamics: 0.5,
  leftPanelOpacity: 1,
  rightPanelOpacity: 1,
  spacecraftSize: DEFAULT_SPACECRAFT_SIZE,
}

interface NumberField {
  /** The key as written in `config.jsonc`. */
  key: string
  /** The accepted range, inclusive. */
  min: number
  max: number
  /** When true the value must be a whole number. */
  integer?: boolean
  /** Which store value it drives. */
  set: (config: AppConfig, value: number) => void
}

const NUMBER_FIELDS: NumberField[] = [
  { key: 'Earth Atmosphere Haze', min: 0, max: 1, set: (c, v) => { c.earthAtmosphereOpacity = v } },
  { key: 'Earth Cloud Coverage', min: 0, max: 1, set: (c, v) => { c.earthCloudCoverage = v } },
  { key: 'Earth Cloud Opacity', min: 0, max: 1, set: (c, v) => { c.earthCloudOpacity = v } },
  { key: 'Earth Cloud Dynamics', min: 0, max: 1, set: (c, v) => { c.earthCloudDynamics = v } },
  { key: 'SimulationControls Opacity', min: 0, max: 1, set: (c, v) => { c.leftPanelOpacity = v } },
  { key: 'PlanetPanel Opacity', min: 0, max: 1, set: (c, v) => { c.rightPanelOpacity = v } },
  {
    key: 'Spacecraft Size',
    min: SPACECRAFT_SIZE_MIN,
    max: SPACECRAFT_SIZE_MAX,
    integer: true,
    set: (c, v) => { c.spacecraftSize = v },
  },
]

/**
 * Parses JSON with comments.
 *
 * Comments and trailing commas are stripped character by character rather than
 * with a regex, so a `//` inside a string (a URL, say) is never mistaken for a
 * comment. The result is handed to `JSON.parse`, which reports the line of any
 * remaining syntax error.
 */
export function parseJsonc(text: string): unknown {
  let out = ''
  let inString = false
  let inLineComment = false
  let inBlockComment = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false
        out += char
      }
      continue
    }

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false
        i += 1
      }
      continue
    }

    if (inString) {
      out += char
      if (char === '\\') {
        out += next ?? ''
        i += 1
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      out += char
      continue
    }
    if (char === '/' && next === '/') {
      inLineComment = true
      i += 1
      continue
    }
    if (char === '/' && next === '*') {
      inBlockComment = true
      i += 1
      continue
    }
    out += char
  }

  // A comma before a closing brace or bracket is allowed in JSONC.
  out = out.replace(/,(\s*[}\]])/g, '$1')
  return JSON.parse(out)
}

/** Validates a parsed config, keeping the default for anything unusable. */
export function validateAppConfig(raw: unknown): { config: AppConfig; issues: string[] } {
  const config: AppConfig = { ...DEFAULT_APP_CONFIG }
  const issues: string[] = []

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { config, issues: ['the configuration root must be a JSON object'] }
  }
  const record = raw as Record<string, unknown>

  for (const field of NUMBER_FIELDS) {
    const value = record[field.key]
    if (value === undefined) continue
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      issues.push(`${field.key}: expected a number, got ${JSON.stringify(value)}`)
      continue
    }
    if (value < field.min || value > field.max) {
      issues.push(`${field.key}: ${value} is outside the allowed range ${field.min}–${field.max}`)
      continue
    }
    if (field.integer && !Number.isInteger(value)) {
      issues.push(`${field.key}: expected a whole number, got ${value}`)
      continue
    }
    field.set(config, value)
  }

  const language = record.Language
  if (language !== undefined) {
    if (typeof language === 'string' && LANGUAGES.some((entry) => entry.id === language)) {
      config.language = language as Language
    } else {
      issues.push(`Language: unsupported value ${JSON.stringify(language)}`)
    }
  }

  return { config, issues }
}

/** Where the file is served from, honouring a non-root Vite `base`. */
export function configUrl(): string {
  const base = import.meta.env.BASE_URL || '/'
  return `${base.endsWith('/') ? base : `${base}/`}config.jsonc`
}

/**
 * Fetches and validates the file. Never rejects: a missing or broken file simply
 * yields the defaults plus a list of issues to report.
 */
export async function loadAppConfig(
  url: string = configUrl(),
  timeoutMs = 4000,
): Promise<{ config: AppConfig; issues: string[] }> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const response = await fetch(url, { signal: controller.signal, cache: 'no-cache' })
    clearTimeout(timer)
    if (!response.ok) {
      return { config: { ...DEFAULT_APP_CONFIG }, issues: [`could not load ${url} (HTTP ${response.status})`] }
    }
    const text = await response.text()
    // A dev server (or an SPA host) answers a missing file with the index page,
    // which would otherwise surface as a baffling JSON syntax error.
    if (text.trimStart().startsWith('<')) {
      return { config: { ...DEFAULT_APP_CONFIG }, issues: [`could not load ${url} (not found)`] }
    }
    return validateAppConfig(parseJsonc(text))
  } catch (error) {
    return {
      config: { ...DEFAULT_APP_CONFIG },
      issues: [`could not load ${url} (${error instanceof Error ? error.message : String(error)})`],
    }
  }
}

/** Pushes a validated config into the store, where the UI and the shaders read it. */
export function applyAppConfig(config: AppConfig): void {
  const patch: SettingsPatch = {
    language: config.language,
    earthAtmosphereOpacity: config.earthAtmosphereOpacity,
    earthCloudCoverage: config.earthCloudCoverage,
    earthCloudOpacity: config.earthCloudOpacity,
    earthCloudDynamics: config.earthCloudDynamics,
    leftPanelOpacity: config.leftPanelOpacity,
    rightPanelOpacity: config.rightPanelOpacity,
    spacecraftSize: config.spacecraftSize,
  }
  useSimulationStore.getState().applySettings(patch)
}

/**
 * The startup entry point: load, validate and apply. Called once, before the
 * first render, so no untranslated text is ever shown.
 */
export async function initializeAppConfig(): Promise<void> {
  const { config, issues } = await loadAppConfig()
  applyAppConfig(config)
  if (import.meta.env.DEV && issues.length > 0) {
    window.console.warn('config.jsonc:', issues.join('; '))
  }
}
