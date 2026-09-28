import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { MOON, getPlanet } from '../../data/planets'
import { useSimulationStore } from '../../store/simulationStore'
import { moonOrbitRadius, moonSceneRadius, planetSceneRadius } from '../../utils/scale'
import { orbitalAngle, orbitPosition } from '../../utils/astronomy'
import { getBody, registerBody } from '../../utils/bodyRegistry'
import { createCrateredTexture, hashSeed } from '../../utils/textures'
import { PlanetLabel } from './PlanetLabel'

const tempVec = new THREE.Vector3()

interface MoonBodyProps {
  registryId: string
  phaseOffset?: number
  radiusMultiplier?: number
  interactive?: boolean
}

/** A single moon that tracks Earth's live world position and orbits it locally. */
function MoonBody({ registryId, phaseOffset = 0, radiusMultiplier = 1, interactive = false }: MoonBodyProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const scaleMode = useSimulationStore((s) => s.scaleMode)
  const customScale = useSimulationStore((s) => s.customScale)
  const hoveredId = useSimulationStore((s) => s.hoveredId)
  const selectedId = useSimulationStore((s) => s.selectedId)
  const showLabels = useSimulationStore((s) => s.showLabels)
  const stoppedRotation = useSimulationStore((s) => s.whatIf.stoppedRotation)
  const select = useSimulationStore((s) => s.select)
  const hover = useSimulationStore((s) => s.hover)

  const texture = useMemo(() => createCrateredTexture('#c9c5bd', '#8f8a80', hashSeed(registryId)), [registryId])
  useEffect(() => () => texture.dispose(), [texture])

  useEffect(() => {
    if (!interactive) return
    registerBody(registryId, groupRef.current)
    return () => registerBody(registryId, null)
  }, [interactive, registryId])

  useFrame((_, delta) => {
    const earth = getBody('earth')
    if (!earth || !groupRef.current) return
    earth.getWorldPosition(tempVec)

    const simTimeDays = useSimulationStore.getState().simTimeDays
    const earthRadius = planetSceneRadius(getPlanet('earth'), scaleMode, customScale)
    const orbitRadius = moonOrbitRadius(earthRadius, scaleMode) * radiusMultiplier
    const angle = orbitalAngle(simTimeDays, MOON.orbitalPeriodDays, phaseOffset)
    const [x, y, z] = orbitPosition(orbitRadius, angle, 0.09)

    groupRef.current.position.set(tempVec.x + x, tempVec.y + y, tempVec.z + z)
    if (meshRef.current && !stoppedRotation) meshRef.current.rotation.y += delta * 0.12
  })

  const isHovered = interactive && hoveredId === registryId
  const isSelected = interactive && selectedId === registryId
  const moonRadius = moonSceneRadius(planetSceneRadius(getPlanet('earth'), scaleMode, customScale))

  const handlers = interactive
    ? {
        onPointerOver: (event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation()
          hover(registryId as 'moon')
          document.body.style.cursor = 'pointer'
        },
        onPointerOut: (event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation()
          hover(null)
          document.body.style.cursor = 'auto'
        },
        onClick: (event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation()
          select(registryId as 'moon')
        },
      }
    : {}

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} scale={isHovered || isSelected ? 1.1 : 1} {...handlers}>
        <sphereGeometry args={[moonRadius, 32, 32]} />
        <meshStandardMaterial map={texture} roughness={0.95} metalness={0} />
      </mesh>
      {interactive && (
        <PlanetLabel
          name="The Moon"
          targetRef={groupRef}
          visible={showLabels || isHovered}
          emphasize={isHovered || isSelected}
          offset={[0, moonRadius * 1.7, 0]}
        />
      )}
    </group>
  )
}

/** Earth's Moon, plus an optional second moon for the "What if?" scenario. */
export function Moon() {
  const twoMoons = useSimulationStore((s) => s.whatIf.twoMoons)
  return (
    <>
      <MoonBody registryId="moon" interactive />
      {twoMoons && <MoonBody registryId="moon-2" phaseOffset={Math.PI} radiusMultiplier={1.7} />}
    </>
  )
}
