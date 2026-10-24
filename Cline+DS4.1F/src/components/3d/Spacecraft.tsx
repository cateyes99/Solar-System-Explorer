import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { Group, Mesh, Sprite, SpriteMaterial } from 'three'
import { getBodyWorldPosition, registerBody, unregisterBody } from '../../utils/bodyRegistry'
import { spacecraft } from '../../utils/spacecraftSim'
import type { FlightControls } from '../../utils/spacecraftSim'
import { keyboard } from '../../utils/input'
import { audio } from '../../utils/audio'
import { useSimulationStore } from '../../store/simulationStore'
import { getSpacecraftMaterials } from './spacecraft/spacecraftResources'
import { SpacecraftModel } from './spacecraft/SpacecraftModel'

/**
 * Mission Control's spacecraft.
 *
 * The ship flies the way a ship should: A/D turn it left and right, R/F pitch
 * its nose up and down, and W/S thrust forward and back along whichever way it
 * is pointing. Turning and thrusting both ramp up smoothly while a key is held,
 * and nothing about thrusting ever changes the heading — reverse simply pushes
 * the other way along the same axis. The autopilot takes over and cruises to the
 * chosen destination, which is how most children will use it, but nothing stops
 * them grabbing the controls and flying it themselves.
 *
 * The ship itself — a detailed probe with PBR materials and its own reflection
 * environment — lives in `./spacecraft`; this component reads the keyboard,
 * advances the flight model and drives the engine glow and exhaust plume.
 */

const FORWARD_KEYS = ['KeyW', 'ArrowUp']
const BACK_KEYS = ['KeyS', 'ArrowDown']
const LEFT_KEYS = ['KeyA', 'ArrowLeft']
const RIGHT_KEYS = ['KeyD', 'ArrowRight']
const PITCH_UP_KEYS = ['KeyR']
const PITCH_DOWN_KEYS = ['KeyF']
const BOOST_KEYS = ['ShiftLeft', 'ShiftRight']

const destination = new Vector3()

export function Spacecraft() {
  const groupRef = useRef<Group>(null)
  const engineRef = useRef<Mesh>(null)
  const plumeRef = useRef<Sprite>(null)
  const plumeMaterialRef = useRef<SpriteMaterial>(null)
  const controls = useRef<FlightControls>({ yaw: 0, pitch: 0, thrust: 0 })

  const missionActive = useSimulationStore((state) => state.missionActive)
  const autopilot = useSimulationStore((state) => state.autopilot)
  const destinationId = useSimulationStore((state) => state.destinationId)

  // One shared set of materials for the one ship (see spacecraftResources).
  const gl = useThree((state) => state.gl)
  const materials = getSpacecraftMaterials(gl)

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

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return

    // --- Pilot input ------------------------------------------------------
    // The ship only answers the keys while the child is flying it by hand.
    const manual = missionActive && !spacecraft.autopilot
    const input = controls.current
    if (manual) {
      input.yaw = (keyboard.anyDown(RIGHT_KEYS) ? 1 : 0) - (keyboard.anyDown(LEFT_KEYS) ? 1 : 0)
      input.pitch = (keyboard.anyDown(PITCH_UP_KEYS) ? 1 : 0) - (keyboard.anyDown(PITCH_DOWN_KEYS) ? 1 : 0)
      input.thrust = (keyboard.anyDown(FORWARD_KEYS) ? 1 : 0) - (keyboard.anyDown(BACK_KEYS) ? 1 : 0)
    } else {
      input.yaw = 0
      input.pitch = 0
      input.thrust = 0
    }

    // --- Autopilot target -------------------------------------------------
    let target: Vector3 | null = null
    if (spacecraft.autopilot && destinationId) {
      target = getBodyWorldPosition(destinationId, destination) ?? null
    }

    spacecraft.update(delta, input, target, keyboard.anyDown(BOOST_KEYS))

    // --- Apply the flight model to the model ------------------------------
    // Position and orientation both come straight from the ship: the heading is
    // never derived from velocity, so it never snaps around.
    group.position.copy(spacecraft.position)
    group.quaternion.copy(spacecraft.orientation)

    const power = Math.abs(spacecraft.throttle)
    engineRef.current?.scale.setScalar(0.85 + power * 0.6)
    if (plumeRef.current) {
      const size = 1.2 + power * 4.4 + (spacecraft.autopilot ? 1.2 : 0)
      plumeRef.current.scale.set(size, size, 1)
    }
    if (plumeMaterialRef.current) {
      plumeMaterialRef.current.opacity = 0.12 + power * 0.7
    }
  })

  return (
    <group ref={groupRef} visible={missionActive}>
      <SpacecraftModel
        materials={materials}
        engineRef={engineRef}
        plumeRef={plumeRef}
        plumeMaterialRef={plumeMaterialRef}
      />
    </group>
  )
}
