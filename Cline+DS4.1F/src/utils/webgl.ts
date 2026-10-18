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