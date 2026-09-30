/**
 * Flight keys are shared between the spacecraft's own listener and the global
 * keyboard map, which must stand aside while the probe is deployed.
 */
export const SHIP_KEY_CODES = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyQ',
  'KeyE',
  'ShiftLeft',
  'ShiftRight',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
])

/** Movement keys that should cancel autopilot once the child takes over. */
export const SHIP_MANUAL_CODES = [
  'KeyW',
  'KeyS',
  'KeyA',
  'KeyD',
  'KeyQ',
  'KeyE',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]