import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, MeshStandardMaterial, Vector3 } from 'three'
import { BODY_DATA } from '../../data/planets'
import { useSimulationStore } from '../../store/simulationStore'
import { clearFlightInput, flightInput, useMissionStore } from '../../store/missionStore'
import type { FlightControl } from '../../store/missionStore'
import { registerBody, getBodyPosition } from '../../utils/bodyRegistry'
import { getBodyRadius } from '../../utils/scale'

const keyMap: Record<string, FlightControl> = {
  KeyW: 'forward', ArrowUp: 'forward',
  KeyS: 'backward', ArrowDown: 'backward',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  KeyQ: 'down', KeyE: 'up',
  ShiftLeft: 'boost', ShiftRight: 'boost',
}

const desiredVelocity = new Vector3()
const direction = new Vector3()
const destinationPosition = new Vector3()
const lookTarget = new Vector3()

export function Spacecraft() {
  const ship = useRef<Group>(null)
  const engine = useRef<MeshStandardMaterial>(null)
  const velocity = useRef(new Vector3())
  const lastTelemetry = useRef(0)
  const destination = useMissionStore((state) => state.destination)
  const autopilot = useMissionStore((state) => state.autopilot)
  const followOrbit = useMissionStore((state) => state.followOrbit)
  const setTelemetry = useMissionStore((state) => state.setTelemetry)
  const setAutopilot = useMissionStore((state) => state.setAutopilot)
  const missionActive = useSimulationStore((state) => state.missionActive)
  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const customSize = useSimulationStore((state) => state.customSize)

  useEffect(() => {
    if (!missionActive) return
    const down = (event: KeyboardEvent) => {
      const control = keyMap[event.code]
      if (!control || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return
      event.preventDefault()
      flightInput[control] = true
      if (control !== 'boost') setAutopilot(false)
    }
    const up = (event: KeyboardEvent) => {
      const control = keyMap[event.code]
      if (control) flightInput[control] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clearFlightInput)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clearFlightInput)
      clearFlightInput()
    }
  }, [missionActive, setAutopilot])

  useEffect(() => {
    if (ship.current && missionActive) return registerBody('spacecraft', ship.current)
  }, [missionActive])

  useFrame(({ clock }, delta) => {
    if (!ship.current || !missionActive) return
    const position = ship.current.position
    desiredVelocity.set(0, 0, 0)

    if (autopilot) {
      const target = getBodyPosition(destination, destinationPosition)
      if (target) {
        const radius = getBodyRadius(BODY_DATA[destination], scaleMode, customSize)
        if (followOrbit) {
          const angle = clock.elapsedTime * 0.18
          target.add(new Vector3(Math.cos(angle) * (radius + 4), 1.2, Math.sin(angle) * (radius + 4)))
        } else {
          target.add(new Vector3(0, radius + 1.4, radius + 2.5))
        }
        direction.copy(target).sub(position)
        const distance = direction.length()
        const arrivalSpeed = Math.min(12, Math.max(0.5, distance * 0.7))
        desiredVelocity.copy(direction.normalize()).multiplyScalar(arrivalSpeed)
        velocity.current.lerp(desiredVelocity, 1 - Math.exp(-delta * 1.25))
      }
    } else {
      direction.set(
        Number(flightInput.right) - Number(flightInput.left),
        Number(flightInput.up) - Number(flightInput.down),
        Number(flightInput.backward) - Number(flightInput.forward),
      )
      if (direction.lengthSq() > 0) {
        direction.normalize()
        velocity.current.addScaledVector(direction, delta * 18)
      }
      velocity.current.multiplyScalar(Math.exp(-delta * 0.55))
      const maxSpeed = flightInput.boost ? 24 : 12
      if (velocity.current.length() > maxSpeed) velocity.current.setLength(maxSpeed)
    }

    position.addScaledVector(velocity.current, delta)
    if (position.length() > 170) {
      position.setLength(170)
      velocity.current.multiplyScalar(0.3)
    }
    if (velocity.current.lengthSq() > 0.04) {
      lookTarget.copy(position).add(velocity.current)
      ship.current.lookAt(lookTarget)
    }
    if (engine.current) engine.current.emissiveIntensity = 1.2 + velocity.current.length() * 0.18

    const now = performance.now()
    if (now - lastTelemetry.current > 200) {
      lastTelemetry.current = now
      setTelemetry(velocity.current.length(), position.length())
    }
  })

  if (!missionActive) return null
  return (
    <group ref={ship} position={[7, 4, 24]} scale={0.34}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.3]}>
        <coneGeometry args={[0.48, 2.6, 12]} />
        <meshStandardMaterial color="#d8dce1" metalness={0.85} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0, -0.65]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.53, 0.53, 0.65, 12]} />
        <meshStandardMaterial color="#b88b3c" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[1.35, 0, -0.45]}><boxGeometry args={[1.9, 0.06, 1.15]} /><meshStandardMaterial color="#1d4e8b" emissive="#143661" emissiveIntensity={0.5} metalness={0.4} /></mesh>
      <mesh position={[-1.35, 0, -0.45]}><boxGeometry args={[1.9, 0.06, 1.15]} /><meshStandardMaterial color="#1d4e8b" emissive="#143661" emissiveIntensity={0.5} metalness={0.4} /></mesh>
      <mesh position={[0, 0, -1.08]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.32, 1.4, 12, 1, true]} />
        <meshStandardMaterial ref={engine} color="#6be4ff" emissive="#39bce6" emissiveIntensity={2} transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <pointLight color="#65dfff" intensity={1.2} distance={3} position={[0, 0, -1.4]} />
    </group>
  )
}
