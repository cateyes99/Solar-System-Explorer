import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing'
import { BlendFunction, KernelSize, ToneMappingMode } from 'postprocessing'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'

/**
 * Restrained post-processing: a tight bloom that only catches the Sun, the
 * brightest stars and the spacecraft's engine glow, plus a gentle vignette.
 *
 * A fixed small kernel is used rather than mipmap blur because mipmap bloom
 * spreads single bright pixels into soft bokeh discs, which turns a field of
 * stars into a field of blobs.
 *
 * The composer switches the renderer's tone mapping off, so ACES is restored
 * here as an effect — that is what keeps the Sun from clipping to flat white.
 */
export function Effects() {
  const bloom = useAppStore((s) => s.bloom)
  const quality = useAppStore((s) => s.quality)

  const children = useMemo<ReactNode[]>(() => {
    const nodes: ReactNode[] = []
    if (bloom && quality !== 'performance') {
      nodes.push(
        <Bloom
          key="bloom"
          intensity={quality === 'high' ? 0.85 : 0.7}
          luminanceThreshold={0.85}
          luminanceSmoothing={0.1}
          mipmapBlur={false}
          kernelSize={KernelSize.SMALL}
        />,
      )
    }
    nodes.push(<ToneMapping key="tone" mode={ToneMappingMode.ACES_FILMIC} />)
    nodes.push(
      <Vignette key="vignette" offset={0.28} darkness={0.68} blendFunction={BlendFunction.NORMAL} />,
    )
    return nodes
  }, [bloom, quality])

  if (quality === 'performance') return null

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {children}
    </EffectComposer>
  )
}