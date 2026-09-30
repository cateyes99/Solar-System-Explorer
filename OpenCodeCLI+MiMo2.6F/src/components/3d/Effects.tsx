import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

interface EffectsProps {
  /** 'high' keeps full bloom, 'auto' a lighter version, 'low' disables effects */
  quality: 'auto' | 'high' | 'low'
  reducedMotion: boolean
}

/**
 * Post-processing kept intentionally small: a single mipmap bloom makes the
 * Sun, engine flame and city-lit rims feel luminous without hurting the
 * frame rate, plus a gentle vignette for cinematic framing.
 */
export function Effects({ quality, reducedMotion }: EffectsProps) {
  if (quality === 'low') return null

  const intensity = quality === 'high' ? 1.15 : 0.8
  const radius = quality === 'high' ? 0.85 : 0.7

  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom
        mipmapBlur
        intensity={reducedMotion ? intensity * 0.55 : intensity}
        luminanceThreshold={0.32}
        luminanceSmoothing={0.25}
        radius={radius}
      />
      <Vignette offset={0.22} darkness={0.72} eskil={false} />
    </EffectComposer>
  )
}
