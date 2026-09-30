import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimStore } from '../../store/simulationStore'
import { useScale } from '../../hooks/useScale'
import { BODY_BY_ID } from '../../data/planets'
import { pressedKeys } from '../../utils/input'
import { getBodyPosition } from '../../utils/simClock'
import { auFromWorldRadius, type ScaleConfig } from '../../utils/scale'
import { craftCommand, telemetry } from '../../utils/telemetry'

const MAX_SPEED = 180
const BOOST_MULTIPLIER = 3.2
const Y_AXIS = new THREE.Vector3(0, 1, 0)
const FORWARD = new THREE.Vector3(0, 0, -1)
const UP = new THREE.Vector3(0, 1, 0)

// Frame-loop scratch vectors — never allocate inside useFrame.
const _forward = new THREE.Vector3()
const _up = new THREE.Vector3()
const _cameraOffset = new THREE.Vector3()
const _lookOffset = new THREE.Vector3()
const _lookMatrix = new THREE.Matrix4()
const _desiredQuat = new THREE.Quaternion()

function radiusOf(id: string, scale: ScaleConfig): number {
  if (id === 'sun') return scale.sunRadius
  const body = BODY_BY_ID[id]
  if (!body) return 2
  if (id === 'moon') return scale.planetRadius(3_475)
  return Math.max(0.16, scale.planetRadius(body.diameterKm))
}

/**
 * Child-friendly spacecraft: simple controls, smooth inertia, an autopilot
 * for "fly me there" destinations, and a trailing chase camera.
 *
 * Controls: W/S thrust · A/D turn · R/F up/down · ↑/↓ pitch · Shift boost
 */
