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
  | 'waterNormal'
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
 * The **procedural wave field** of the "spectral" wave style — what the panel's
 * "Wave intensity" slider scales while that style is active (see
 * `utils/waves.ts`, `components/3d/water.ts` and `data/waveStyles.ts`).
 *
 * The waves are not a texture: they are a height field evaluated from the
 * sphere's own direction, so there is no map to seam at longitude 0, nothing
 * pinched at the poles, and nothing to slide. A directional spectrum of plane
 * waves gives the sea its swell, a shared crest warp bends those wavefronts so
 * they wander rather than closing into rings at each wave's pole, each component
 * is gathered around its own pole into a **discrete wave source**
 * (`sourceFalloff`), and each is a **transient swell system** that fades in,
 * holds, fades out and respawns elsewhere — so the wave sources come and go the
 * way real wave climate does, instead of sitting still. A fine noise chop churns
 * through the middle. All of it is advected through time, so the shapes genuinely
 * evolve and morph the way the cloud deck does — they are never a moving picture
 * of waves.
 *
 * The `swell*`, `chop*`, `warp*`, `wind*`, `life*`, `sourceFalloff` and
 * `respawnStride` knobs each list a useful range. They are plain config values — never clamped
 * and not exposed as sliders — so those ranges are tuning guidance for the eye,
 * not enforced limits. The crest bend is roughly `2 × warpScale × warpAmount`
 * wavelengths, so the two warp knobs act as a product; keep it within about
 * 0.2 – 1.5. Setting `life` to 0 pins every source, and `warpAmount` and
 * `windAmount` to 0 then reproduces the plain sum of sines (the old, ringed sea)
 * exactly.
 */
