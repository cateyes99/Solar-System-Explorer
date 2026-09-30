import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, MeshBasicMaterial, PlaneGeometry, SphereGeometry } from 'three'
import { createGlowMaterial } from './materials'
import { getCoronaTexture, getSunTexture } from '../../utils/textures'
import { bodyPosition, setBodyRadius } from '../../store/registry'
import { useAppStore } from '../../store/useAppStore'
import { sunRadiusUnits } from '../../utils/scale'

const SPHERE_SEGMENTS = 64

/**
 * The Sun is a self-luminous body: the photosphere uses an unlit material so it
 * stays blazing, wrapped in a corona billboard and an outer bloom halo. A
 * click counter drives a flare easter egg.
 */
export function Sun({ sizeExponent }: { sizeExponent: number }) {
  const radius = sunRadiusUnits(sizeExponent)
  const flarePulse = useAppStore((s) => s.flarePulse)
  const reducedMotion = useAppStore((s) => s.reducedMotion)
  const clickSun = useAppStore((s) => s.clickSun)
  const select = useAppStore((s) => s.select)
  const setHovered = useAppStore((s) => s.setHovered)

  const surfaceRef = useRef<Mesh>(null)
  const coronaRef = useRef<Mesh>(null)
  const haloRef = useRef<Mesh>(null)
  const flareEnergy = useRef(0)
  const camera = useThree((s) => s.camera)

  const texture = useMemo(() => getSunTexture(), [])
  const coronaTexture = useMemo(() => getCoronaTexture(), [])

  const surfaceGeometry = useMemo(() => new SphereGeometry(1, SPHERE_SEGMENTS, SPHERE_SEGMENTS / 2), [])
  const surfaceMaterial = useMemo(
    () => new MeshBasicMaterial({ map: texture, color: '#ffffff', toneMapped: false }),
    [texture],
  )
  const planeGeometry = useMemo(() => new PlaneGeometry(1, 1), [])
  const coronaMaterial = useMemo(() => createGlowMaterial(coronaTexture, '#ffd08a'), [coronaTexture])
  const haloMaterial = useMemo(() => createGlowMaterial(coronaTexture, '#ff9c3c'), [coronaTexture])

  useEffect(() => {
    setBodyRadius('sun', radius)
    bodyPosition('sun').set(0, 0, 0)
  }, [radius])

  useEffect(
    () => () => {
      surfaceGeometry.dispose()
      surfaceMaterial.dispose()
      planeGeometry.dispose()
      coronaMaterial.dispose()
      haloMaterial.dispose()
    },
    [surfaceGeometry, surfaceMaterial, planeGeometry, coronaMaterial, haloMaterial],
  )

  // Trigger the flare animation whenever the click counter moves.
  useEffect(() => {
    if (flarePulse > 0) flareEnergy.current = 1
  }, [flarePulse])

  useFrame((state, delta) => {
    if (surfaceRef.current && !reducedMotion) {
      surfaceRef.current.rotation.y += delta * 0.035
    }

    flareEnergy.current = Math.max(0, flareEnergy.current - delta * 0.45)
    const boost = flareEnergy.current ** 2
    const drift = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.7) * 0.02

    if (coronaRef.current) {
      coronaRef.current.quaternion.copy(camera.quaternion)
      const s = radius * (3.4 + boost * 1.6 + drift)
      coronaRef.current.scale.set(s, s, s)
      coronaMaterial.uniforms.uIntensity.value = 1.15 + boost * 1.9
    }
    if (haloRef.current) {
      haloRef.current.quaternion.copy(camera.quaternion)
      const s = radius * (6.4 + boost * 3.6)
      haloRef.current.scale.set(s, s, s)
      haloMaterial.uniforms.uIntensity.value = 0.42 + boost * 0.9
    }
  })

  return (
    <group>
      <pointLight intensity={6.4} distance={0} decay={0} color="#fff3d6" />
      <mesh
        ref={surfaceRef}
        geometry={surfaceGeometry}
        material={surfaceMaterial}
        scale={radius}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered('sun', { x: event.clientX, y: event.clientY })
        }}
        onPointerOut={() => setHovered(null)}
        onClick={(event) => {
          event.stopPropagation()
          clickSun()
          select('sun')
        }}
      />
      <mesh ref={coronaRef} geometry={planeGeometry} material={coronaMaterial} renderOrder={-1} />
      <mesh ref={haloRef} geometry={planeGeometry} material={haloMaterial} renderOrder={-2} />
    </group>
  )
}

/** Emissive sphere without the corona, reused by the lesson scenes. */
export function SunCore({ radius, map }: { radius: number; map: ReturnType<typeof getSunTexture> }) {
  const geometry = useMemo(() => new SphereGeometry(radius, 48, 24), [radius])
  const material = useMemo(
    () => new MeshBasicMaterial({ map, toneMapped: false, color: '#fff0c0' }),
    [map],
  )
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )
  return <mesh geometry={geometry} material={material} />
}