export function Spacecraft() {
  const active = useSimStore((s) => s.spacecraftActive)
  const reducedMotion = useSimStore((s) => s.reducedMotion)
  const scale = useScale()
  const camera = useThree((s) => s.camera)

  const groupRef = useRef<THREE.Group>(null)
  const engineRef = useRef<THREE.Mesh>(null)
  const velocity = useMemo(() => new THREE.Vector3(), [])
  const targetPoint = useMemo(() => new THREE.Vector3(), [])
  const lookAt = useMemo(() => new THREE.Vector3(), [])
  const hasTarget = useRef(false)
  const arrivedRef = useRef(false)

  // Launch near Earth each time the mode opens
  useEffect(() => {
    if (!active || !groupRef.current) return
    const earth = getBodyPosition('earth')
    const lift = scale.planetRadius(12_756)
    groupRef.current.position.set(earth.x, earth.y + lift * 6, earth.z + lift * 15)
    groupRef.current.quaternion.identity()
    velocity.set(0, 0, 0)
    hasTarget.current = false
    arrivedRef.current = false
    telemetry.destinationId = null
    telemetry.destinationLabel = 'Free flight'
    telemetry.orbitRide = false
    telemetry.speed = 0
    telemetry.arrived = false
  }, [active, scale])

  useFrame((_, delta) => {
    if (!active || !groupRef.current) return
    const dt = Math.min(delta, 0.05)
    const group = groupRef.current
    const store = useSimStore.getState()

    // --- consume a one-shot Mission Control command -------------------------
    if (craftCommand.pending) {
      const command = craftCommand.pending
      craftCommand.pending = null
      if (command.kind === 'stop') {
        hasTarget.current = false
        arrivedRef.current = false
        telemetry.destinationId = null
        telemetry.destinationLabel = 'Free flight'
        telemetry.orbitRide = false
      } else {
        hasTarget.current = true
        arrivedRef.current = false
        telemetry.arrived = false
        telemetry.destinationId = command.id
        telemetry.destinationLabel = BODY_BY_ID[command.id]?.name ?? 'Unknown'
        telemetry.orbitRide = command.kind === 'orbit'
      }
    }

    // --- destination point ---------------------------------------------------
    let hasPoint = false
    let destinationRadius = 0
    if (hasTarget.current && telemetry.destinationId) {
      const body = BODY_BY_ID[telemetry.destinationId]
      if (body) {
        const bodyPos = getBodyPosition(body.id)
        targetPoint.copy(bodyPos)
        destinationRadius = radiusOf(body.id, scale)
        if (telemetry.orbitRide && body.id !== 'sun') {
          // Chase a marker slightly ahead along the planet's orbital path
          targetPoint.applyAxisAngle(Y_AXIS, 0.2)
        }
        hasPoint = true

        const distance = group.position.distanceTo(targetPoint)
        const stopDistance = destinationRadius * 4 + 7
        if (!telemetry.orbitRide && !arrivedRef.current && distance < stopDistance) {
          arrivedRef.current = true
          telemetry.arrived = true
          store.showToast(`Mission accomplished — you reached ${body.name}!`, 'fun')
        }
      }
    }

    // --- manual steering -----------------------------------------------------
    const yaw =
      (pressedKeys.has('KeyA') || pressedKeys.has('ArrowLeft') ? 1 : 0) -
      (pressedKeys.has('KeyD') || pressedKeys.has('ArrowRight') ? 1 : 0)
    const pitch = (pressedKeys.has('ArrowUp') ? 1 : 0) - (pressedKeys.has('ArrowDown') ? 1 : 0)
    const roll = (pressedKeys.has('KeyQ') ? 1 : 0) - (pressedKeys.has('KeyE') ? 1 : 0)

    if (yaw) group.rotateY(yaw * dt * 1.5)
    if (pitch) group.rotateX(pitch * dt * 1.2)
    if (roll) group.rotateZ(roll * dt * 1.4)

    // --- autopilot orientation ----------------------------------------------
    if (hasPoint) {
      _lookMatrix.lookAt(group.position, targetPoint, UP)
      _desiredQuat.setFromRotationMatrix(_lookMatrix)
      group.quaternion.slerp(_desiredQuat, 1 - Math.exp(-1.6 * dt))
    }

    // --- throttle ------------------------------------------------------------
    let throttle = 0
    if (hasPoint) {
      const distance = group.position.distanceTo(targetPoint)
      if (telemetry.orbitRide) {
        throttle = 1
      } else if (arrivedRef.current) {
        throttle = distance > destinationRadius * 5 ? 0.35 : 0
      } else {
        throttle = 1
      }
    }
    if (pressedKeys.has('KeyW')) throttle = 1
    if (pressedKeys.has('KeyS')) throttle = -0.55

    const boost = pressedKeys.has('ShiftLeft') || pressedKeys.has('ShiftRight') ? BOOST_MULTIPLIER : 1
    _forward.copy(FORWARD).applyQuaternion(group.quaternion)
    velocity.addScaledVector(_forward, 62 * boost * throttle * dt)

    const vertical = (pressedKeys.has('KeyF') ? 1 : 0) - (pressedKeys.has('KeyR') ? 1 : 0)
    if (vertical) {
      _up.copy(UP).applyQuaternion(group.quaternion)
      velocity.addScaledVector(_up, vertical * 42 * dt)
    }

    // Gentle drag keeps the craft forgiving for small pilots
    velocity.multiplyScalar(Math.exp(-0.9 * dt))
    const speed = velocity.length()
    const cap = MAX_SPEED * boost
    if (speed > cap) velocity.multiplyScalar(cap / speed)
    group.position.addScaledVector(velocity, dt)

    // --- chase camera --------------------------------------------------------
    const followDistance = reducedMotion ? 26 : 16
    _cameraOffset.set(0, 3.4, followDistance).applyQuaternion(group.quaternion).add(group.position)
    camera.position.lerp(_cameraOffset, 1 - Math.exp(-6 * dt))
    _lookOffset.set(0, 1.4, -26).applyQuaternion(group.quaternion).add(group.position)
    lookAt.copy(_lookOffset)
    camera.lookAt(lookAt)

    // --- engine flame + telemetry --------------------------------------------
    if (engineRef.current) {
      const flame = 0.55 + Math.abs(throttle) * 0.7 + (boost - 1) * 0.2
      engineRef.current.scale.set(flame, flame, flame * 1.4)
      const material = engineRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.4 + Math.min(0.55, Math.abs(throttle) * 0.45)
    }

    telemetry.speed = velocity.length()
    telemetry.distanceUnits = group.position.length()
    telemetry.distanceAu = auFromWorldRadius(telemetry.distanceUnits, scale.orbitRadius)
  })

  if (!active) return null

  return (
    <group ref={groupRef}>
      {/* Fuselage */}
      <mesh rotation={[Math.PI / 2, 0, 0]} raycast={() => {}}>
        <capsuleGeometry args={[0.55, 2.4, 6, 16]} />
        <meshStandardMaterial color="#dbe4f0" metalness={0.55} roughness={0.35} />
      </mesh>

      {/* Cockpit */}
      <mesh position={[0, 0.42, -0.65]} raycast={() => {}}>
        <sphereGeometry args={[0.42, 20, 14]} />
        <meshStandardMaterial
          color="#0f2a4a"
          metalness={0.2}
          roughness={0.1}
          emissive="#38bdf8"
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Wings */}
      <mesh position={[0, -0.05, 0.45]} raycast={() => {}}>
        <boxGeometry args={[3.4, 0.12, 1.1]} />
        <meshStandardMaterial color="#7dd3fc" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Tail fin */}
      <mesh position={[0, 0.7, 0.9]} raycast={() => {}}>
        <boxGeometry args={[0.12, 1.1, 1]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Nose cone */}
      <mesh position={[0, 0, -1.75]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => {}}>
        <coneGeometry args={[0.5, 1, 16]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Engine flame */}
      <mesh ref={engineRef} position={[0, 0, 1.95]} raycast={() => {}}>
        <sphereGeometry args={[0.5, 16, 12]} />
        <meshBasicMaterial color="#7cc4ff" transparent opacity={0.7} depthWrite={false} />
      </mesh>
      <pointLight color="#66b6ff" intensity={8} distance={40} decay={1} position={[0, 0, 2]} />

      {/* Navigation lights */}
      <mesh position={[-1.7, -0.05, 0.45]} raycast={() => {}}>
        <sphereGeometry args={[0.14, 10, 8]} />
        <meshBasicMaterial color="#ff5f5f" />
      </mesh>
      <mesh position={[1.7, -0.05, 0.45]} raycast={() => {}}>
        <sphereGeometry args={[0.14, 10, 8]} />
        <meshBasicMaterial color="#63f58a" />
      </mesh>
    </group>
  )
}
