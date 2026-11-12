import test from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import { cameraRayTo, rayBlockedBySphere } from '../src/utils/bodyRegistry.ts'

/**
 * The occlusion test behind the labels. Run with `npm test`.
 *
 * A DOM label is never depth-tested by the GPU, so a world that passes in front
 * of it — the Moon across South America — has to be caught by hand, and so does
 * a name that has slipped past the globe's own limb.
 */

/** Prepares a camera-to-point ray the way the label layers do. */
function rayTo(camera: Vector3, point: Vector3): { direction: Vector3; distance: number } {
  const direction = new Vector3()
  return { direction, distance: cameraRayTo(point, camera, direction) }
}

const CAMERA = new Vector3(0, 0, 10)
const POINT = new Vector3(0, 0, 0)

test('the ray is a unit vector and its length is the distance', () => {
  const { direction, distance } = rayTo(CAMERA, POINT)
  assert.equal(distance, 10)
  assert.deepEqual([direction.x, direction.y, direction.z], [0, 0, -1])
})

test('a body standing between the camera and the point blocks it', () => {
  const { direction, distance } = rayTo(CAMERA, POINT)
  const centre = new Vector3(0, 0, 5).sub(CAMERA)
  assert.equal(rayBlockedBySphere(direction, distance, centre, 1), true)
})

test('a body to one side of the ray does not block it', () => {
  const { direction, distance } = rayTo(CAMERA, POINT)
  const centre = new Vector3(3, 0, 5).sub(CAMERA)
  assert.equal(rayBlockedBySphere(direction, distance, centre, 1), false)
})

test('a body behind the camera does not block the point', () => {
  const { direction, distance } = rayTo(CAMERA, POINT)
  const centre = new Vector3(0, 0, 20).sub(CAMERA)
  assert.equal(rayBlockedBySphere(direction, distance, centre, 1), false)
})

test('a body beyond the point does not block it', () => {
  const { direction, distance } = rayTo(CAMERA, POINT)
  const centre = new Vector3(0, 0, -5).sub(CAMERA)
  assert.equal(rayBlockedBySphere(direction, distance, centre, 1), false)
})

test('the globe never blocks a name on its own near side', () => {
  // The property the whole cull leans on: a point on the visible face of a
  // sphere is never reported as behind that sphere, however close the camera is.
  // (It is what lets the globe stay in the occluder list, so that a camera flown
  // in close still has its rim handled.)
  const radius = 1
  for (const cameraDistance of [1.5, 2, 3, 6.9, 20]) {
    const camera = new Vector3(cameraDistance, 0, 0)
    const centre = new Vector3(0, 0, 0).sub(camera)
    const limb = Math.acos(radius / cameraDistance)
    for (const fraction of [0, 0.4, 0.8, 0.98]) {
      const theta = limb * fraction
      const point = new Vector3(Math.cos(theta), Math.sin(theta), 0).multiplyScalar(radius * 1.004)
      const { direction, distance } = rayTo(camera, point)
      assert.equal(
        rayBlockedBySphere(direction, distance, centre, radius),
        false,
        `blocked at camera ${cameraDistance}, theta ${theta.toFixed(3)}`,
      )
    }
  }
})

test('the globe does block a name that has slipped past the limb', () => {
  const radius = 1
  const camera = new Vector3(3, 0, 0)
  const centre = new Vector3(0, 0, 0).sub(camera)
  const theta = Math.acos(radius / camera.length()) + 0.15
  const point = new Vector3(Math.cos(theta), Math.sin(theta), 0).multiplyScalar(radius * 1.004)
  const { direction, distance } = rayTo(camera, point)
  assert.equal(rayBlockedBySphere(direction, distance, centre, radius), true)
})

test('a point at the camera has no ray to test', () => {
  const direction = new Vector3()
  assert.equal(cameraRayTo(CAMERA, CAMERA, direction), 0)
})