export interface WaterWaveVisuals {
  /**
   * The surface roughness while this style is active: low is glassy. Each wave
   * style carries its own, because the specular glint was tuned against its own
   * normal source — the procedural field breaks a hard glint into small ones at
   * a touch higher roughness than the tiled map does.
   */
  roughness: number
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
  /**
   * How far the chop's cells wander from their uniform drift, in cell-widths.
   * The chop always translates as one sheet; this adds a slow, low-frequency
   * flow on top, so neighbouring cells drift in different directions and the
   * fine texture churns and eddies instead of sliding rigidly.
   *
   * Useful range **0 – 3** (default 1.5). 0 keeps the old rigid slide; around
   * 1.5 the cells wander by roughly a cell as the flow turns over; much higher
   * smears the texture into mush.
   */
  chopFlow: number
  /**
   * How fast that flow turns over, as a multiple of the shipped rate (0.021 per
   * wave-clock second). Higher makes the cells eddy more quickly; 0 freezes the
   * flow, so the chop becomes a fixed warp sliding rigidly (see `chopFlow`).
   *
   * Useful range **0 – 4** (default 1). It scales the *flow's* turnover only —
   * the cells' uniform travel is set by the wave clock, not this.
   */
  chopFlowRate: number
  /**
   * How fast the whole chop pattern travels, as a multiple of the shipped rate.
   * This is the master speed for the fine texture: 2 is shipped, and it goes up
   * to 100 so the cells can be made to move as briskly as the eye needs. It
   * scales both the uniform drift and the flow's turnover (see `chopFlow`).
   *
   * Useful range **0 – 100** (default 2). 0 freezes the chop entirely; ~10 is
   * a fast, obvious drift; very high reads as fast-moving static.
   */
  chopDrift: number
  /** The swell spectrum's overall amplitude. */
  swell: number
  /**
   * A multiplier on the swell — the directional spectrum's ring/crest pattern,
   * which is the dense arcs and loops seen across the sea. 0 removes it
   * completely (leaving only the fine chop), 1 is the shipped look.
   *
   * Useful range **0 – 2** (default 1). Lower it to calm the ring pattern; 0
   * turns the sea into pure chop; above 1 gives a heavier, more banded sea.
   */
  swellIntensity: number
  /**
   * How far the swell's crests are carried by a slow travel flow, in
   * wavelengths. The crests are arcs on a fixed axis, so without this they only
   * pulse out of their poles; this displaces them along their own wavefronts by
   * a drifting noise field, so they wander in varying directions and at varying
   * speeds. It combines with the lifecycle (`life`), which fades whole systems
   * out and respawns them elsewhere.
   *
   * Useful range **0 – 20** (default 4). 0 pins the crests to their poles (the
   * old look); a few wavelengths is a strong, obvious travel. Very large values
   * need a smaller `swellFlowScale`, or the crests tear instead of travelling.
   */
  swellFlow: number
  /**
   * How fast that travel flow evolves, as a multiple of the shipped rate.
   *
   * Useful range **0 – 100** (default 8). 0 freezes the flow (the crests hold
   * their displaced positions); higher makes them wander more briskly.
   */
  swellFlowRate: number
  /**
   * The travel flow's spatial frequency, relative to `scale`. Smaller values
   * make larger, smoother flow cells — a wide region is carried the same way —
   * so a large `swellFlow` moves the crests coherently instead of shredding
   * them.
   *
   * Useful range **0.03 – 1** (default 0.1). Lower it when you raise
   * `swellFlow`; raise it for a finer, more jittery flow.
   */
  swellFlowScale: number
  /**
   * A steady march on top of the flow, in wavelengths per wave-clock second.
   * `swellFlow` is bounded — the crests sweep out and come back — so this adds a
   * displacement that keeps accumulating, making the crests travel continuously
   * one way. The direction is a slow noise field, so neighbouring regions march
   * different ways, and the lifecycle resets the accumulation whenever a system
   * respawns, so it never shears without bound.
   *
   * Useful range **0 – 10** (default 1.5). 0 leaves just the flow's sweep; ~1–2
   * is a clear, steady march; above ~3 the crests shear noticeably within a
   * single lifetime. A lifetime is about one wave-clock second, so the number is
   * roughly the wavelengths travelled per lifetime.
   */
  swellDrift: number
  /**
   * A static shear that scrunches the crests finer and denser — the same field
   * as `swellDrift`, but held still instead of marching. This is the "fine,
   * dense rings" look: 0 keeps the normal ring size, and higher makes the crests
   * progressively smaller and more numerous.
   *
   * Useful range **0 – 80** (default 0). ~10 is a mild finer texture; ~40–60 is
   * the very fine, dense sea (the old drift bug's look); beyond ~100 it reads as
   * noise. It is driven live by the panel's "Ring detail" slider.
   */
  swellDetail: number
  /**
   * The shear value the "Ring detail" slider reaches at 100% (the slider itself
   * is 0…1). ~80 reaches the very fine, dense sea.
   */
  swellDetailMax: number
  /**
   * The crest warp's spatial frequency, relative to `scale`. Every spectral
   * component's phase is offset by a shared low-frequency field of this scale,
   * so the wavefronts wander instead of closing into rings around each plane
   * wave's pole.
   *
   * Useful range **0.2 – 3** (default 1). At 0 the warp is constant over the
   * globe, so it only shifts every phase equally and the rings return; very high
   * makes the warp change per pixel and shreds the wavefronts into noise. It
   * acts as a product with `warpAmount` — see the note on this interface.
   */
  warpScale: number
  /**
   * How far the crest warp bends each component's phase, as a fraction of its
   * own wavelength. 0 restores the plain sum of sines (clean concentric rings);
   * ~1 lets the crests wander by about one wavelength.
   *
   * Useful range **0 – 1.5** (default 0.7). Above ~2 the crests wander more than
   * a wavelength and cross each other, reading as random rather than as waves.
   */
  warpAmount: number
  /**
   * The globe-wide wind field's spatial scale (higher = smaller features).
   *
   * Useful range **1 – 12** (default 4). Low puts one wind axis over a whole
   * hemisphere (a uniform sea); high makes the wind flicker per pixel and alias.
   */
  windScale: number
  /**
   * How far the local wind bends each swell's direction. The bend tops out at
   * `atan(windAmount)` at a right angle to the wind: 0.5 → 27°, 0.9 → 42°,
   * 1 → 45°.
   *
   * Useful range **0 – 1.5** (default 0.9). At 0 every component keeps its fixed
   * direction fan and the rings return; above ~2 the wave vector swings so far
   * that the fan is meaningless and the wavefronts cross chaotically.
   */
  windAmount: number
  /**
   * The finer wind octave's frequency, as a multiple of `windScale`. It makes
   * the wave axis change from region to region instead of staying fixed.
   *
   * Useful range **1.5 – 6** (default 3). At 1 it matches the base octave (not
   * "fine" — it just thickens the wind); very high turns it into per-pixel
   * noise. It only has any effect while `windAmount > 0`, and its weight is
   * hard-coded at 0.7 in the shader, so this changes the frequency only.
   */
  windDetail: number
  /**
   * The base lifetime of one transient swell system, in wave-clock seconds (the
   * clock the intensity slider scales, so a livelier sea turns the systems over
   * faster). Each spectrum component fades in, holds, fades out and respawns —
   * deliberately far from where it died — on this cadence, so the wave sources
   * come and go instead of sitting still.
   *
   * Useful range **1 – 120** (default 1). 0 pins every axis and restores the
   * plain, stationary spectrum; too short and the sea flickers as systems churn.
   */
  life: number
  /**
   * The fraction of a lifetime spent fading in and out, so a system never pops
   * in or out. The held plateau is the middle `1 − 2 × lifeFade`.
   *
   * Useful range **0.1 – 0.4** (default 0.3). At 0.5 the two fades meet and the
   * system is never at full strength.
   */
  lifeFade: number
  /**
   * How tightly each swell system is gathered around its own pole, so it reads
   * as a discrete wave source with a home region rather than a wave that covers
   * the whole globe. 0 keeps the old global spectrum; higher tightens each
   * source, so the sea becomes a field of distinct, overlapping sources.
   *
   * Useful range **0 – 3** (default 2.4). Around 1 the ocean stays covered but
   * the sources are clearly regional; much higher leaves calm gaps between them.
   */
  sourceFalloff: number
  /**
   * How far the next source spawns from the one that just faded out. The respawn
   * steps through a Fibonacci spiral of 32 evenly spread directions; this is the
   * stride between generations — how many slots ahead it jumps.
   *
   * Must be odd (coprime to 32) so every slot is visited before any repeats; even
   * values are rounded up to the next odd one. The spiral's golden-angle geometry
   * makes the stride-to-distance relationship uneven, so read the table rather
   * than assuming "bigger = farther". The angle the source actually jumps, averaged
   * over many respawns — and the source is bright only at +K, so this is the
   * distance you perceive:
   *
   *   `3`, `5`              → ~53°        (closest)
   *   `13`, `19`            → ~76°
   *   `11`, `21`            → ~80°        (default)
   *   `1`, `31`             → ~104°
   *   `7`, `25`             → ~112°
   *   `9`, `15`, `17`, `23` → ~121–123°   (farthest)
   *
   * The far end tops out around 123°: a sphere caps any separation at 180°, and
   * this spiral cannot reach that. (A construction that could hit ~180° — the
   * source jumping to the exact far side — is a bigger change; ask if you want it.)
   */
  respawnStride: number
}

