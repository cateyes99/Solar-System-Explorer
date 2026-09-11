import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

/** Subtle cinematic post-processing: bloom for the Sun, gentle vignette. */
export function PostFX(): JSX.Element {
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur intensity={1.05} luminanceThreshold={0.72} luminanceSmoothing={0.25} radius={0.72} />
      <Vignette offset={0.22} darkness={0.55} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
