import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Vector3 } from 'three'
import { useSimulation } from '../../store/simulationStore'
import { bodyById } from '../../data/planets'
import { orbitFor, positionFor } from '../../utils/astronomy'
import { flight } from '../../store/flightState'

export function Spacecraft() {
  const ship = useRef<Group>(null)
  const keys = useRef(new Set<string>())
  const velocity = useRef(new Vector3())
  const position = useRef(new Vector3(15, 2, 16))
  const target = useRef(new Vector3())
  const lastUpdate = useRef(0)
  const pathAngle = useRef(0)
  const active = useSimulation(state => state.missionActive)
  const reset = useSimulation(state => state.missionReset)
  useEffect(() => { position.current.set(15, 2, 16); velocity.current.set(0, 0, 0); flight.arrived = false; flight.autoPilot = true; flight.orbitPath = false }, [reset])
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (!useSimulation.getState().missionActive || ['INPUT', 'SELECT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) return
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key)) {
        event.preventDefault(); keys.current.add(event.key)
      }
    }
    const up = (event: KeyboardEvent) => keys.current.delete(event.key)
    const blur = () => { keys.current.clear(); useSimulation.getState().set({ thrust: 0, steer: 0 }) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur) }
  }, [])
  useFrame((state, rawDelta) => {
    if (!ship.current || !active) return
    const simulation = useSimulation.getState()
    const delta = Math.min(rawDelta, .05)
    target.current.set(...positionFor(simulation.missionDestination, simulation.days, simulation.scale, simulation.spacing, simulation.size))
    if (flight.orbitPath) {
      if (!simulation.paused && !simulation.reducedMotion) pathAngle.current += delta * .15
      const radius = orbitFor(simulation.missionDestination, simulation.scale, simulation.spacing)
      target.current.set(Math.cos(pathAngle.current) * radius, 1, -Math.sin(pathAngle.current) * radius)
    }
    const destinationRadius = flight.orbitPath ? .1 : bodyById[simulation.missionDestination].radius * 2.5 + 1
    const distance = position.current.distanceTo(target.current)
    flight.arrived = !flight.orbitPath && distance < destinationRadius + 1.2
    const forward = simulation.thrust || Number(keys.current.has('ArrowUp') || keys.current.has('w')) - Number(keys.current.has('ArrowDown') || keys.current.has('s'))
    const turn = simulation.steer || Number(keys.current.has('ArrowLeft') || keys.current.has('a')) - Number(keys.current.has('ArrowRight') || keys.current.has('d'))
    if (forward || turn) { flight.autoPilot = false; flight.orbitPath = false }
    if (!simulation.paused && !simulation.reducedMotion) {
      if (flight.autoPilot) {
        const difference = target.current.clone().sub(position.current)
        const speed = Math.min(9, Math.max(0, distance - destinationRadius) * 1.1)
        velocity.current.copy(difference.normalize().multiplyScalar(speed))
        ship.current.lookAt(target.current)
      } else {
        ship.current.rotation.y += turn * delta * 1.6
        const direction = new Vector3(0, 0, 1).applyQuaternion(ship.current.quaternion)
        velocity.current.addScaledVector(direction, forward * delta * 6)
        velocity.current.multiplyScalar(Math.exp(-delta * .6)).clampLength(0, 12)
      }
      position.current.addScaledVector(velocity.current, delta)
      if (position.current.length() > 140) { position.current.clampLength(0, 140); velocity.current.set(0, 0, 0) }
    }
    ship.current.position.copy(position.current)
    if (state.clock.elapsedTime - lastUpdate.current > .15) {
      flight.speed = velocity.current.length()
      flight.distance = position.current.length() / orbitFor('earth', simulation.scale, simulation.spacing)
      lastUpdate.current = state.clock.elapsedTime
    }
  })
  return <group ref={ship} visible={active}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[.2, .8, 8]} /><meshStandardMaterial color="#e4e9e9" metalness={.65} roughness={.3} /></mesh>
    <mesh position={[0, 0, -.05]}><boxGeometry args={[1.1, .045, .3]} /><meshStandardMaterial color="#719cad" metalness={.7} roughness={.35} /></mesh>
    <mesh position={[0, 0, -.45]}><sphereGeometry args={[.1, 16, 12]} /><meshBasicMaterial color="#9ff6e5" /></mesh>
    <pointLight color="#92e8d4" intensity={1} distance={3} />
  </group>
}