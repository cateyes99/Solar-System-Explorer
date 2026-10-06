import type { BodyId } from '../types'

/** Every surface map the scene can request. */
export type TextureId =
  | 'sun'
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'earthClouds'
  | 'earthNight'
  | 'earthRoughness'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'saturnRings'
  | 'uranusRings'
  | 'uranus'
  | 'neptune'
  | 'pluto'
  | 'moon'
  | 'glow'
  | 'nebula'
  | 'star'
  | 'comet'
  | 'cometNucleus'

export interface AtmosphereVisuals {
  color: string
  /** Overall strength of the rim glow. */
  intensity: number
  /** Higher values pull the glow closer to the limb. */
  power: number
  /** Optional second, wider haze layer (used by Venus and the gas giants). */
  hazeColor?: string
  hazeIntensity?: number
}

export interface CloudVisuals {
  textureId: TextureId
  opacity: number
  /** Multiplier on the planet's own rotation speed. */
  speed: number
  color: string
}

export interface NightLightsVisuals {
  textureId: TextureId
  intensity: number
  color: string
}

export interface RingVisuals {
  textureId: TextureId
  innerRadiusScale: number
  outerRadiusScale: number
  opacity: number
  /**
   * Multiplier on the strip's own brightness. A ring strip is an optical-depth
   * map, not a calibrated reflectance map: its grey values are coverage, not
   * albedo. Saturn's is lifted to the icy brightness the Cassini images show,
   * while Uranus's particles really are dark soot, so its measured strip is used
   * exactly as drawn.
   */
  brightness: number
}

/**
 * How a comet nucleus looks: a lump of dark ice rather than a body with a
 * surface, so it needs a tint and a glow of its own instead of the
 * roughness/emissive recipe a planet uses. Two comets should not look like the
 * same snowball, and the numbers are what actually differ between them — the
 * 4% albedo of Halley's charcoal-dark crust against the bright ice of a smaller
 * comet.
 */
export interface CometVisuals {
  /** Base tint of the icy nucleus. */
  nucleusColor: string
  /** Colour the nucleus glows with as the Sun heats it. */
  emissiveColor: string
  /** Strength of that glow, before the distance-from-the-Sun boost. */
  emissiveIntensity: number
  /** Colour of the dust and gas streaming away in the tail (fallback tint). */
  tailColor: string
  /**
   * The nucleus's three axis lengths, normalised to the longest. Halley really is
   * a 15 × 7 × 7 km peanut, so its long axis is about twice the other two; a
   * younger, rounder comet sits nearer the middle.
   */
  nucleusAxes?: [number, number, number]
  /** How deeply the middle of the nucleus is pinched in (0 = a plain ellipsoid). */
  nucleusWaist?: number
  /** The straight, blue CO+ plasma tail, blown exactly anti-sunward. */
  ionTailColor?: string
  /** The broad, warm dust tail that lags behind the comet's own motion. */
  dustTailColor?: string
  /** Tint of the glowing coma that hugs the nucleus. */
  comaColor?: string
}

export interface BodyVisuals {
  textureId: TextureId
  /** How rough the surface looks: 0 = mirror, 1 = matte. */
  roughness: number
  metalness: number
  /** Surface relief strength, when a bump map is generated. */
  bumpScale?: number
  /**
   * A second map that varies roughness across the surface. Earth uses its ocean
   * roughness map here, which is what produces the sun glint on water.
   */
  roughnessMapId?: TextureId
  /**
   * Polar flattening, (equatorial − polar) ÷ equatorial, from IAU measured
   * figures. Applying it is what makes Jupiter and Saturn read as the squashed,
   * fast-spinning giants they are, instead of as spheres.
   */
  flattening?: number
  /** Rotation offset so features (like the Great Red Spot) face nicely at start. */
  textureOffsetU: number
  atmosphere?: AtmosphereVisuals
  clouds?: CloudVisuals
  nightLights?: NightLightsVisuals
  rings?: RingVisuals
  /** Comet-only look (see `CometVisuals`). */
  comet?: CometVisuals
  /** Accent colour used for hover rims, labels and UI highlights. */
  accent: string
  /** Radius of the selection ring drawn on the ecliptic, in planet radii. */
  focusRingScale: number
}

