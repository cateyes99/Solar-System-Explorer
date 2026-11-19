import { useEffect, useMemo, useRef, useState } from 'react'
import { Html } from './HtmlLabel'
import { useFrame, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Group, MathUtils, Mesh, Vector3 } from 'three'
import type { PlanetData } from '../../types'
import { createCloudTexture, createPlanetTexture, createRingTexture } from '../../graphics/proceduralTextures'
import { PLANET_MAP } from '../../data/planets'
import { useSimulationStore } from '../../store/simulationStore'
import { registerBody } from '../../utils/bodyRegistry'
import { getOrbitalPosition } from '../../utils/astronomy'
import { simulationClock } from '../../utils/simulationClock'
import { getBodyRadius, getOrbitRadius } from '../../utils/scale'
import { Atmosphere } from './Atmosphere'
import { Moons } from './Moon'

const scratchPosition = new Vector3()
const rockyWorlds = new Set(['mercury', 'earth', 'mars'])

interface PlanetProps {
  body: PlanetData
}

export function Planet({ body }: PlanetProps) {
  const orbitGroup = useRef<Group>(null)
  const visualGroup = useRef<Group>(null)
  const surface = useRef<Mesh>(null)
  const clouds = useRef<Mesh>(null)
  const label = useRef<HTMLDivElement>(null)
  const currentOrbit = useRef(getOrbitRadius(body, 'educational'))
  const lastRotationDays = useRef(simulationClock.days)
  const [hovered, setHovered] = useState(false)
  const { camera } = useThree()
  const texture = useMemo(() => createPlanetTexture(body.id), [body.id])
  const cloudTexture = useMemo(() => body.id === 'earth' ? createCloudTexture() : null, [body.id])
  const ringTexture = useMemo(() => body.id === 'saturn' ? createRingTexture() : null, [body.id])
  const selected = useSimulationStore((state) => state.selectedBody === body.id)
  const showLabels = useSimulationStore((state) => state.showLabels)
  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const customSize = useSimulationStore((state) => state.customSize)
  const customDistance = useSimulationStore((state) => state.customDistance)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const whatIf = useSimulationStore((state) => state.whatIf)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const showToast = useSimulationStore((state) => state.showToast)

  const normalRadius = getBodyRadius(body, scaleMode, customSize)
  const radius = body.id === 'earth' && whatIf === 'giant-earth'
    ? getBodyRadius(PLANET_MAP.jupiter, scaleMode, customSize)
    : normalRadius
  const orbitRadius = getOrbitRadius(body, scaleMode, customDistance)
  const atmosphere = body.id === 'earth'
    ? { color: '#4ab9ff', scale: 1.085, intensity: 0.48 }
    : body.id === 'venus'
      ? { color: '#ffd486', scale: 1.09, intensity: 0.4 }
      : ['jupiter', 'saturn', 'uranus', 'neptune'].includes(body.id)
        ? { color: body.accentColor, scale: 1.055, intensity: 0.2 }
        : null

  useEffect(() => {
    if (orbitGroup.current) return registerBody(body.id, orbitGroup.current)
  }, [body.id])
  useEffect(() => () => {
    texture.dispose()
    cloudTexture?.dispose()
    ringTexture?.dispose()
  }, [texture, cloudTexture, ringTexture])

  useFrame((_, delta) => {
    if (!orbitGroup.current || !visualGroup.current) return
    currentOrbit.current = MathUtils.damp(currentOrbit.current, orbitRadius, 3, delta)
    orbitGroup.current.position.copy(getOrbitalPosition(body, currentOrbit.current, scratchPosition))
    const emphasis = hovered ? 1.09 : 1
    const size = MathUtils.damp(visualGroup.current.scale.x, radius * emphasis, 5, delta)
    visualGroup.current.scale.setScalar(size)
    const elapsedDays = simulationClock.days - lastRotationDays.current
    lastRotationDays.current = simulationClock.days
    if (surface.current && !(body.id === 'earth' && whatIf === 'no-rotation')) {
      const rotation = elapsedDays * (24 / body.rotationPeriodHours) * Math.PI * 2
      surface.current.rotation.y += rotation * (reducedMotion ? 0.12 : 1)
    }
    if (clouds.current && !reducedMotion) clouds.current.rotation.y += elapsedDays * Math.PI * 2 * 1.04
    if (label.current && orbitGroup.current) {
      orbitGroup.current.getWorldPosition(scratchPosition)
      const distance = scratchPosition.distanceTo(camera.position)
      label.current.style.opacity = `${MathUtils.clamp(1.18 - distance / 210, 0.25, 0.92)}`
    }
  })

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    selectBody(body.id)
    if (body.id === 'earth') showToast('Hello, Earth! You are here. 🌍', 'earth')
  }

  return (
    <group ref={orbitGroup}>
      <group ref={visualGroup} scale={radius}>
        <group rotation={[0, 0, MathUtils.degToRad(body.axialTiltDeg)]}>
          <mesh
            ref={surface}
            onClick={handleClick}
            onDoubleClick={(event) => { event.stopPropagation(); selectBody(body.id, true) }}
            onPointerOver={(event) => { event.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
          >
            <sphereGeometry args={[1, body.id === 'jupiter' || body.id === 'saturn' ? 64 : 48, 32]} />
            <meshStandardMaterial
              map={texture}
              bumpMap={rockyWorlds.has(body.id) ? texture : undefined}
              bumpScale={body.id === 'earth' ? 0.018 : 0.035}
              roughness={body.id === 'earth' ? 0.7 : 0.91}
              metalness={0}
              emissive={body.color}
              emissiveIntensity={hovered ? 0.12 : 0.015}
            />
          </mesh>
          {cloudTexture && (
            <mesh ref={clouds} scale={1.022} raycast={() => null}>
              <sphereGeometry args={[1, 48, 32]} />
              <meshStandardMaterial map={cloudTexture} transparent opacity={0.62} depthWrite={false} roughness={1} />
            </mesh>
          )}
          {atmosphere && <Atmosphere {...atmosphere} />}
          {ringTexture && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
              <ringGeometry args={[1.25, 2.2, 160]} />
              <meshStandardMaterial map={ringTexture} transparent opacity={0.95} side={2} depthWrite={false} roughness={0.85} />
            </mesh>
          )}
          {body.id === 'uranus' && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
              <ringGeometry args={[1.48, 1.53, 96]} />
              <meshBasicMaterial color="#b6e5e4" transparent opacity={0.24} side={2} depthWrite={false} />
            </mesh>
          )}
        </group>
        {selected && (
          <mesh rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
            <ringGeometry args={[body.id === 'saturn' ? 2.35 : 1.35, body.id === 'saturn' ? 2.38 : 1.38, 96]} />
            <meshBasicMaterial color={body.accentColor} transparent opacity={0.75} depthWrite={false} />
          </mesh>
        )}
      </group>

      {body.id === 'earth' && <Moons giantEarth={whatIf === 'giant-earth'} twoMoons={whatIf === 'two-moons'} />}

      {(hovered || showLabels) && (
        <Html center position={[0, Math.max(radius * 1.55, 1.25), 0]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          {hovered ? (
            <div className="planet-tooltip">
              <strong>{body.name}</strong>
              <span>{body.type} · Click to discover</span>
            </div>
          ) : (
            <div ref={label} className="planet-label" style={{ '--planet-color': body.accentColor } as React.CSSProperties}>
              <i />{body.name.toUpperCase()}
            </div>
          )}
        </Html>
      )}
    </group>
  )
}
