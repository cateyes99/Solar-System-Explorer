import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Matrix4, MeshStandardMaterial, Quaternion, Sprite, Vector3, type Group } from 'three'
import { AU_KM, BODIES, isPlanetId } from '../../data/planets'
import { DESTINATIONS } from '../../data/missions'
import { createGlowMaterial } from '../../graphics/materials'
import { flightInput, layoutState } from '../../store/runtime'
import { useSimulationStore } from '../../store/simulationStore'
import { orbitPoint } from '../../utils/astronomy'
import { sceneToAU } from '../../utils/scale'
import { getBodyRadius, getBodyWorldPosition, getSphere } from './shared'

/** Pose shared with the camera so it can chase the ship. */
export const shipPose = {
  position: new Vector3(),
  quaternion: new Quaternion(),
  speed: 0,
  thrust: 0,
  initialized: false,
}

const ACCELERATION = 9
const MAX_SPEED = 30
const BOOST_MULTIPLIER = 2.6
const AUTOPILOT_SPEED = 55
const TELEMETRY_INTERVAL = 0.2

const forward = new Vector3()
const target = new Vector3()
const toTarget = new Vector3()
const bodyPos = new Vector3()
const lookMatrix = new Matrix4()
const desiredQuat = new Quaternion()
const turnQuat = new Quaternion()
const axisY = new Vector3(0, 1, 0)
const axisX = new Vector3(1, 0, 0)
const point = new Vector3()

function standOffDistance(id: (typeof DESTINATIONS)[number]): number {
  const r = getBodyRadius(id)
  if (id === 'sun') return r * 2.6
  if (id === 'saturn') return r * 3.4
  return r * 2.8 + 0.6
}