/**
 * The **tiling ripple normal map** of the "ripples" wave style — the ocean's
 * original surface animation, restored as an alternative to the procedural sea
 * (see `data/waveStyles.ts` and `components/3d/water.ts`).
 *
 * A small, seamless tangent-space normal map is repeated many times across the
 * globe and slid across it, so the surface catches the sun with travelling
 * glints. Two copies of the same map are used: the **base layer** is the
 * material's own normal map (scaled by `normalScale`, repeated by
 * `normalRepeat` and scrolled by `drift`), and a second, finer **detail layer**
 * is sampled at `detailRepeatScale` times that repeat and scrolled by
 * `detailDrift`, so the surface evolves and morphs instead of sliding as one
 * rigid sheet. It is cheaper than the spectral field, but the pattern repeats.
 *
 * The view/distance fade and the surf colour are shared with the spectral style
 * and live on `WaterVisuals` itself.
 */
export interface WaterRippleVisuals {
  /**
   * The surface roughness while this style is active: low is glassy. It is the
   * glassier of the two (see `WaterWaveVisuals.roughness`), which is what the
   * tiled map shipped with.
   */
  roughness: number
  /** The tiling ripple normal map for the surface. */
  normalMapId: TextureId
  /** How far the ripples tilt the surface normal, at the 25% baseline. */
  normalScale: number
  /** Ripple repeats around the globe and from pole to pole. */
  normalRepeat: [number, number]
  /** Ripple drift, in UV turns per real second, at the 25% baseline. */
  drift: [number, number]
  /** The detail layer's scale relative to `normalRepeat` (a finer ripple). */
  detailRepeatScale: number
  /** The detail layer's normal strength at full variability. */
  detailNormalScale: number
  /** The detail layer's drift at the baseline speed, in UV turns per second. */
  detailDrift: [number, number]
}

