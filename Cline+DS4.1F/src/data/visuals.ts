import type { BodyId } from '../types'

/** Every surface map the scene can request. */
export type TextureId =
  | 'sun'
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'earthHeightmap'
  | 'earthBathymetry'
  | 'earthClouds'
  | 'earthNight'
  | 'earthRoughness'
  | 'seafloorRamp'
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

/**
 * Real terrain relief, driven by a global digital elevation model.
 *
 * Only Earth has one. The map is an equirectangular 8-bit grayscale height
 * field, and the four numbers below are what turn those texels back into
 * metres — the two texel values that mean "sea level" and "the highest land",
 * and the real height of that land. Everything else (the displacement, the
 * shading normals, how far above the surface the cloud deck has to sit) is
 * derived from them, so a different DEM only needs a new file and a new
 * encoding here.
 */
export interface TerrainVisuals {
  heightMapId: TextureId
  /** The texel value (0…1) that means sea level in this map. */
  seaLevelTexel: number
  /** The texel value (0…1) that means the highest land in this map. */
  peakTexel: number
  /** How high that highest land really is, in metres. */
  peakElevationM: number
  /**
   * Vertical exaggeration applied at the full "Terrain relief" setting. The
   * true relief is 0.14% of Earth's radius, which is a fraction of a pixel on
   * a globe that fills the screen, so relief globes have always stretched it;
   * this is the stretch, and the UI says so.
   */
  maxExaggeration: number
}

/**
 * Real seafloor depth, driven by a global bathymetry grid.
 *
 * Only Earth has one. The map is an equirectangular 8-bit grayscale *depth*
 * field — **0 is sea level and 255 is `maxDepthMeters` deep** — built from the
 * public-domain ETOPO 2022 60″ relief model by `tools/fetch-bathymetry.mjs`.
 * The stored value is not linear in depth: it is a `depthExponent` curve
 * (`depth = maxDepthMeters · (texel / maxTexel) ^ depthExponent`, with
 * `depthExponent = 2`), so the shallow continental shelves get most of the
 * levels and the abyssal plains share the rest. The shader in
 * `components/3d/terrain.ts` inverts that curve.
 *
 * The "Seawater" slider reveals the floor: 100% leaves the ocean exactly as it
 * was (the floor is neither displaced nor coloured), and 0% drains it. The
 * relationship is a deliberate, documented *nominal visibility* factor — see the
 * hint text in the planet panel — not a physical model of underwater light.
 *
 * These numbers describe the **surface** ocean implementation, where the floor
 * fades in place (see `data/seawaterModes.ts`). The separate, transparent water
 * layer of the "volumetric" mode carries its own tuning in `WaterVisuals`.
 */
export interface SeafloorVisuals {
  /** The depth field (grayscale, equirectangular, aligned with the day map). */
  bathymetryMapId: TextureId
  /** A 1-D colour ramp sampled by normalised depth (0 shallow → 1 deepest). */
  rampMapId: TextureId
  /** The texel value (0…1) that means sea level. */
  seaLevelTexel: number
  /** The texel value (0…1) that means `maxDepthMeters` deep. */
  maxTexel: number
  /** The depth (metres, positive downward) that `maxTexel` stands for. */
  maxDepthMeters: number
  /**
   * The texel value (0…1) of the deepest point **actually present** in the map.
   *
   * `maxTexel`/`maxDepthMeters` describe the encoding's ceiling — a round
   * 11,000 m — but no point in the real grid reaches it. Measured from the
   * shipped `earth_bathymetry.png`, the deepest texel is **250** (≈ 10,573 m, in
   * the Tonga Trench; the Mariana's Challenger Deep lands at texel 249). The
   * "Sea Level" fill is measured against *this* point, not the ceiling, so 0%
   * brings the surface down to the deepest floor exactly instead of overshooting
   * 400 m below it and leaving a dead band where the slider does nothing.
   */
  deepestTexel: number
  /** `depth = maxDepth · (texel / maxTexel) ^ depthExponent`. 2 = a sqrt curve. */
  depthExponent: number
  /** Vertical exaggeration applied at the full "Seafloor relief" setting. */
  maxExaggeration: number
  /** How matte the drained seafloor reads (0 = mirror, 1 = fully rough). */
  roughness: number
  /**
   * The water's per-channel Beer–Lambert extinction (R, G, B), at full opacity
   * and a straight-down view. Red is absorbed first — which is why deep water
   * reads blue — and the whole scale is deliberately compressed so the seafloor
   * stays visible through it. It is a *visual* model, not a calibrated optical
   * one, and it has no effect at 100% (opaque ocean) or 0% (fully drained).
   */
  absorption: [number, number, number]
  /**
   * The colour light takes on as it scatters through the water column — what the
   * floor fades toward where the water is deep, or seen at a grazing angle.
   */
  waterTint: string
  /**
   * The reveal curve's exponent: the floor's visibility is
   * `(1 − opacity) ^ revealGamma`, applied to *both* the geometry and the colour
   * so they stay in step.
   *
   * 1 is the plain inverse-linear relationship; below 1 reveals the floor faster
   * in the middle of the slider, so a half-drained ocean already reads as
   * drained. It is a presentation curve, not physics — the note on the panel
   * says the slider is not a model of real underwater visibility.
   */
  revealGamma: number
}

