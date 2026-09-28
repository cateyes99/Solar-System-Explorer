import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore } from '../../store/simulationStore'
import { registerBody } from '../../utils/bodyRegistry'

const ACCELERATION = 14
const DRAG = 0.6
const MAX_SPEED = 40

/**
 * A small procedural ship. In free-flight "Spacecraft Mode" it is piloted with
 * WASD + Q/E and chased by the camera. Otherwise it autonomously drifts along
 * a slow, wide loop as an ambient easter egg ("a tiny spacecraft occasionally
 * passes through the scene").
 */
export function Spacecraft() {
  const groupRef = useRef<THREE.Group>(null)
  const velocity = useRef(new THREE.Vector3())
  const keys = useRef<Record<string, boolean>>({})
  const telemetryTimer = useRef(0)

  const isSpacecraftMode = useSimulationStore((s) => s.isSpacecraftMode)
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)
  const setSpacecraftTelemetry = useSimulationStore((s) => s.setSpacecraftTelemetry)

  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#dfe6f0', metalness: 0.6, roughness: 0.35 }), [])
  const accentMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#4fd6ff', metalness: 0.4, roughness: 0.3, emissive: '#1c7fa0', emissiveIntensity: 0.6 }),
    [],
  )
  const engineMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ff9d4d', emissive: '#ff9d4d', emissiveIntensity: 1.4 }),
    [],
  )

  useEffect(
    () => () => {
      bodyMaterial.dispose()
      accentMaterial.dispose()
      engineMaterial.dispose()
    },
    [bodyMaterial, accentMaterial, engineMaterial],
  )

  useEffect(() => {
    registerBody('spacecraft', groupRef.current)
    return () => registerBody('spacecraft', null)
  }, [])

  useEffect(() => {
    if (!isSpacecraftMode || !groupRef.current) return
    groupRef.current.position.set(16, 2.5, 0)
    groupRef.current.rotation.set(0, 0, 0)
    velocity.current.set(0, 0, 0)
  }, [isSpacecraftMode])

  useEffect(() => {
    if (!isSpacecraftMode) return
    const onKeyDown = (event: KeyboardEvent) => {
      keys.current[event.key.toLowerCase()] = true
    }
    const onKeyUp = (event: KeyboardEvent) => {
      keys.current[event.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      keys.current = {}
    }
  }, [isSpacecraftMode])

  useFrame((state, delta) => {
    const ship = groupRef.current
    if (!ship) return

    if (isSpacecraftMode) {
      const yawSpeed = 1.8
      const pitchSpeed = 1.1
      if (keys.current.a) ship.rotation.y += delta * yawSpeed
      if (keys.current.d) ship.rotation.y -= delta * yawSpeed
      if (keys.current.q) ship.rotation.x = THREE.MathUtils.clamp(ship.rotation.x + delta * pitchSpeed, -0.6, 0.6)
      if (keys.current.e) ship.rotation.x = THREE.MathUtils.clamp(ship.rotation.x - delta * pitchSpeed, -0.6, 0.6)

      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion)
      const thrust = keys.current.w ? 1 : keys.current.s ? -0.6 : 0
      velocity.current.addScaledVector(forward, thrust * ACCELERATION * delta)
      if (velocity.current.length() > MAX_SPEED) velocity.current.setLength(MAX_SPEED)
      velocity.current.multiplyScalar(Math.max(0, 1 - DRAG * delta))
      ship.position.addScaledVector(velocity.current, delta)

      telemetryTimer.current += delta
      if (telemetryTimer.current > 0.15) {
        telemetryTimer.current = 0
        setSpacecraftTelemetry({
          speed: velocity.current.length(),
          distanceFromSun: ship.position.length(),
        })
      }
    } else if (!reducedMotion) {
      const t = state.clock.elapsedTime * 0.045
      const pathRadius = 85
      const x = Math.cos(t) * pathRadius
      const y = Math.sin(t * 0.7) * 18
      const z = Math.sin(t) * pathRadius
      ship.position.set(x, y, z)
      ship.lookAt(Math.cos(t + 0.05) * pathRadius, Math.sin((t + 0.05) * 0.7) * 18, Math.sin(t + 0.05) * pathRadius)
    }
  })

  return (
    <group ref={groupRef} visible={isSpacecraftMode || !reducedMotion}>
      <mesh material={bodyMaterial} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.3]}>
        <coneGeometry args={[0.22, 0.6, 10]} />
      </mesh>
      <mesh material={bodyMaterial}>
        <cylinderGeometry args={[0.16, 0.2, 0.7, 10]} />
      </mesh>
      <mesh material={accentMaterial} position={[0.32, 0, 0.05]} rotation={[0, 0, Math.PI / 10]}>
        <boxGeometry args={[0.45, 0.03, 0.22]} />
      </mesh>
      <mesh material={accentMaterial} position={[-0.32, 0, 0.05]} rotation={[0, 0, -Math.PI / 10]}>
        <boxGeometry args={[0.45, 0.03, 0.22]} />
      </mesh>
      <mesh material={engineMaterial} position={[0, 0, 0.42]}>
        <sphereGeometry args={[0.09, 12, 12]} />
      </mesh>
      <pointLight color="#ff9d4d" intensity={isSpacecraftMode ? 0.8 : 0.3} distance={4} position={[0, 0, 0.5]} />
    </group>
  )
}
