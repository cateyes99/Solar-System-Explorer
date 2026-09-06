import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { flightKeys } from '../../hooks/useKeyboardControls'
import { useSimulation } from '../../store/simulationStore'
import { useSceneLayout } from '../../hooks/useSceneLayout'
import { getBodyObject, registerBody } from '../../utils/registry'
import { getBodyInfo } from '../../data/bodies'
import { getGlowTexture } from '../../utils/textures'
import type { BodyId } from '../../types'

const MAX_SPEED = 42
const THRUST = 15
const ARRIVE_FACTOR = 4.2

interface FlightState {
  pos: THREE.Vector3
  vel: THREE.Vector3
  quat: THREE.Quaternion
  autopilot: boolean
  destination: BodyId | null
  launched: boolean
}

/** Live HUD values for MissionControl — polled, so the 3D scene never re-renders. */
export const spacecraftHud = {
  speed: 0,
  distanceAU: 1,
  destination: null as BodyId | null,
  autopilot: false,
}

const spacecraftCommands = { destination: null as BodyId | null, autopilot: false }

/** Command the autopilot to fly to a body. */
export function flyTo(bodyId: BodyId): void {
  spacecraftCommands.destination = bodyId
  spacecraftCommands.autopilot = true
}

export function Spacecraft(): JSX.Element {
  const layout = useSceneLayout()
  const group = useRef<THREE.Group>(null)
  const engine = useRef<THREE.Sprite>(null)
  const unregister = useRef<() => void>(() => {})
  const flight = useRef<FlightState>({
    pos: new THREE.Vector3(layout.orbitRadius('earth') + 3.5, 2.5, 0),
    vel: new THREE.Vector3(),
    quat: new THREE.Quaternion(),
    autopilot: false,
    destination: null,
    launched: false,
  })

  const engineTex = useMemo(
    () => getGlowTexture('rgba(200,230,255,0.95)', 'rgba(90,160,255,0.4)', 'rgba(40,90,220,0)'),
    [],
  )
  const engineMat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: engineTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [engineTex],
  )

  useEffect(() => {
    if (group.current) unregister.current = registerBody('spacecraft', group.current)
    return () => unregister.current()
  }, [])

  // Re-park near Earth if the scale changes before the first flight.
  useEffect(() => {
    const s = flight.current
    if (!s.launched) {
      s.pos.set(layout.orbitRadius('earth') + 3.5, 2.5, 0)
      s.vel.set(0, 0, 0)
    }
  }, [layout])

  const v = {
    dir: useMemo(() => new THREE.Vector3(), []),
    dir2: useMemo(() => new THREE.Vector3(), []),
    target: useMemo(() => new THREE.Vector3(), []),
    quat: useMemo(() => new THREE.Quaternion(), []),
    euler: useMemo(() => new THREE.Euler(), []),
    matrix: useMemo(() => new THREE.Matrix4(), []),
    origin: useMemo(() => new THREE.Vector3(), []),
  }

  useFrame((_, dt) => {
    const s = flight.current
    const store = useSimulation.getState()
    const active = store.focus.mode === 'spacecraft'
    if (active) s.launched = true
    const clampedDt = Math.min(dt, 0.05)
    let thrusting = false

    if (spacecraftCommands.destination !== s.destination) s.destination = spacecraftCommands.destination
    s.autopilot = spacecraftCommands.autopilot && s.destination !== null

    if (active && s.autopilot && s.destination) {
      const obj = getBodyObject(s.destination)
      if (obj) {
        obj.getWorldPosition(v.target)
        v.dir.copy(v.target).sub(s.pos)
        const dist = v.dir.length()
        v.dir.normalize()
        const bodyR =
          s.destination === 'sun'
            ? layout.sunRadius
            : s.destination === 'moon'
              ? layout.moonRadius()
              : layout.planetRadius(s.destination)
        const stopDist = bodyR * ARRIVE_FACTOR + 1.2
        v.matrix.lookAt(v.origin, v.dir, THREE.Object3D.DEFAULT_UP)
        v.quat.setFromRotationMatrix(v.matrix)
        s.quat.slerp(v.quat, 1 - Math.exp(-2.6 * clampedDt))
        if (dist > stopDist) {
          v.dir2.set(0, 0, -1).applyQuaternion(s.quat)
          s.vel.addScaledVector(v.dir2, THRUST * clampedDt)
          thrusting = true
        } else {
          s.vel.multiplyScalar(Math.exp(-2.5 * clampedDt))
          if (s.vel.length() < 1.5) {
            s.autopilot = false
            spacecraftCommands.autopilot = false
            store.pushToast(`Arrived at ${getBodyInfo(s.destination).name}! Mission complete.`, '🛰️')
          }
        }
      }
    } else if (active) {
      const yaw = (flightKeys.yawLeft ? 1 : 0) - (flightKeys.yawRight ? 1 : 0)
      const pitch = (flightKeys.pitchDown ? 1 : 0) - (flightKeys.pitchUp ? 1 : 0)
      const roll = (flightKeys.rollLeft ? 1 : 0) - (flightKeys.rollRight ? 1 : 0)
      if (yaw !== 0 || pitch !== 0 || roll !== 0) {
        v.euler.set(pitch * 1.7 * clampedDt, yaw * 1.7 * clampedDt, roll * 2.2 * clampedDt, 'XYZ')
        v.quat.setFromEuler(v.euler)
        s.quat.multiply(v.quat).normalize()
      }
      const forward = v.dir.set(0, 0, -1).applyQuaternion(s.quat)
      const boost = flightKeys.boost ? 2.2 : 1
      if (flightKeys.forward) {
        s.vel.addScaledVector(forward, THRUST * boost * clampedDt)
        thrusting = true
        if (s.autopilot) {
          s.autopilot = false
          spacecraftCommands.autopilot = false
        }
      }
      if (flightKeys.back) s.vel.addScaledVector(forward, -THRUST * 0.7 * clampedDt)
      s.vel.multiplyScalar(Math.exp(-0.22 * clampedDt))
    }

    const speed = s.vel.length()
    if (speed > MAX_SPEED) s.vel.setLength(MAX_SPEED)
    s.pos.addScaledVector(s.vel, clampedDt)

    const g = group.current
    if (g) {
      g.position.copy(s.pos)
      g.quaternion.copy(s.quat)
    }
    if (engine.current) {
      const flicker = store.reduceMotion ? 1 : 0.8 + Math.random() * 0.4
      const sc = thrusting ? 0.7 * flicker : 0.35
      engine.current.scale.set(sc, sc, 1)
      engineMat.opacity += ((thrusting ? 0.95 : 0.25) - engineMat.opacity) * Math.min(1, clampedDt * 8)
    }

    spacecraftHud.speed = speed
    spacecraftHud.distanceAU = s.pos.length() / layout.orbitRadius('earth')
    spacecraftHud.destination = s.autopilot ? s.destination : null
    spacecraftHud.autopilot = s.autopilot
  })

  return (
    <group ref={group}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.16, 0.5, 4, 10]} />
        <meshStandardMaterial color="#d7dee8" metalness={0.65} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, -0.48]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.16, 0.32, 12]} />
        <meshStandardMaterial color="#4da6ff" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.13, -0.18]}>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshStandardMaterial
          color="#67e8f9"
          emissive="#67e8f9"
          emissiveIntensity={0.7}
          roughness={0.2}
        />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0, 0.32]} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
          <boxGeometry args={[0.42, 0.04, 0.22]} />
          <meshStandardMaterial color="#8fa3bf" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      <sprite ref={engine} material={engineMat} position={[0, 0, 0.5]} scale={0.5} />
      <pointLight intensity={0.5} distance={6} color="#9fd0ff" />
    </group>
  )
}
