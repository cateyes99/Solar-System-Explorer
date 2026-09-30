import * as THREE from 'three'
import { daysSinceJ2000, j2000ToMs } from './astronomy'

/**
 * Mutable simulation clock.
 *
 * Deliberately outside React state: it is written every single frame, so it
 * must never trigger re-renders. UI reads are throttled through the store.
 */
export const simClock = {
  /** Days elapsed since J2000 — this drives the whole Solar System. */
  days: daysSinceJ2000(Date.now()),
  /** Simulated days advanced per real second. */
  speed: 1,
  paused: false,
}

export function setSimSpeed(daysPerSecond: number, paused: boolean): void {
  simClock.speed = daysPerSecond
  simClock.paused = paused
}

export function jumpSimDays(deltaDays: number): void {
  simClock.days += deltaDays
}

export function setSimDateMs(ms: number): void {
  simClock.days = daysSinceJ2000(ms)
}

export function simDateMs(): number {
  return j2000ToMs(simClock.days)
}

/**
 * Live world positions (in scene units) of every body, written by the scene
 * each frame and read by the camera rig, labels, spacecraft and HUD.
 * Kept in plain objects to avoid allocation inside the render loop.
 */
export const bodyPositions: Record<string, THREE.Vector3> = {
  sun: new THREE.Vector3(0, 0, 0),
  moon: new THREE.Vector3(),
  mercury: new THREE.Vector3(),
  venus: new THREE.Vector3(),
  earth: new THREE.Vector3(),
  mars: new THREE.Vector3(),
  jupiter: new THREE.Vector3(),
  saturn: new THREE.Vector3(),
  uranus: new THREE.Vector3(),
  neptune: new THREE.Vector3(),
}

export function getBodyPosition(id: string): THREE.Vector3 {
  return bodyPositions[id] ?? bodyPositions.sun
}