/**
 * The physically-inspired surface shading, shared by both wave styles. It is
 * what makes the sea read as water rather than plastic from a high altitude or
 * from space, where individual waves are too small to see:
 *
 *  - **A Fresnel reflection of the sky.** Real water reflects almost nothing
 *    head-on and almost everything at a grazing angle, so the disc centre keeps
 *    its dark body colour while the limb picks up a bright, view-dependent
 *    sheen. Without it the only reflection is the Sun's point light, which reads
 *    as a single hard plastic highlight; a uniform blue with no view-dependent
 *    light is exactly what makes a smooth sphere look like painted plastic.
 *  - **A glint that broadens as the waves fall below the pixel grid.** A real
 *    sun glint is a broad, broken swath of glitter, not a mirror spot. Adding
 *    roughness where the view grazes the surface (the limb) and where the globe
 *    recedes (so the sub-pixel wave slopes are unresolved) spreads the highlight
 *    into a soft sheen instead of a "shiny ball".
 *
 * Both are pure shading: they change only how the water catches the light, never
 * the shape of the globe.
 */
export interface WaterSurfaceVisuals {
  /** The colour the surface reflects at a grazing angle — the sky/atmosphere. */
  skyColor: string
  /**
   * The sky reflection at the panel's "Sky reflection" slider top end. 1 is the
   * physical Fresnel weight; the shipped default sits at 60% (see
   * `earthSkyReflection`), so the limb glows without competing with the
   * atmosphere shell drawn over it.
   */
  skyStrength: number
  /**
   * Extra surface roughness added where the waves are unresolved — at the
   * grazing limb and as the globe recedes — so the sun glint broadens into a
   * sheen. It is added on top of the style's own `roughness`.
   *
   * Useful range **0 – 0.4** (default 0.22). 0 leaves the glint a mirror; much
   * higher turns the sea matte and kills the sparkle.
   */
  glintBroaden: number
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
 *  - **A water-body colour**, chosen by the panel's "Ocean colour" switcher (see
 *    `data/oceanColours.ts`). The preset's `waterTint` sets the sea's hue: the
 *    day map's own ocean colour is recoloured by it, keeping the real sediment
 *    and shelf shading as a brightness variation but replacing the day map's own
 *    blue.
 *    The preset's `absorption` then darkens the deep basins a touch, and one
 *    option (`natural`) instead leaves the day map's colour untouched. The
 *    options are the deep blues (plus a tropical turquoise) that read from a
 *    high altitude or from space.
 *  - **A wave field**, chosen by the panel's wave-style switcher (see
 *    `data/waveStyles.ts`). Either the living, procedural sea (`wave`) or the
 *    original tiling ripple normal map (`ripple`), so the surface is never the
 *    same twice and its glints travel the way real water does.
 *  - **A proper specular response**, from a low `roughness` — the glint that
 *    tells you this is a liquid surface and not a painted texture. Each wave
 *    style carries its own `roughness` (see `WaterWaveVisuals` and
 *    `WaterRippleVisuals`), because the glint was tuned against its normal
 *    source. The `surface` block then adds the sky reflection and the glint
 *    broadening that keep it from reading as plastic at a distance.
 *
 * `revealGamma` shapes how fast the slider thins the water: the layer's alpha is
 * `1 − (1 − opacity) ^ revealGamma`, so a half-way slider already shows most of
 * the floor. It is a presentation curve, and the panel note says the slider is
 * not a model of real underwater visibility.
 */
