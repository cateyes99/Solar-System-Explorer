import { Bloom, EffectComposer, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useSimulationStore } from '../../store/simulationStore'

/** Bloom makes the Sun glow; skipped entirely on low quality. */
export function Effects() {
  const quality = useSimulationStore((s) => s.quality)
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)
  if (quality === 'low') return null
  // MSAA render targets render black on some GPUs/drivers, so anti-aliasing is done with SMAA instead.
  const bloom = (
    <Bloom mipmapBlur intensity={reducedMotion ? 0.6 : 0.95} luminanceThreshold={1.05} luminanceSmoothing={0.3} radius={0.72} />
  )
  if (quality === 'high') {
    return (
      <EffectComposer multisampling={0}>
        {bloom}
        <Vignette offset={0.3} darkness={0.55} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <SMAA />
      </EffectComposer>
    )
  }
  return (
    <EffectComposer multisampling={0}>
      {bloom}
      <Vignette offset={0.3} darkness={0.55} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
