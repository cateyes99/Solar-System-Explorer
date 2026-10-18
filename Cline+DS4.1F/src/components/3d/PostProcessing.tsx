import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import type { QualityLevel } from '../../types'

/**
 * Post-processing: a subtle bloom that only touches genuinely bright things
 * (the Sun, star cores, Earth's city lights) and a gentle vignette to frame the
 * view. It is skipped entirely on low quality and in reduced-motion mode, where
 * a plain, crisp render is both faster and calmer.
 */
interface PostProcessingProps {
  quality: QualityLevel
  reducedMotion: boolean
}

export function PostProcessing({ quality, reducedMotion }: PostProcessingProps) {
  if (quality === 'low' || reducedMotion) return null

  return (
    <EffectComposer multisampling={quality === 'high' ? 4 : 0}>
      <Bloom
        intensity={quality === 'high' ? 0.9 : 0.62}
        luminanceThreshold={0.68}
        luminanceSmoothing={0.3}
        mipmapBlur
      />
      <Vignette offset={0.26} darkness={0.52} />
    </EffectComposer>
  )
}