/**
 * The ocean's **procedural wave field** — what the panel's "Wave intensity"
 * slider scales (see `utils/waves.ts` and `components/3d/water.ts`).
 *
 * The waves are not a texture: they are a height field evaluated from the
 * sphere's own direction, so there is no map to seam at longitude 0, nothing
 * pinched at the poles, and nothing to slide. Two crossed swells give the sea
 * its direction, but their crests are bent by the fine noise chop, so they
 * wander like real swell instead of forming stripes or a bullseye at a pole. All
 * of it is advected through time, so the shapes genuinely evolve and morph the
 * way the cloud deck does — they are never a moving picture of waves.
 */
export interface WaterWaveVisuals {
  /**
   * How many times the base wave pattern is tiled across the globe. The base is
   * the original, very large swell (one crest every ~60° of arc); larger values
   * make every wave finer and more numerous. It is what turns the sea from a few
   * giant bands into the fine, sunlit texture it should be at globe scale.
   */
  scale: number
  /** How far the surface normal tilts at full amplitude (the slider's top end). */
  maxStrength: number
  /** The chop's share of the height field at full variability. */
  maxChop: number
  /** The swell spectrum's overall amplitude. */
  swell: number
  /** The drifting point sources' overall amplitude. */
  source: number
  /** The globe-wide wind field's spatial scale (higher = smaller features). */
  windScale: number
  /** How far the local wind bends each swell's direction. */
  windAmount: number
  /** The colour the breaking surf is tinted with. */
  foamColor: string
  /**
   * The view angle at which the waves are fully gone and fully present, as the
   * cosine of the angle between the surface normal and the line of sight: 0 is
   * the very edge of the disc (grazing), 1 is dead centre (facing the camera).
   * The water eases to a smooth, mirror-like surface as it turns away, which is
   * what stops fine chop smearing at the limb.
   */
  limbFade: [number, number]
  /**
   * How far the globe can be before its waves fade out, as multiples of the
   * planet's drawn radius: full waves up to the first, a smooth mirror past the
   * second. It is scale-invariant, so it behaves the same in every scale mode
   * and simply hides the chop when the whole Earth is a distant dot.
   */
  distanceFade: [number, number]
}

/**
 * The ocean **surface**: a genuinely transparent water layer drawn on top of the
 * seafloor, not a fade of it (see `components/3d/Ocean.tsx`).
 *
 * It is its own mesh at sea level, so the floor stays where it belongs — at the
 * bottom of the water column — and you look *through* the water at it, with the
 * parallax that comes from the two surfaces being at different radii. The layer
 * carries three things a liquid surface needs:
 *
 *  - **Beer's-law body colour.** `absorption` is the per-channel extinction of
 *    the water itself, so a shallow shelf keeps the bright day-map blue while the
 *    abyss falls away through teal to navy, driven by the real depth under each
 *    pixel.
 *  - **A living, procedural wave field** (`wave`), so the surface is never the
 *    same twice and its glints travel the way real water does.
 *  - **A proper specular response**, from a low `roughness` — the glint that
 *    tells you this is a liquid surface and not a painted texture.
 *
 * `revealGamma` shapes how fast the slider thins the water: the layer's alpha is
 * `1 − (1 − opacity) ^ revealGamma`, so a half-way slider already shows most of
 * the floor. It is a presentation curve, and the panel note says the slider is
 * not a model of real underwater visibility.
 */
export interface WaterVisuals {
  /** Surface roughness: low is glassy. */
  roughness: number
  metalness: number
  /** Beer's-law extinction of the water body, linear RGB. */
  absorption: [number, number, number]
  /** The colour the water scatters back where it is deep. */
  waterTint: string
  /** The reveal curve's exponent (see above). */
  revealGamma: number
  /** The procedural wave field (see `WaterWaveVisuals`). */
  wave?: WaterWaveVisuals
}

/**
 * The seafloor's depth ramp, shallow (0) to deepest (1).
 *
 * A cool bathymetric palette — a pale shelf, a mid-blue slope, a near-black
 * trench. Most of the ocean sits between 3,000 m and 6,000 m, so the stops are
 * packed into the middle of the range (0.27…0.55) to keep the abyssal plains,
 * the mid-ocean ridges and the fracture zones visually distinct.
 */