/**
 * Per-body look, derived from measured data.
 *
 * `roughness`/`metalness` come from what the surface actually is — bare rock and
 * regolith scatter almost everything diffusely, so they are matte; the ocean is
 * glassy; cloud tops sit in between. `flattening` is the IAU polar flattening,
 * which is real and large for the two fastest-spinning giants.
 */
export const BODY_VISUALS: Record<BodyId, BodyVisuals> = {
  sun: {
    textureId: 'sun',
    roughness: 0.85,
    metalness: 0,
    textureOffsetU: 0,
    accent: '#ffb347',
    focusRingScale: 1,
  },
  mercury: {
    textureId: 'mercury',
    roughness: 0.96,
    metalness: 0.02,
    bumpScale: 0.012,
    textureOffsetU: 0.18,
    accent: '#cbc4ba',
    focusRingScale: 2.4,
  },
  venus: {
    textureId: 'venus',
    roughness: 0.88,
    metalness: 0,
    // The map already *is* the cloud deck, so the haze here only needs to add the
    // soft, bright limb that the real planet shows.
    atmosphere: {
      color: '#f7e6b4',
      intensity: 0.42,
      power: 2.7,
      hazeColor: '#ffefc6',
      hazeIntensity: 0.22,
    },
    textureOffsetU: 0.4,
    accent: '#f0d9a0',
    focusRingScale: 2.2,
  },
  earth: {
    textureId: 'earth',
    // Multiplied by the ocean/land roughness map, so the sea is smooth and the
    // continents are matte: this is what makes the sun glint on the water.
    roughness: 1,
    metalness: 0,
    roughnessMapId: 'earthRoughness',
    bumpScale: 0.008,
    flattening: 0.00335,
    textureOffsetU: 0.55,
    atmosphere: {
      color: '#6fb4ff',
      intensity: 0.85,
      power: 3.2,
      hazeColor: '#9fd4ff',
      hazeIntensity: 0.3,
    },
    // Real cloud cover drifts a little faster than the ground below it.
    clouds: { textureId: 'earthClouds', opacity: 0.86, speed: 1.08, color: '#ffffff' },
    nightLights: { textureId: 'earthNight', intensity: 1.2, color: '#fff1dc' },
    accent: '#5cc8ff',
    focusRingScale: 2.4,
  },
  mars: {
    textureId: 'mars',
    roughness: 0.94,
    metalness: 0.02,
    bumpScale: 0.014,
    flattening: 0.00589,
    textureOffsetU: 0.3,
    // Mars has a thin, dusty atmosphere: a faint warm limb, nothing more.
    atmosphere: { color: '#ffb08a', intensity: 0.2, power: 3.6 },
    accent: '#ff9a6b',
    focusRingScale: 2.4,
  },
  jupiter: {
    textureId: 'jupiter',
    roughness: 0.92,
    metalness: 0,
    flattening: 0.06487,
    textureOffsetU: 0.42,
    atmosphere: {
      color: '#f0d9b4',
      intensity: 0.3,
      power: 3.2,
      hazeColor: '#d8bb92',
      hazeIntensity: 0.2,
    },
    accent: '#e8c48d',
    focusRingScale: 2.1,
  },
  saturn: {
    textureId: 'saturn',
    roughness: 0.93,
    metalness: 0,
    flattening: 0.09796,
    textureOffsetU: 0.2,
    atmosphere: {
      color: '#f3e2b8',
      intensity: 0.28,
      power: 3.2,
      hazeColor: '#e2cd9c',
      hazeIntensity: 0.18,
    },
    // Measured from the real radii: the ring strip spans the C ring's inner edge
    // (74,700 km) to the F ring (140,400 km) — 1.24 to 2.33 Saturn radii, with
    // Saturn's equatorial radius at 60,268 km.
    rings: {
      textureId: 'saturnRings',
      innerRadiusScale: 1.256,
      outerRadiusScale: 2.33,
      opacity: 1,
      brightness: 1.4,
    },
    accent: '#f0dfae',
    focusRingScale: 2.1,
  },
  uranus: {
    textureId: 'uranus',
    roughness: 0.82,
    metalness: 0,
    flattening: 0.02293,
    textureOffsetU: 0.1,
    atmosphere: {
      color: '#a9f0f2',
      intensity: 0.38,
      power: 3,
      hazeColor: '#8fe6ea',
      hazeIntensity: 0.2,
    },
    // Uranus's rings are nine narrow, dark bands between 37,000 and 51,200 km
    // from the centre — 1.45 to 2.00 Uranus radii (equatorial radius 25,559 km),
    // drawn from their published radii and optical depths because no calibrated
    // Voyager ring strip is available.
    rings: {
      textureId: 'uranusRings',
      innerRadiusScale: 1.448,
      outerRadiusScale: 2.005,
      opacity: 0.75,
      brightness: 1,
    },
    accent: '#a9ecf0',
    focusRingScale: 2.2,
  },
  neptune: {
    textureId: 'neptune',
    roughness: 0.84,
    metalness: 0,
    flattening: 0.01708,
    textureOffsetU: 0.6,
    atmosphere: {
      color: '#6f8dff',
      intensity: 0.5,
      power: 3,
      hazeColor: '#5a76ff',
      hazeIntensity: 0.26,
    },
    accent: '#7d95ff',
    focusRingScale: 2.2,
  },
  pluto: {
    textureId: 'pluto',
    roughness: 0.95,
    metalness: 0.01,
    bumpScale: 0.014,
    textureOffsetU: 0.1,
    // Pluto's nitrogen atmosphere is a hundred-thousandth of Earth's pressure, but
    // when New Horizons looked back at the night side the haze glowed a clear
    // blue — sunlight scattering off soot-like tholin particles. It climbs some
    // 200 km above the surface, so it forms a broad, pale-blue halo rather than
    // the tight rim a thicker atmosphere would give.
    atmosphere: {
      color: '#7fa8ff',
      intensity: 0.3,
      power: 3.1,
      hazeColor: '#a9c8ff',
      hazeIntensity: 0.22,
    },
    accent: '#d9bd9a',
    focusRingScale: 2.4,
  },
  moon: {
    textureId: 'moon',
    roughness: 0.97,
    metalness: 0,
    bumpScale: 0.02,
    flattening: 0.0012,
    textureOffsetU: 0.05,
    accent: '#d8d4cd',
    focusRingScale: 2.4,
  },
  comet: {
    textureId: 'cometNucleus',
    roughness: 0.88,
    metalness: 0,
    textureOffsetU: 0,
    // Cline-1 is a younger, rounder comet: a lumpy ellipsoid of pale ice that
    // glows as it nears the Sun, wrapped in a wide blue-white coma.
    comet: {
      nucleusColor: '#cec7ba',
      emissiveColor: '#8fe0ff',
      emissiveIntensity: 0.1,
      tailColor: '#b6e8ff',
      nucleusAxes: [1, 0.84, 0.92],
      nucleusWaist: 0.12,
      ionTailColor: '#8fd2ff',
      dustTailColor: '#eef2ff',
      comaColor: '#c8ecff',
    },
    accent: '#bff4ff',
    focusRingScale: 3,
  },
  halley: {
    textureId: 'cometNucleus',
    roughness: 0.97,
    metalness: 0,
    textureOffsetU: 0,
    // Giotto found a crust that reflects 4% of the light that lands on it — one
    // of the darkest surfaces measured in the Solar System — so the nucleus is
    // drawn near-black and the glow comes from the gas boiling off it. Its shape
    // is the famous 15 × 7 × 7 km peanut photographed by Giotto in 1986.
    comet: {
      nucleusColor: '#6a6158',
      emissiveColor: '#9fe8ff',
      emissiveIntensity: 0.05,
      tailColor: '#dbeaff',
      nucleusAxes: [1, 0.48, 0.48],
      nucleusWaist: 0.26,
      ionTailColor: '#6fb0ff',
      dustTailColor: '#f0e2c2',
      comaColor: '#bfe0d4',
    },
    accent: '#cfe9ff',
    focusRingScale: 3,
  },
  belt: {
    textureId: 'comet',
    roughness: 0.95,
    metalness: 0,
    textureOffsetU: 0,
    accent: '#cbb89a',
    focusRingScale: 2.4,
  },
}
