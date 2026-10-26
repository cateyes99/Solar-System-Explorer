/**
 * WebGL capability probe.
 *
 * Three.js needs WebGL 2 for the standard renderer, so we check for it honestly
 * and show a hand-built 2D fallback (and an explanation) when it is missing.
 */
export interface WebGLCapability {
  supported: boolean
  /** Renderer string reported by the driver, when available. */
  renderer: string | null
}

export function detectWebGL(): WebGLCapability {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return { supported: false, renderer: null }
  }
  try {
    const canvas = document.createElement('canvas')
    const context =
      canvas.getContext('webgl2') ??
      (canvas.getContext('webgl') as WebGLRenderingContext | null)
    if (!context) return { supported: false, renderer: null }

    // WebGL 1 is not enough for the modern renderer, so treat it as unsupported
    // but still report what we found — the fallback screen explains the details.
    const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && context instanceof WebGL2RenderingContext
    const debugInfo = context.getExtension('WEBGL_debug_renderer_info')
    const renderer =
      debugInfo && typeof (debugInfo as { UNMASKED_RENDERER_WEBGL?: number }).UNMASKED_RENDERER_WEBGL === 'number'
        ? String(context.getParameter((debugInfo as { UNMASKED_RENDERER_WEBGL: number }).UNMASKED_RENDERER_WEBGL))
        : null
    context.getExtension('WEBGL_lose_context')?.loseContext()

    return { supported: isWebGL2, renderer }
  } catch {
    return { supported: false, renderer: null }
  }
}

/** Cached answer from the first probe, so a context is created at most once. */
let cachedMaxTextureSize: number | null = null

/**
 * The largest texture the GPU will accept on a side.
 *
 * A high-resolution map can exceed a driver's limit — older hardware caps at
 * 4096, and WebGL does not quietly downscale an oversized texture: it fails the
 * upload and leaves the material sampling an incomplete texture. The texture
 * loader asks once, caches the answer, and never uploads a map wider than this.
 * The conservative fallback is the 4096 every WebGL 2 implementation must
 * support.
 */
export function maxTextureSize(): number {
  if (cachedMaxTextureSize !== null) return cachedMaxTextureSize
  let size = 4096
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas')
      const context =
        canvas.getContext('webgl2') ?? (canvas.getContext('webgl') as WebGLRenderingContext | null)
      if (context) {
        const reported = context.getParameter(context.MAX_TEXTURE_SIZE)
        if (typeof reported === 'number' && reported >= 512) size = reported
        context.getExtension('WEBGL_lose_context')?.loseContext()
      }
    } catch {
      // Keep the conservative default.
    }
  }
  cachedMaxTextureSize = size
  return size
}
