import { create } from 'zustand'
import type { BodyId } from '../types'

export type FlightControl = 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down' | 'boost'

export const flightInput: Record<FlightControl, boolean> = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false,
  boost: false,
}

export function setFlightInput(control: FlightControl, active: boolean): void {
  flightInput[control] = active
}

export function clearFlightInput(): void {
  Object.keys(flightInput).forEach((key) => {
    flightInput[key as FlightControl] = false
  })
}

interface MissionState {
  speed: number
  distanceFromSun: number
  destination: BodyId
  autopilot: boolean
  followOrbit: boolean
  setTelemetry: (speed: number, distance: number) => void
  setDestination: (destination: BodyId) => void
  setAutopilot: (autopilot: boolean) => void
  setFollowOrbit: (followOrbit: boolean) => void
}

export const useMissionStore = create<MissionState>((set) => ({
  speed: 0,
  distanceFromSun: 0,
  destination: 'earth',
  autopilot: false,
  followOrbit: false,
  setTelemetry: (speed, distanceFromSun) => set({ speed, distanceFromSun }),
  setDestination: (destination) => set({ destination }),
  setAutopilot: (autopilot) => set((state) => ({
    autopilot,
    followOrbit: autopilot ? state.followOrbit : false,
  })),
  setFollowOrbit: (followOrbit) => set({ followOrbit, autopilot: true }),
}))
