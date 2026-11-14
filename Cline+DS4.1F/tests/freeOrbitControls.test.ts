import test from 'node:test'
import assert from 'node:assert/strict'
import { PerspectiveCamera, Quaternion, Vector3 } from 'three'
import { FreeOrbitControls, tumbleQuaternion } from '../src/utils/freeOrbitControls.ts'

/**
 * The free-tumbling orbit camera. Run with `npm test`.
 *
 * The point of these is the thing OrbitControls could not do: the vertical
 * rotation must keep going past the pole without gimbal lock, while the camera's
 * up vector stays perpendicular to its view direction so `lookAt` never breaks.
 */

const WORLD_UP = new Vector3(0, 1, 0)

/** A camera in the same pose the app opens with: in front of the target. */
function makeCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera()
  camera.position.set(0, 0, 10)
  camera.up.set(0, 1, 0)
  camera.lookAt(0, 0, 0)
  return camera
}

/** A controller with damping off, so one `update` applies the whole step. */
function makeControls(freeTumble = true): { camera: PerspectiveCamera; controls: FreeOrbitControls } {
  const camera = makeCamera()
  const controls = new FreeOrbitControls(camera)
  controls.target.set(0, 0, 0)
  controls.enableDamping = false
  controls.freeTumble = freeTumble
  return { camera, controls }
}

test('the first update aims the camera at its target', () => {
  const camera = new PerspectiveCamera()
  camera.position.set(18, 44, 96)
  // A fresh camera looks down -Z, which is not toward the scene.
  const controls = new FreeOrbitControls(camera)
  controls.target.set(0, 0, 0)
  controls.update()
  const toTarget = new Vector3().subVectors(controls.target, camera.position).normalize()
  const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
  assert.ok(forward.distanceTo(toTarget) < 1e-6)
})

test('a full turn about the up axis returns the camera to where it started', () => {
  const { camera, controls } = makeControls()
  const start = camera.position.clone()
  for (let i = 0; i < 8; i += 1) {
    controls.rotate(Math.PI / 4, 0)
    controls.update()
  }
  assert.ok(camera.position.distanceTo(start) < 1e-6)
  assert.ok(camera.up.distanceTo(WORLD_UP) < 1e-6)
})

test('the up vector stays perpendicular to the view however far it tumbles', () => {
  const { camera, controls } = makeControls()
  const offset = new Vector3()
  for (let i = 0; i < 64; i += 1) {
    controls.rotate(0, Math.PI / 8)
    controls.update()
    offset.copy(camera.position).sub(controls.target).normalize()
    const alignment = Math.abs(offset.dot(camera.up))
    assert.ok(alignment < 1e-6, `up lost perpendicularity at step ${i} (${alignment})`)
  }
})

test('free tumbling carries the camera right over the pole', () => {
  const { camera, controls } = makeControls()
  const offset = new Vector3()
  let lowest = Infinity
  for (let i = 0; i < 8; i += 1) {
    controls.rotate(0, Math.PI / 8)
    controls.update()
    offset.copy(camera.position).sub(controls.target).normalize()
    lowest = Math.min(lowest, offset.y)
  }
  // Straight below the target (offset.y = -1) is the pole OrbitControls stopped
  // at; free tumbling reaches it and keeps going.
  assert.ok(lowest < -0.9999, `never reached the pole (lowest ${lowest})`)
})

test('a full vertical revolution also returns to the start', () => {
  const { camera, controls } = makeControls()
  const start = camera.position.clone()
  const startUp = camera.up.clone()
  for (let i = 0; i < 16; i += 1) {
    controls.rotate(0, Math.PI / 8)
    controls.update()
  }
  assert.ok(camera.position.distanceTo(start) < 1e-6)
  assert.ok(camera.up.distanceTo(startUp) < 1e-6)
})

test('with free tumbling off the polar angle is clamped and the horizon stays level', () => {
  const { camera, controls } = makeControls(false)
  const offset = new Vector3()
  for (let i = 0; i < 32; i += 1) {
    controls.rotate(0, Math.PI / 8)
    controls.update()
    offset.copy(camera.position).sub(controls.target).normalize()
    assert.ok(camera.up.distanceTo(WORLD_UP) < 1e-6, 'the horizon rolled')
    // Never quite reaches the pole, exactly as OrbitControls behaved.
    assert.ok(offset.y > -0.9999, `passed the pole at step ${i} (${offset.y})`)
  }
})

test('zoom is clamped to the distance range', () => {
  const { camera, controls } = makeControls()
  controls.minDistance = 2
  controls.maxDistance = 20

  controls.zoomBy(0.001)
  controls.update()
  assert.ok(Math.abs(camera.position.distanceTo(controls.target) - 2) < 1e-6)

  controls.zoomBy(1000)
  controls.update()
  assert.ok(Math.abs(camera.position.distanceTo(controls.target) - 20) < 1e-6)
})

test('tumbleQuaternion is an identity after a full turn and composes both axes', () => {
  const identity = new Vector3(1, 2, 3)
  const full = tumbleQuaternion(2 * Math.PI, 0, WORLD_UP, new Vector3(1, 0, 0), new Quaternion())
  assert.ok(identity.clone().applyQuaternion(full).distanceTo(identity) < 1e-6)

  const composed = tumbleQuaternion(0, Math.PI / 2, WORLD_UP, new Vector3(1, 0, 0), new Quaternion())
  const pitched = new Vector3(0, 0, 1).applyQuaternion(composed)
  // Pitching a +Z offset about +X by a quarter turn sends it to -Y.
  assert.ok(pitched.distanceTo(new Vector3(0, -1, 0)) < 1e-6)
})
