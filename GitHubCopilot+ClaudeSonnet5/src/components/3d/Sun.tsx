import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { SUN } from '../../data/planets'
import { useSimulationStore } from '../../store/simulationStore'
import { sunSceneRadius } from '../../utils/scale'
import { createGlowSpriteTexture, createSunTexture } from '../../utils/textures'
import { playFlare } from '../../utils/audio'
import { PlanetLabel } from './PlanetLabel'

const CORONA_LAYERS = [
  { scale: 1.35, opacity: 0.55, color: '#ffb347' },
  { scale: 1.75, opacity: 0.3, color: '#ff9d4d' },
  { scale: 2.3, opacity: 0.16, color: '#ffd88a' },
]

/** The Sun: a self-lit procedural surface, layered corona glow, and the scene's key light. */
export function Sun() {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  const scaleMode = useSimulationStore((s) => s.scaleMode)
  const customScale = useSimulationStore((s) => s.customScale)
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)
  const soundEnabled = useSimulationStore((s) => s.soundEnabled)
  const noSun = useSimulationStore((s) => s.whatIf.noSun)
  const showLabels = useSimulationStore((s) => s.showLabels)
  const hoveredId = useSimulationStore((s) => s.hoveredId)
  const selectedId = useSimulationStore((s) => s.selectedId)
  const select = useSimulationStore((s) => s.select)
  const hover = useSimulationStore((s) => s.hover)
  const registerSunClick = useSimulationStore((s) => s.registerSunClick)
  const sunClickCount = useSimulationStore((s) => s.sunClickCount)

  const radius = sunSceneRadius(scaleMode, customScale)
  const texture = useMemo(() => createSunTexture(7), [])
  const coronaTextures = useMemo(() => CORONA_LAYERS.map((layer) => createGlowSpriteTexture(layer.color)), [])

  useEffect(() => {
    return () => {
      texture.dispose()
      coronaTextures.forEach((tex) => tex.dispose())
    }
  }, [texture, coronaTextures])

  const [flareStrength, setFlareStrength] = useState(0)
  const prevClickCount = useRef(sunClickCount)
  const flareTarget = useRef(0)

  useEffect(() => {
    if (sunClickCount > prevClickCount.current) {
      const isBigFlare = sunClickCount > 0 && sunClickCount % 5 === 0
      flareTarget.current = isBigFlare ? 1.8 : 1
      if (soundEnabled) playFlare()
    }
    prevClickCount.current = sunClickCount
  }, [sunClickCount, soundEnabled])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (meshRef.current && !reducedMotion) {
      meshRef.current.rotation.y += delta * 0.02
      const pulse = 1 + Math.sin(t * 0.6) * 0.01
      meshRef.current.scale.setScalar(pulse)
    }

    flareTarget.current = Math.max(0, flareTarget.current - delta * 0.6)
    setFlareStrength((prev) => (Math.abs(prev - flareTarget.current) > 0.01 ? flareTarget.current : prev))

    if (lightRef.current) {
      const base = noSun ? 0 : 210
      lightRef.current.intensity = base + flareTarget.current * 140
    }
  })

  const isHovered = hoveredId === 'sun'
  const isSelected = selectedId === 'sun'

  return (
    <group ref={groupRef}>
      <pointLight ref={lightRef} color="#fff4e0" intensity={noSun ? 0 : 210} decay={1} distance={0} />
      <ambientLight intensity={noSun ? 0.03 : 0.16} color={noSun ? '#3a4a6b' : '#8899cc'} />

      <mesh
        ref={meshRef}
        visible={!noSun}
        onPointerOver={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation()
          hover('sun')
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation()
          hover(null)
          document.body.style.cursor = 'auto'
        }}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation()
          select('sun')
          registerSunClick()
        }}
      >
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>

      {!noSun &&
        CORONA_LAYERS.map((layer, i) => (
          <sprite key={layer.color} scale={radius * layer.scale * (2 + flareStrength * 0.6)}>
            <spriteMaterial
              map={coronaTextures[i]}
              transparent
              opacity={layer.opacity + flareStrength * 0.25}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        ))}

      <PlanetLabel
        name={SUN.name}
        targetRef={groupRef}
        visible={showLabels || isHovered}
        emphasize={isHovered || isSelected}
        offset={[0, radius * 1.6 + 0.5, 0]}
      />
    </group>
  )
}
