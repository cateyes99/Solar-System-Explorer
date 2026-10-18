import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import type { Group, Mesh, Sprite, SpriteMaterial } from 'three'
import { getBodyWorldPosition, registerBody, unregisterBody } from '../../utils/bodyRegistry'
import { spacecraft } from '../../utils/spacecraftSim'
import { keyboard } from '../../utils/input'
import { getTexture } from '../../utils/textures'
import { audio } from '../../utils/audio'
import { useSimulationStore } from '../../store/simulationStore'

/**
 * Mission Control's spacecraft.
 *
 * Arcade-simple to fly: W/S/A/D move relative to the camera, R/F climb and dive,
 * Shift boosts. The autopilot takes over and cruises to the chosen destination,
 * which is how most children will use it — but nothing stops them grabbing the
 * controls and flying the ship themselves.
 */

const FORWARD_KEYS = ['KeyW', 'ArrowUp']
const BACK_KEYS = ['KeyS', 'ArrowDown']
const LEFT_KEYS = ['KeyA', 'ArrowLeft']
const RIGHT_KEYS = ['KeyD', 'ArrowRight']
const UP_KEYS = ['KeyR', 'Space']
const DOWN_KEYS = ['KeyF', 'ShiftRight']
const BOOST_KEYS = ['ShiftLeft']

const CYLINDER = new CylinderGeometry(1, 1, 1, 14)
const NOSE = new ConeGeometry(1, 1, 14)
const SPHERE = new SphereGeometry(1, 14, 10)
const PLATE = new BoxGeometry(1, 1, 1)

const steer = new Vector3()
const forward = new Vector3()
const right = new Vector3()
const up = new Vector3(0, 1, 0)
const destination = new Vector3()

export function Spacecraft() {
  const groupRef = useRef<Group>(null)
  const engineRef = useRef<Mesh>(null)
  const plumeRef = useRef<Sprite>(null)
  const plumeMaterialRef = useRef<SpriteMaterial>(null)

  const missionActive = useSimulationStore((state) => state.missionActive)
  const autopilot = useSimulationStore((state) => state.autopilot)
  const destinationId = useSimulationStore((state) => state.destinationId)

  const hullMaterial = useMemo(
    () => new MeshStandardMaterial({ color: '#dfe8f5', roughness: 0.42, metalness: 0.6 }),
    [],
  )
  const panelMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#2f7bff',
        roughness: 0.3,
        metalness: 0.7,
        emissive: '#123a7a',
        emissiveIntensity: 0.5,
      }),
    [],
  )
  const engineMaterial = useMemo(
    () => new MeshStandardMaterial({ color: '#4fd8ff', emissive: '#4fd8ff', emissiveIntensity: 1.6, roughness: 0.4 }),
    [],
  )

  useEffect(
    () => () => {
      hullMaterial.dispose()
      panelMaterial.dispose()
      engineMaterial.dispose()
    },
    [hullMaterial, panelMaterial, engineMaterial],
  )

  useEffect(() => {
    const object = groupRef.current
    if (!object) return
    registerBody('spacecraft', object)
    return () => unregisterBody('spacecraft', object)
  }, [])

  // Launch: park the ship beside the chosen destination and hand control to the
  // autopilot for a stress-free first flight.
  useEffect(() => {
    if (!missionActive) {
      spacecraft.reset()
      return
    }
    const origin = destinationId ? getBodyWorldPosition(destinationId) : undefined
    spacecraft.placeNear(origin ?? new Vector3(0, 0, 0), origin ? 7 : 26)
    spacecraft.destinationId = destinationId
    spacecraft.autopilot = true
    audio.play('whoosh')
  }, [missionActive, destinationId])

  useEffect(() => {
    spacecraft.autopilot = autopilot
  }, [autopilot])

  useEffect(() => {
    spacecraft.destinationId = destinationId
  }, [destinationId])

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return

    // --- Steering input ---------------------------------------------------
    let x = 0
    let y = 0
    let z = 0
    if (missionActive && !spacecraft.autopilot) {
      if (keyboard.anyDown(FORWARD_KEYS)) z += 1
      if (keyboard.anyDown(BACK_KEYS)) z -= 1
      if (keyboard.anyDown(RIGHT_KEYS)) x += 1
      if (keyboard.anyDown(LEFT_KEYS)) x -= 1
      if (keyboard.anyDown(UP_KEYS)) y += 1
      if (keyboard.anyDown(DOWN_KEYS)) y -= 1
    }

    steer.set(0, 0, 0)
    if (x !== 0 || y !== 0 || z !== 0) {
      state.camera.getWorldDirection(forward)
      right.crossVectors(forward, up).normalize()
      steer.addScaledVector(forward, z).addScaledVector(right, x).addScaledVector(up, y).normalize()
    }

    // --- Autopilot target -------------------------------------------------
    let target: Vector3 | null = null
    if (spacecraft.autopilot && destinationId) {
      target = getBodyWorldPosition(destinationId, destination) ?? null
    }

    spacecraft.update(delta, steer, target, keyboard.anyDown(BOOST_KEYS))

    // --- Apply the flight model to the model ------------------------------
    group.position.copy(spacecraft.position)
    if (spacecraft.speed > 0.05) {
      forward.copy(spacecraft.position).add(spacecraft.velocity)
      group.lookAt(forward)
    }

    const throttle = Math.min(1, spacecraft.speed / spacecraft.maxSpeed)
    engineRef.current?.scale.setScalar(0.9 + throttle * 0.5)
    if (plumeRef.current) {
      const size = 1.4 + throttle * 4.2 + (spacecraft.autopilot ? 1.4 : 0)
      plumeRef.current.scale.set(size, size, 1)
    }
    if (plumeMaterialRef.current) {
      plumeMaterialRef.current.opacity = 0.15 + throttle * 0.6
    }
  })

  return (
    <group ref={groupRef} visible={missionActive}>
      {/* Fuselage */}
      <mesh material={hullMaterial} geometry={CYLINDER} rotation={[Math.PI / 2, 0, 0]} scale={[0.3, 0.9, 0.3]} />
      {/* Nose cone */}
      <mesh material={hullMaterial} geometry={NOSE} position={[0, 0, 0.95]} rotation={[Math.PI / 2, 0, 0]} scale={0.3} />
      {/* Cockpit */}
      <mesh material={panelMaterial} geometry={SPHERE} position={[0, 0.18, 0.5]} scale={0.18} />
      {/* Solar panels */}
      <mesh material={panelMaterial} geometry={PLATE} position={[0.85, 0, -0.1]} scale={[1.1, 0.05, 0.42]} />
      <mesh material={panelMaterial} geometry={PLATE} position={[-0.85, 0, -0.1]} scale={[1.1, 0.05, 0.42]} />
      {/* Engine glow */}
      <mesh ref={engineRef} material={engineMaterial} geometry={SPHERE} position={[0, 0, -0.95]} scale={0.22} />
      <sprite ref={plumeRef} position={[0, 0, -1.6]} scale={[1.4, 1.4, 1]}>
        <spriteMaterial
          ref={plumeMaterialRef}
          map={getTexture('glow')}
          color="#7ce6ff"
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
          opacity={0.2}
          toneMapped={false}
        />
      </sprite>
    </group>
  )
}