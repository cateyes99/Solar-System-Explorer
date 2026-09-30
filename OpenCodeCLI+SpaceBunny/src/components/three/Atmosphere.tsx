import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { SphereGeometry, Vector3 } from 'three'
import type { MutableRefObject } from 'react'
import { createAtmosphereMaterial } from './materials'

/**
 * A back-facing Fresnel shell just outside a planet. The shell is shaded
 * against the real sun direction so the rim glow fades out on the night side —
 * that is what sells Earth's "thin blue line of air".
 */
export function Atmosphere({
  planetRadius,
  thickness = 1.035,
  color,
  strength,
  worldPosition,
  power = 3,
  boostRef,
}: {
  planetRadius: number
  thickness?: number
  color: string
  strength: number
  /** Live world-space position of the planet, used for the day/night terminator. */
  worldPosition: Vector3
  power?: number
  /** 0..1 extra brightness, driven imperatively by hover state. */
  boostRef?: MutableRefObject<number>
}) {
  const geometry = useMemo(() => new SphereGeometry(1, 48, 32), [])
  const material = useMemo(() => createAtmosphereMaterial(color, strength, power), [color, strength, power])
  const sunDir = useMemo(() => new Vector3(), [])
  const viewDir = useMemo(() => new Vector3(), [])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame(({ camera }) => {
    // Direction from the planet towards the Sun, expressed in view space.
    sunDir.copy(worldPosition).negate().normalize()
    viewDir.copy(sunDir).transformDirection(camera.matrixWorldInverse)
    material.uniforms.uSunDirView.value.copy(viewDir)
    const boost = boostRef ? boostRef.current : 0
    material.uniforms.uStrength.value = strength * (1 + boost * 0.75)
  })

  return <mesh geometry={geometry} material={material} scale={planetRadius * thickness} renderOrder={2} />
}