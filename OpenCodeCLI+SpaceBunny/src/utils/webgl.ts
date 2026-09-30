/** Detects WebGL support once so the app can show a friendly 2D fallback. */
export function detectWebGL(): { supported: boolean; renderer: 'webgl2' | 'webgl' | null } {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { supported: false, renderer: null }
  }
  try {
    const probe = document.createElement('canvas')
    const webgl2 = probe.getContext('webgl2')
    if (webgl2) {
      const lose = webgl2.getExtension('WEBGL_lose_context')
      lose?.loseContext()
      return { supported: true, renderer: 'webgl2' }
    }
    const webgl = probe.getContext('webgl') ?? probe.getContext('experimental-webgl')
    if (webgl) {
      const lose = (webgl as WebGLRenderingContext).getExtension('WEBGL_lose_context')
      lose?.loseContext()
      return { supported: true, renderer: 'webgl' }
    }
  } catch {
    /* fall through to unsupported */
  }
  return { supported: false, renderer: null }
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}