export const SEAFLOOR_RAMP: [number, string][] = [
  [0, '#d9c9a0'],
  [0.05, '#b9b492'],
  [0.12, '#7fa294'],
  [0.22, '#46889f'],
  [0.35, '#2a6c90'],
  [0.5, '#1b5075'],
  [0.68, '#113a5a'],
  [0.85, '#0a2740'],
  [1, '#04121f'],
]

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
  /**
   * Real elevation data, when the body has any. Present only for Earth, whose
   * surface is genuinely displaced by a global DEM instead of being a smooth
   * sphere (see `TerrainVisuals`).
   */
  terrain?: TerrainVisuals
  /**
   * Real seafloor depth, when the body has any. Present only for Earth (see
   * `SeafloorVisuals`); revealed by the shared seawater slider.
   */
  seafloor?: SeafloorVisuals
  /**
   * The ocean surface, when the body has one. Present only for Earth (see
   * `WaterVisuals`); drawn as a transparent layer above the seafloor.
   */
  water?: WaterVisuals
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
    // Earth has no `bumpScale`: its relief is real, so it comes from the
    // elevation model below rather than from a fake shading trick on the map.
    //
    // The DEM is the NASA / USGS SRTM–GTOPO30 height field, normalised to 8-bit
    // grayscale. In that normalisation sea level is texel 12 and the highest
    // land — Everest, 8,848 m — is texel 218, which is what the two texel
    // values below record.
    terrain: {
      heightMapId: 'earthHeightmap',
      seaLevelTexel: 12 / 255,
      peakTexel: 218 / 255,
      peakElevationM: 8_848,
      maxExaggeration: 160,
    },
    // The seafloor, from the public-domain ETOPO 2022 60″ bathymetry grid (see
    // `tools/fetch-bathymetry.mjs`). Texel 0 is sea level and 255 is 11,000 m
    // deep, on a square-root curve so the shallow shelves keep their detail.
    // Its own relief slider (independent of "Terrain relief") sets the
    // exaggeration, so the drained ocean can be dialled in on its own.
    seafloor: {
      bathymetryMapId: 'earthBathymetry',
      rampMapId: 'seafloorRamp',
      seaLevelTexel: 0,
      maxTexel: 1,
      maxDepthMeters: 11_000,
      // The deepest texel in the shipped map (measured): 10,573 m, Tonga Trench.
      deepestTexel: 250 / 255,
      depthExponent: 2,
      maxExaggeration: 160,
      roughness: 0.92,
      // The "surface" mode's own water column: a shallow shelf keeps the day-map
      // blue while the abyss falls through teal to navy, and the floor fades to
      // the tint where the water is deep or seen at a grazing angle.
      absorption: [3.4, 1.7, 1],
      waterTint: '#0a2b4d',
      revealGamma: 0.65,
    },
    // The ocean surface itself: a transparent, specular water layer at sea
    // level, through which the seafloor above is seen. Its own absorption runs
    // the shallows bright and the abyss navy, and its waves are a procedural
    // height field (see `WaterWaveVisuals`), not a texture.
    water: {
      // A little rougher than a mirror: a living sea breaks a single hard glint
      // into a field of small ones, and it keeps the specular from aliasing.
      roughness: 0.18,
      metalness: 0,
      absorption: [0.95, 0.5, 0.32],
      waterTint: '#0a2b4d',
      revealGamma: 0.7,
      wave: {
        // Many times finer than the original swell: at the default view the sea
        // is a fine, sunlit texture, not bands you could see from the Moon. The
        // shader fades any wave that drops below a few pixels, so a larger value
        // simply reveals more detail as you zoom in rather than aliasing.
        scale: 13,
        // The height field's gradient runs to roughly 10, so this tilts the
        // normal by up to ~50° at the top of the slider — a rough sea, without
        // tipping the normals so far that the glints become noise.
        maxStrength: 0.16,
        // How much the "Wave variability" slider swells the fine chop against
        // the long swell.
        maxChop: 0.7,
        // The swell spectrum's amplitude, and the globe-wide wind that turns and
        // scales it per region: ~1/3.5 radian features means the wave direction
        // changes over roughly 1,000–2,000 km, and it bends each swell by up to
        // ~40°, so no two regions carry the same sea.
        swell: 0.3,
        // The drifting point sources: localised systems that wander, evolve and
        // die, leaving their wavefronts behind. Kept a few, not many — the aim
        // is organic variation, not ever more sources.
        source: 0.03,
        windScale: 4,
        windAmount: 0.5,
        foamColor: '#bfe4ff',
        // Waves hold across most of the disc and ease out over the outer band
        // (facing ≈ 0.35 → 0.05, roughly the last 15–20° to the limb).
        limbFade: [0.05, 0.35],
        // Full waves out to 30 Earth radii — well past a close, framed Earth —
        // and a smooth mirror beyond 80, where the whole globe is a small dot.
        distanceFade: [30, 80],
      },
    },
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
      ionTailColor: '#7cc4ff',
      dustTailColor: '#f2e3c0',
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
      ionTailColor: '#5aa0ff',
      dustTailColor: '#f0d49a',
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
