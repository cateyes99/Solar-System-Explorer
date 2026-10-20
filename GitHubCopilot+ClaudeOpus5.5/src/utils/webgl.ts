/** Checks for WebGL support. Add `?nowebgl` to the URL to preview the fallback. */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false
  if (new URLSearchParams(window.location.search).has('nowebgl')) return false
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}
