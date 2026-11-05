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
