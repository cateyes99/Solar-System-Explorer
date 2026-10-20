import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { Mesh } from 'three'
import { createWaveMaterial } from '../../graphics/materials'
import { layoutState, sunGoneState } from '../../store/runtime'
import { getSphere } from './shared'

/** Scene units per second – tuned so the wave reaches Earth in a few seconds. */
const WAVE_SPEED = 9

/** The expanding “news” that the Sun has gone, travelling at the speed of light. */
export function SunGoneWave() {
  const meshRef = useRef<Mesh>(null)
  const material = useMemo(() => createWaveMaterial(), [])
  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    if (!sunGoneState.active) {
      mesh.visible = false
      return
    }
    sunGoneState.waveRadius += Math.min(delta, 0.1) * WAVE_SPEED
    const edge = layoutState.current.outerEdge * 1.4
    mesh.visible = sunGoneState.waveRadius < edge
    mesh.scale.setScalar(Math.max(sunGoneState.waveRadius, 0.01))
    material.uniforms.uOpacity.value = 0.9 * (1 - sunGoneState.waveRadius / edge)
  }, -2)

  return <mesh ref={meshRef} geometry={getSphere(64)} material={material} visible={false} />
}
