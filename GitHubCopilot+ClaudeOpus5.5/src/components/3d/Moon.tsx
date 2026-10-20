import { useFrame } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineLoop, Vector3, type Group, type Mesh } from 'three'
import { BODIES } from '../../data/planets'
import { createPlanetMaterial } from '../../graphics/materials'
import { bodyObjects, layoutState, simClock, sunGoneState } from '../../store/runtime'
import { useSimulationStore } from '../../store/simulationStore'
import { DEG, TAU, meanLongitude, moonLongitude, moonOffset } from '../../utils/astronomy'
import { getSphere, hitMaterial, useTextures } from './shared'
import { useBodyInteraction } from './useBodyInteraction'

const MAX_ORBIT_RATE = 3.5
const worldPosition = new Vector3()
const SECOND_MOON_PERIOD_DAYS = 9.5

interface MoonProps {
  /** “second” is the hypothetical extra moon from the What-If simulation. */
  variant: 'moon' | 'second'
}

export function Moon({ variant }: MoonProps) {
  const textures = useTextures()
  const groupRef = useRef<Group>(null)
  const meshRef = useRef<Mesh>(null)
  const hitRef = useRef<Mesh>(null)
  const angle = useRef<number | null>(null)
  const appear = useRef(variant === 'second' ? 0 : 1)
  const isSecond = variant === 'second'

  const onSecondMoonClick = useCallback(() => {
    if (!isSecond) return false
    useSimulationStore.getState().addToast({
      title: 'A pretend moon',
      message: 'This second moon only exists in the What If? simulation.',
      tone: 'info',
    })
    return true
  }, [isSecond])
  const interaction = useBodyInteraction('moon', onSecondMoonClick)

  const material = useMemo(() => createPlanetMaterial({ map: textures.moon, ambient: 0.04 }), [textures])
  const orbitLine = useMemo(() => {
    const points: number[] = []
    for (let i = 0; i < 128; i++) {
      const a = (i / 128) * TAU
      points.push(Math.cos(a), 0, -Math.sin(a))
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(points, 3))
    const line = new LineLoop(
      geometry,
      new LineBasicMaterial({ color: isSecond ? '#fca5a5' : '#cbd5e1', transparent: true, opacity: 0.18, depthWrite: false }),
    )
    line.rotation.x = 5.14 * DEG
    return line
  }, [isSecond])

  useEffect(
    () => () => {
      material.dispose()
      orbitLine.geometry.dispose()
      ;(orbitLine.material as LineBasicMaterial).dispose()
    },
    [material, orbitLine],
  )

  useEffect(() => {
    if (isSecond) return
    const group = groupRef.current
    if (group) bodyObjects.set('moon', group)
    return () => {
      bodyObjects.delete('moon')
    }
  }, [isSecond])

  useFrame((state, delta) => {
    const group = groupRef.current
    const mesh = meshRef.current
    if (!group || !mesh) return
    const s = useSimulationStore.getState()
    const layout = layoutState.current
    const days = simClock.days
    const period = isSecond ? SECOND_MOON_PERIOD_DAYS : BODIES.moon.orbitalPeriodDays
    const orbitRadius = isSecond ? layout.moonOrbit * 1.6 : layout.moonOrbit
    const radius = isSecond ? layout.radius.moon * 0.65 : layout.radius.moon
    const realAngle = isSecond ? (TAU * days) / period + 1.7 : moonLongitude(meanLongitude(BODIES.earth, days), days)
    const rate = (s.daysPerSecond * TAU) / period
    if (angle.current === null || rate <= MAX_ORBIT_RATE) angle.current = realAngle
    else if (!s.paused) angle.current += Math.min(delta, 0.1) * MAX_ORBIT_RATE

    moonOffset(angle.current, orbitRadius, group.position)
    appear.current += (1 - appear.current) * Math.min(1, delta * 1.5)
    mesh.scale.setScalar(radius * appear.current)
    mesh.rotation.y = angle.current

    material.uniforms.uSunlight.value = sunGoneState.released.has('earth') ? 0.05 : 1

    const camDistance = state.camera.position.distanceTo(group.getWorldPosition(worldPosition))
    if (hitRef.current) hitRef.current.scale.setScalar(Math.max(radius * 1.4, camDistance * 0.015))

    orbitLine.scale.setScalar(orbitRadius)
    orbitLine.visible = s.showOrbits && camDistance < 70
  }, -1)

  return (
    <>
      <primitive object={orbitLine} />
      <group ref={groupRef}>
        <mesh ref={meshRef} geometry={getSphere(32)} material={material} />
        <mesh ref={hitRef} geometry={getSphere(10)} material={hitMaterial} {...interaction} />
      </group>
    </>
  )
}