export function Spacecraft() {
  const groupRef = useRef<Group>(null)
  const orbitAngle = useRef<number | null>(null)
  const telemetryTimer = useRef(0)

  const materials = useMemo(
    () => ({
      hull: new MeshStandardMaterial({ color: '#e8ecf3', metalness: 0.55, roughness: 0.35 }),
      accent: new MeshStandardMaterial({ color: '#ff8a3d', metalness: 0.3, roughness: 0.5 }),
      glass: new MeshStandardMaterial({ color: '#4de1ff', emissive: '#1fb6ff', emissiveIntensity: 1.2, roughness: 0.1 }),
    }),
    [],
  )
  const flame = useMemo(() => new Sprite(createGlowMaterial('#7fdcff', 1)), [])
  const flameCore = useMemo(() => new Sprite(createGlowMaterial('#ffd29a', 1)), [])

  useEffect(
    () => () => {
      Object.values(materials).forEach((m) => m.dispose())
      flame.material.dispose()
      flameCore.material.dispose()
    },
    [materials, flame, flameCore],
  )

  useEffect(() => {
    // Start each mission parked beside Earth, pointing towards the chosen destination.
    getBodyWorldPosition('earth', bodyPos)
    const r = getBodyRadius('earth')
    shipPose.position.copy(bodyPos).add(new Vector3(r * 3, r * 0.8, r * 3))
    getBodyWorldPosition(useSimulationStore.getState().destinationId, target)
    lookMatrix.lookAt(shipPose.position, target, axisY)
    shipPose.quaternion.setFromRotationMatrix(lookMatrix)
    shipPose.speed = 0
    shipPose.initialized = true
    return () => {
      shipPose.initialized = false
      for (const key of Object.keys(flightInput) as (keyof typeof flightInput)[]) flightInput[key] = false
    }
  }, [])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    const dt = Math.min(delta, 0.05)
    const s = useSimulationStore.getState()
    const input = flightInput
    const manual = input.forward || input.back || input.left || input.right || input.up || input.down
    if (manual && s.autopilot !== 'off') s.setAutopilot('off')
    const autopilot = manual ? 'off' : s.autopilot
    const destination = s.destinationId

    forward.set(0, 0, -1).applyQuaternion(shipPose.quaternion)
    let thrust = 0

    if (autopilot === 'fly') {
      getBodyWorldPosition(destination, bodyPos)
      const standOff = standOffDistance(destination)
      toTarget.subVectors(shipPose.position, bodyPos)
      if (toTarget.lengthSq() < 1e-6) toTarget.set(1, 0.3, 1)
      target.copy(bodyPos).addScaledVector(toTarget.normalize(), standOff)
      toTarget.subVectors(target, shipPose.position)
      const distance = toTarget.length()
      const desiredSpeed = Math.min(AUTOPILOT_SPEED, distance * 1.4)
      shipPose.speed += (desiredSpeed - shipPose.speed) * Math.min(1, dt * 2)
      if (distance > 0.05) {
        const lookAt = distance > standOff * 0.6 ? target : bodyPos
        lookMatrix.lookAt(shipPose.position, lookAt, axisY)
        desiredQuat.setFromRotationMatrix(lookMatrix)
        shipPose.quaternion.slerp(desiredQuat, Math.min(1, dt * 3))
        shipPose.position.addScaledVector(toTarget.normalize(), Math.min(distance, shipPose.speed * dt))
      }
      thrust = Math.min(1, desiredSpeed / 20)
    } else if (autopilot === 'orbit') {
      const planet = isPlanetId(destination) ? destination : null
      const orbit = planet ? BODIES[planet].orbit : undefined
      if (planet && orbit) {
        const radius = layoutState.current.orbit[planet] + getBodyRadius(planet) * 3 + 1
        if (orbitAngle.current === null) orbitAngle.current = Math.atan2(-shipPose.position.z, shipPose.position.x)
        orbitAngle.current += (14 / radius) * dt
        orbitPoint(orbitAngle.current, radius, orbit.inclinationDeg, orbit.ascendingNodeDeg, point)
        point.y += getBodyRadius(planet) * 1.5
      } else {
        getBodyWorldPosition(destination, bodyPos)
        const radius = standOffDistance(destination) * 1.4
        if (orbitAngle.current === null) orbitAngle.current = 0
        orbitAngle.current += (6 / radius) * dt
        point.set(bodyPos.x + Math.cos(orbitAngle.current) * radius, bodyPos.y + radius * 0.25, bodyPos.z - Math.sin(orbitAngle.current) * radius)
      }
      toTarget.subVectors(point, shipPose.position)
      const step = toTarget.length()
      shipPose.position.lerp(point, Math.min(1, dt * 2.5))
      if (step > 0.01) {
        lookMatrix.lookAt(shipPose.position, point, axisY)
        desiredQuat.setFromRotationMatrix(lookMatrix)
        shipPose.quaternion.slerp(desiredQuat, Math.min(1, dt * 3))
      }
      shipPose.speed = Math.min(step / Math.max(dt, 1e-3), AUTOPILOT_SPEED)
      thrust = 0.6
    } else {
      orbitAngle.current = null
      const yaw = (input.left ? 1 : 0) - (input.right ? 1 : 0)
      const pitch = (input.up ? 1 : 0) - (input.down ? 1 : 0)
      if (yaw) shipPose.quaternion.multiply(turnQuat.setFromAxisAngle(axisY, yaw * 1.6 * dt))
      if (pitch) shipPose.quaternion.multiply(turnQuat.setFromAxisAngle(axisX, pitch * 1.2 * dt))
      shipPose.quaternion.normalize()
      const max = MAX_SPEED * (input.boost ? BOOST_MULTIPLIER : 1)
      if (input.forward) {
        shipPose.speed = Math.min(max, shipPose.speed + ACCELERATION * (input.boost ? 3 : 1) * dt)
        thrust = input.boost ? 1 : 0.7
      } else if (input.back) {
        shipPose.speed = Math.max(-4, shipPose.speed - ACCELERATION * 1.8 * dt)
      } else {
        shipPose.speed *= Math.exp(-0.25 * dt)
        if (Math.abs(shipPose.speed) < 0.01) shipPose.speed = 0
      }
      if (shipPose.speed > max) shipPose.speed += (max - shipPose.speed) * Math.min(1, dt * 2)
      forward.set(0, 0, -1).applyQuaternion(shipPose.quaternion)
      shipPose.position.addScaledVector(forward, shipPose.speed * dt)
    }

    // Keep a safe distance from the Sun.
    const sunLimit = getBodyRadius('sun') * 1.5
    const fromSun = shipPose.position.length()
    if (fromSun < sunLimit) shipPose.position.multiplyScalar(sunLimit / Math.max(fromSun, 1e-3))
    const outerLimit = layoutState.current.outerEdge * 2.2
    if (fromSun > outerLimit) shipPose.position.multiplyScalar(outerLimit / fromSun)

    shipPose.thrust += (thrust - shipPose.thrust) * Math.min(1, dt * 6)
    group.position.copy(shipPose.position)
    group.quaternion.copy(shipPose.quaternion)
    const flicker = 0.85 + Math.random() * 0.15
    flame.scale.setScalar((0.18 + shipPose.thrust * 0.28) * flicker)
    flameCore.scale.setScalar((0.08 + shipPose.thrust * 0.12) * flicker)
    flame.material.opacity = 0.25 + shipPose.thrust * 0.5

    // Arrival checks and telemetry.
    let nearestId = s.telemetry.nearestId
    let nearestDistance = Infinity
    for (const id of DESTINATIONS) {
      getBodyWorldPosition(id, bodyPos)
      const d = bodyPos.distanceTo(shipPose.position) - getBodyRadius(id)
      if (d < nearestDistance) {
        nearestDistance = d
        nearestId = id
      }
      if (id !== 'sun' && d < standOffDistance(id) * 1.25) s.markVisited(id)
    }

    telemetryTimer.current += dt
    if (telemetryTimer.current >= TELEMETRY_INTERVAL) {
      telemetryTimer.current = 0
      const layout = layoutState.current
      const distanceScene = shipPose.position.length()
      const auPerUnit = sceneToAU(layout, distanceScene + 0.5) - sceneToAU(layout, Math.max(0, distanceScene - 0.5))
      s.setTelemetry({
        speedKmS: Math.abs(shipPose.speed) * auPerUnit * AU_KM,
        distanceAU: sceneToAU(layout, distanceScene),
        nearestId,
        nearestDistance,
      })
    }
  }, -1)

  return (
    <group ref={groupRef} scale={0.2}>
      <mesh material={materials.hull} scale={[0.3, 0.26, 1.25]} geometry={getSphere(24)} />
      <mesh material={materials.glass} position={[0, 0.17, -0.5]} scale={[0.16, 0.12, 0.32]} geometry={getSphere(16)} />
      <mesh material={materials.accent} position={[-0.62, -0.02, 0.28]} rotation={[0, 0.35, 0.12]} scale={[0.62, 0.035, 0.26]} geometry={getSphere(16)} />
      <mesh material={materials.accent} position={[0.62, -0.02, 0.28]} rotation={[0, -0.35, -0.12]} scale={[0.62, 0.035, 0.26]} geometry={getSphere(16)} />
      <mesh material={materials.accent} position={[0, 0.3, 0.78]} rotation={[-0.4, 0, 0]} scale={[0.035, 0.3, 0.24]} geometry={getSphere(12)} />
      <mesh material={materials.hull} position={[-0.2, -0.04, 1.08]} scale={[0.13, 0.13, 0.2]} geometry={getSphere(12)} />
      <mesh material={materials.hull} position={[0.2, -0.04, 1.08]} scale={[0.13, 0.13, 0.2]} geometry={getSphere(12)} />
      <primitive object={flame} position={[0, -0.04, 1.4]} />
      <primitive object={flameCore} position={[0, -0.04, 1.3]} />
      <pointLight color="#7fdcff" intensity={0.6} distance={3} decay={2} position={[0, 0, 1.6]} />
    </group>
  )
}
