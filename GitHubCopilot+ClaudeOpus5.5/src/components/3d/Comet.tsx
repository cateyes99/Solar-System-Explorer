import { useFrame } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { ConeGeometry, Quaternion, Sprite, Vector3, type Group, type Mesh } from 'three'
import { createCometTailMaterial, createGlowMaterial, createPlanetMaterial } from '../../graphics/materials'
import { layoutState, simClock } from '../../store/runtime'
import { useSimulationStore } from '../../store/simulationStore'
import { DEG, TAU, dateToDays, orbitPoint, solveKepler } from '../../utils/astronomy'
import { auToScene, sceneToAU } from '../../utils/scale'
import { UP, getSphere, hitMaterial, useTextures } from './shared'

const PERIOD_DAYS = 5.2 * 365.25
const PERIHELION_AU = 0.55
const APHELION_AU = 8.5
const INCLINATION = 24
const NODE = 65
const PERIAPSIS_ARG = 110
/** Next perihelion is a few months after the first visit, so the comet can be found early on. */
const PERIHELION_DAYS = dateToDays(new Date()) + 140

const position = new Vector3()
const ahead = new Vector3()
const away = new Vector3()
const motion = new Vector3()
const tailDir = new Vector3()
const quat = new Quaternion()

function cometPosition(days: number, out: Vector3): Vector3 {
  const layout = layoutState.current
  const q = auToScene(layout, PERIHELION_AU)
  const Q = auToScene(layout, APHELION_AU)
  const a = (q + Q) / 2
  const e = (Q - q) / (Q + q)
  const meanAnomaly = (((days - PERIHELION_DAYS) / PERIOD_DAYS) % 1) * TAU
  const E = solveKepler(((meanAnomaly % TAU) + TAU) % TAU, e)
  const r = a * (1 - e * Math.cos(E))
  const trueAnomaly = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2))
  return orbitPoint(NODE * DEG + PERIAPSIS_ARG * DEG + trueAnomaly, r, INCLINATION, NODE, out) as Vector3
}

/** A hidden comet on a long, stretched orbit. Its tails always point away from the Sun. */
export function Comet() {
  const textures = useTextures()
  const groupRef = useRef<Group>(null)
  const ionRef = useRef<Mesh>(null)
  const dustRef = useRef<Mesh>(null)
  const hitRef = useRef<Mesh>(null)

  const tailGeometry = useMemo(() => {
    const g = new ConeGeometry(1, 1, 24, 1, true)
    g.translate(0, -0.5, 0)
    g.rotateX(Math.PI)
    return g
  }, [])
  const ionMaterial = useMemo(() => createCometTailMaterial('#7cc8ff'), [])
  const dustMaterial = useMemo(() => createCometTailMaterial('#ffe3b0'), [])
  const nucleusMaterial = useMemo(() => createPlanetMaterial({ map: textures.moon, ambient: 0.1 }), [textures])
  const coma = useMemo(() => new Sprite(createGlowMaterial('#bfe6ff', 0.9)), [])

  useEffect(
    () => () => {
      tailGeometry.dispose()
      ionMaterial.dispose()
      dustMaterial.dispose()
      nucleusMaterial.dispose()
      coma.material.dispose()
    },
    [tailGeometry, ionMaterial, dustMaterial, nucleusMaterial, coma],
  )

  const onFound = useCallback(() => {
    const s = useSimulationStore.getState()
    if (s.appMode === 'tour') return true
    s.discover(
      'comet',
      'You found the hidden comet!',
      'Comets are icy “dirty snowballs”. Near the Sun some of the ice turns to gas, making glowing tails that point away from the Sun.',
    )
    return true
  }, [])

  useFrame(({ clock, camera }) => {
    const group = groupRef.current
    if (!group) return
    const days = simClock.days
    cometPosition(days, position)
    cometPosition(days + 0.5, ahead)
    group.position.copy(position)

    const distanceAU = Math.max(sceneToAU(layoutState.current, position.length()), 0.3)
    const activity = Math.min(1, 1.6 / (distanceAU * distanceAU))
    const length = Math.min(16, 3.2 / (distanceAU * distanceAU)) + 0.2

    away.copy(position).normalize()
    motion.subVectors(ahead, position).normalize()

    if (ionRef.current) {
      quat.setFromUnitVectors(UP, away)
      ionRef.current.quaternion.copy(quat)
      ionRef.current.scale.set(length * 0.05 + 0.08, length, length * 0.05 + 0.08)
    }
    if (dustRef.current) {
      tailDir.copy(away).addScaledVector(motion, -0.35).normalize()
      quat.setFromUnitVectors(UP, tailDir)
      dustRef.current.quaternion.copy(quat)
      dustRef.current.scale.set(length * 0.12 + 0.1, length * 0.75, length * 0.12 + 0.1)
    }
    ionMaterial.uniforms.uStrength.value = activity
    dustMaterial.uniforms.uStrength.value = activity * 0.8
    ionMaterial.uniforms.uTime.value = clock.elapsedTime
    dustMaterial.uniforms.uTime.value = clock.elapsedTime
    coma.scale.setScalar(0.35 + activity * 1.4)
    coma.material.opacity = 0.25 + activity * 0.7
    if (hitRef.current) {
      hitRef.current.scale.setScalar(Math.max(0.8, position.distanceTo(camera.position) * 0.02))
    }
  }, -1)

  return (
    <group ref={groupRef}>
      <mesh geometry={getSphere(12)} material={nucleusMaterial} scale={0.09} />
      <primitive object={coma} />
      <mesh ref={ionRef} geometry={tailGeometry} material={ionMaterial} />
      <mesh ref={dustRef} geometry={tailGeometry} material={dustMaterial} />
      <mesh
        ref={hitRef}
        geometry={getSphere(8)}
        material={hitMaterial}
        onClick={(e) => {
          e.stopPropagation()
          if (e.delta <= 6) onFound()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = ''
        }}
      />
    </group>
  )
}
