/**
 * How much of Earth a single day-map pixel is liquid water, 0…1.
 *
 * Deep ocean is the only strongly blue-dominant surface on the planet: ice is
 * white, deserts lean red and vegetation leans green. So the blue *lead* of a
 * pixel — `b − max(r, g)` — is a good water indicator. But the raw lead alone
 * mistakes the polar ice caps for ocean, because sea ice (and the haze over it)
 * is faintly blue: a lead of even a tenth of the threshold is enough to mark the
 * whole Arctic as water, which is what put ocean waves and the seafloor drop on
 * the ice.
 *
 * Liquid water, though, is not merely blue — it is *saturated*: its colour is far
 * from grey, whether deep navy or bright turquoise. Ice and snow are near-neutral
 * white, with only a few per cent of colour. Weighting the lead by saturation
 * separates them cleanly, so the ice caps read as land while every kind of sea —
 * deep, shallow, turquoise, sediment-laden — still reads as water.
 *
 * Kept free of imports so the test suite can load it directly under Node (see
 * `tests/waterMask.test.ts`).
 *
 * The arguments are 0…255 sRGB, exactly as read back from the day map.
 */
export function waterMaskFromColor(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lead = b - Math.max(r, g)
  if (lead <= 0 || max <= 0) return 0
  // Saturation, 0 (grey) … 1 (pure colour). Measured against the day map, ice
  // sits below ~0.09 and water above ~0.15, so the threshold band between them is
  // wide and the boundary lands in empty space. The band is smoothed so the mask
  // is a gradient rather than a step (the caller blurs it further).
  const ramp = Math.min(1, Math.max(0, ((max - min) / max - 0.1) / 0.08))
  return Math.min(1, lead / 30) * ramp * ramp * (3 - 2 * ramp)
}

/**
 * How glossy a surface with this water-mask value should be, 0…1.
 *
 * The roughness map wants a bias toward *land*. Gloss only rises near the top of
 * the mask's range, so a pixel has to be unmistakably water before it becomes
 * glassy. That keeps the transition on the water side of a shoreline: if the
 * ramp were spread across the whole 0…1 range, the blur around every lake would
 * leave a ring of middling-roughness land that catches the sun as a bright
 * outline — the "golden frame" artifact around coasts and lakes.
 *
 * Land (0) stays matte; open ocean (≈1) reaches fully glossy. Kept free of
 * imports so the test suite can load it directly under Node.
 */
export function waterGloss(mask: number): number {
  const t = Math.min(1, Math.max(0, (mask - 0.55) / 0.35))
  return t * t * (3 - 2 * t)
}

/** One texel of the generated roughness map, as stored in its four channels. */
export interface RoughnessChannels {
  /** The softened water mask, 0…255: the water layer and seafloor read this. */
  r: number
  /** The surface roughness, 0…255: the standard material reads this. */
  g: number
  /** A copy of the roughness, so the map stays neutral in blue. */
  b: number
  /** Always 255. */
  a: number
}

/**
 * The four channels of a roughness texel.
 *
 * The mask has to live in a colour channel, never in alpha. A 2D canvas stores
 * its pixels *premultiplied*, so an opaque green (land) with alpha 0 is saved as
 * black and read back as 0 — every dry texel would upload as perfectly smooth,
 * turning the whole planet into a mirror. The blur's partial alpha along a coast
 * would survive as a ring of matte green, which is the pale rectangle the "golden
 * frame" artifact drew around every lake. Opaque alpha keeps both channels
 * exactly as written.
 *
 * `mask` is the softened 0…1 water field; `gloss` is `waterGloss(raw)`.
 */
export function roughnessChannels(mask: number, gloss: number): RoughnessChannels {
  const roughness = Math.round(235 + (26 - 235) * Math.min(1, Math.max(0, gloss)))
  return {
    r: Math.round(Math.min(1, Math.max(0, mask)) * 255),
    g: roughness,
    b: roughness,
    a: 255,
  }
}