export interface WaterVisuals {
  metalness: number
  /** The reveal curve's exponent (see above). */
  revealGamma: number
  /** The colour the breaking surf is tinted with. Shared by both wave styles. */
  foamColor: string
  /**
   * The view angle at which the waves are fully gone and fully present, as the
   * cosine of the angle between the surface normal and the line of sight: 0 is
   * the very edge of the disc (grazing), 1 is dead centre (facing the camera).
   * The water eases to a smooth, mirror-like surface as it turns away, which is
   * what stops fine chop smearing at the limb. Shared by both wave styles.
   */
  limbFade: [number, number]
  /**
   * How far the globe can be before its waves fade out, as multiples of the
   * planet's drawn radius: full waves up to the first, a smooth mirror past the
   * second. It is scale-invariant, so it behaves the same in every scale mode
   * and simply hides the chop when the whole Earth is a distant dot. Shared by
   * both wave styles.
   */
  distanceFade: [number, number]
  /** The Fresnel sky reflection and glint broadening (see `WaterSurfaceVisuals`). */
  surface?: WaterSurfaceVisuals
  /** The procedural directional-spectrum sea — the "spectral" style. */
  wave?: WaterWaveVisuals
  /** The tiling ripple normal map — the "ripples" style. */
  ripple?: WaterRippleVisuals
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
    // level, through which the seafloor above is seen. Its body colour comes from
    // the panel's "Ocean colour" switcher (see `data/oceanColours.ts`), and its
    // waves come from whichever style the switcher selects (see
    // `data/waveStyles.ts`): the procedural sea (`wave`) or the tiling ripple map
    // (`ripple`).
    water: {
      metalness: 0,
      revealGamma: 0.7,
      // The surf colour and the view/distance fade are shared by both wave
      // styles; only the normal source below differs.
      foamColor: '#bfe4ff',
      // Waves hold across most of the disc and ease out over the outer band
      // (facing ≈ 0.35 → 0.05, roughly the last 15–20° to the limb).
      limbFade: [0.05, 0.35],
      // Full waves out to 30 Earth radii — well past a close, framed Earth —
      // and a smooth mirror beyond 80, where the whole globe is a small dot.
      distanceFade: [30, 80],
      // The physically-inspired surface shading (see `WaterSurfaceVisuals`):
      // the Fresnel sky reflection and the glint broadening. This is what keeps
      // the sea from reading as a smooth blue plastic ball at a distance.
      surface: {
        // The sky the sea reflects at a grazing angle is Earth's own blue air.
        skyColor: '#6fb4ff',
        // The reflection at the slider's top end: the full physical Fresnel
        // weight. The shipped default is 60% (see `earthSkyReflection`), which
        // glows without competing with the atmosphere shell drawn over it.
        skyStrength: 1,
        // Spread the glint into a sheen where the waves are unresolved: at the
        // grazing limb and as the globe recedes into the distance.
        glintBroaden: 0.22,
      },
      // The "spectral" style: the living, procedural sea.
      wave: {
        // A little rougher than a mirror: the procedural field breaks a single
        // hard glint into a field of small ones, and it keeps the specular from
        // aliasing.
        roughness: 0.18,
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
        // How far the chop's cells wander from their uniform drift, in
        // cell-widths. 0 = the old rigid slide; higher lets the cells churn.
        chopFlow: 1.5, // 0–3
        // How fast that flow turns over, as a multiple of the shipped rate.
        // 0 = a frozen flow (the cells just slide); higher eddies faster.
        chopFlowRate: 1, // 0–4
        // Master speed for the whole chop pattern: 1 = shipped, up to 100 for a
        // fast, obvious drift. Scales both the uniform drift and the flow.
        chopDrift: 3, // 0–100
        // The swell spectrum's amplitude, and the globe-wide wind that turns and
        // scales it per region: ~1/3.5 radian features means the wave direction
        // changes over roughly 1,000–2,000 km, and it bends each swell by up to
        // ~40°, so no two regions carry the same sea.
        swell: 0.36,
        // A multiplier on the swell — the directional spectrum's dense ring/crest
        // pattern. 0 = no swell at all (pure chop); 1 = the shipped look.
        swellIntensity: 1, // 0–2
        // How far the swell's crests are carried by the travel flow, in
        // wavelengths. 0 = the old fixed-pole rings; higher lets them wander.
        swellFlow: 4, // 0–20
        // How fast that travel flow evolves, as a multiple of the shipped rate.
        swellFlowRate: 8, // 0–100
        // The travel flow's spatial frequency, relative to `scale`. Lower = larger
        // flow cells, so a big swellFlow carries the crests instead of tearing them.
        swellFlowScale: 0.1, // 0.03–1
        // A steady march on top of the flow, in wavelengths per wave-clock
        // second (~per lifetime). 0 = the flow's out-and-back sweep only;
        // higher marches the crests one way. ~1–2 clear; above ~3 shears.
        swellDrift: 1.5, // 0–10
        // A static shear that scrunches the crests finer and denser. 0 = the
        // normal ring size; higher = progressively finer and more numerous.
        // Driven live by the panel's "Ring detail" slider.
        swellDetail: 0, // 0–80
        swellDetailMax: 10000, // 1K generates much finer rings/arcs swell waves than 80, // the "Ring detail" slider's top end
        // The crest warp: a low-frequency field that offsets every component's
        // phase, so the swells wander and interleave instead of closing into
        // rings around each plane wave's pole. ~1 wavelength of wander. Tune the
        // product warpScale × warpAmount within about 0.2–1.5.
        warpScale: 1, // 0.2–3
        warpAmount: 0.7, // 0–1.5
        windScale: 4, // 1–12
        // Bend each swell harder, and add a finer wind octave, so the wave axis
        // differs from region to region rather than converging on fixed centres.
        windAmount: 0.9, // 0–1.5; bend = atan(windAmount)
        windDetail: 3, // 1.5–6; inert while windAmount is 0
        // Each spectrum component is a discrete wave source, gathered around its
        // own pole, and a transient swell system: it fades in, holds, fades out
        // and respawns far from where it died, so the sources come and go instead
        // of sitting still. `life` is in wave-clock seconds (the intensity slider
        // scales the clock); 0 pins every source in place.
        sourceFalloff: 2.4, // 0–3; 0 = each system covers the whole globe
        life: 1, // 1–120; 0 = stationary
        lifeFade: 0.3, // 0.1–0.4; share of each lifetime spent fading
        // How far the next source spawns from the old one. Must be odd; see the
        // interface docs for the measured distances. 9/15/17/23 = farthest
        // (~121°), 11/21 = mid, 3/5 = closest (~53°).
        respawnStride: 11, // odd, 1–31
      },
      // The "ripples" style: the original tiling ripple normal map, restored as
      // an alternative to the procedural sea. These are the numbers the ocean
      // shipped with, so switching to this style reproduces the old look.
      ripple: {
        // Glassier than the procedural sea, as the tiled map shipped: a small,
        // repeating ripple map wants a tighter glint.
        roughness: 0.12,
        normalMapId: 'waterNormal',
        // The baseline the "Wave intensity" slider is anchored to (25%). The
        // slider scales it at runtime; these are the numbers that make 25% — the
        // default — look exactly as the tiled ocean always did.
        normalScale: 0.45,
        normalRepeat: [9, 5],
        drift: [0.006, 0.002],
        // The detail layer is the same ripple map again, finer (2.3× the base
        // repeat) and scrolling a different way, so the surface evolves.
        detailRepeatScale: 2.3,
        detailNormalScale: 0.22,
        detailDrift: [-0.004, 0.0055],
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
