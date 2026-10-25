import type { QualityLevel } from '../types'

/**
 * How much of a source map's resolution is uploaded, per quality tier.
 *
 * A 2048×1024 map costs 8 MB of video memory per body before mipmaps, and the
 * Solar System has eleven of them. A slower machine is served the same picture at
 * a lower texel density rather than a different map, and the browser's own
 * high-quality downscaler does the work once, at load time.
 */
export const QUALITY_SCALE: Record<QualityLevel, number> = { high: 1, medium: 0.5, low: 0.25 }

/**
 * The width a map is uploaded at: the tier's fraction of the source, reduced by
 * any per-map ceiling and never larger than the GPU will accept.
 *
 * Earth's day map is the reason this is a calculation rather than a constant. It
 * ships at 8192×4096, so the three tiers land on 8192, 4096 and 2048 columns:
 * the full 8K only when the viewer has deliberately chosen High, 4K at the
 * default Medium, and the old 2K density at Low. Every other map keeps the
 * density the set was designed around, and `gpuLimit` keeps an 8K source off a
 * driver that only accepts 4K (WebGL does not downscale an oversized texture —
 * it fails the upload).
 */
export function textureUploadWidth(
  naturalWidth: number,
  quality: QualityLevel,
  ceiling: number | undefined,
  gpuLimit: number,
): number {
  if (!(naturalWidth > 0)) return 2
  const tierScale = QUALITY_SCALE[quality]
  const scale = ceiling ? Math.min(tierScale, ceiling / naturalWidth) : tierScale
  const width = Math.round(naturalWidth * scale)
  return Math.max(2, Math.min(width, gpuLimit))
}

/**
 * The resolution Earth's day map is *analysed* at — the water and land masks
 * behind the ocean roughness and the procedural fallbacks — independent of the
 * resolution it is uploaded at.
 *
 * The analysis reads every pixel back into JavaScript and blurs the result
 * twice. At the 8192×4096 the high tier uploads that would be a quarter of a
 * gigabyte of scratch memory per pass, which no browser enjoys; the masks are
 * broad fields that do not need that density, so the day map is drawn once more
 * at this size for the analysis alone. The upload itself is untouched, and the
 * roughness map stays small at every tier.
 */
export const EARTH_ANALYSIS_WIDTH: Record<QualityLevel, number> = {
  low: 512,
  medium: 2048,
  high: 2048,
}
