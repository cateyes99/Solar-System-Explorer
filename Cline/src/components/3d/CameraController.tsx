import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useSimulation } from '../../store/simulationStore'
import { getBodyObject } from '../../utils/registry'
import { getLayout } from '../../utils/scale'
import type { BodyId } from '../../types'

const DEFAULT_SYSTEM_POS = new THREE.Vector3(0, 52, 96)
const INTRO_POS = new THREE.Vector3(0, 165, 265)
const tmpTarget = new THREE.Vector3()
const tmpOffset = new THREE.Vector3()
const tmpDir = new THREE.Vector3()
const tmpQuat = new THREE.Quaternion()

function bodyRadius(id: BodyId): number {
  const { scaleMode, customScale } = useSimulation.getState()
  const layout = getLayout(scaleMode, customScale)
  if (id === 'sun') return layout.sunRadius
  if (id === 'moon') return layout.moonRadius()
  return layout.planetRadius(id)
}

/**
 * Cinematic orbit camera. Tracks the focused body every frame, eases toward
 * desired positions with damping (never teleports), and supports:
 * overview / focus / follow / spacecraft-chase / surprise viewpoints.
 */
export function CameraController(): JSX.Element {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((s) => s.camera)
  const desiredCamPos = useRef(new THREE.Vector3().copy(INTRO_POS))
  const transitionUntil = useRef(0)

  const focus = useSimulation((s) => s.focus)
  const poseSeed = useSimulation((s) => s.cameraPoseSeed)

  // Intro sweep on load (skipped when reduce-motion is on).
  useEffect(() => {
    const reduce = useSimulation.getState().reduceMotion
    camera.position.copy(reduce ? DEFAULT_SYSTEM_POS : INTRO_POS)
    desiredCamPos.current.copy(DEFAULT_SYSTEM_POS)
    transitionUntil.current = performance.now() + (reduce ? 0 : 3400)
  }, [camera])

  // Focus changes → compute a nice approach and start a cinematic transition.
  useEffect(() => {
    const store = useSimulation.getState()
    const now = performance.now()
    const duration = store.reduceMotion ? 400 : 2600
    if (focus.mode === 'system') {
      desiredCamPos.current.copy(DEFAULT_SYSTEM_POS)
      transitionUntil.current = now + duration
    } else if (focus.mode === 'body' || focus.mode === 'follow') {
      if (focus.bodyId) {
        const obj = getBodyObject(focus.bodyId)
        if (obj) {
          obj.getWorldPosition(tmpTarget)
          const r = bodyRadius(focus.bodyId)
          const dist = focus.distance ?? Math.max(r * 6.5, r + 2.5)
          tmpOffset.copy(camera.position).sub(tmpTarget)
          if (tmpOffset.lengthSq() < 1e-4) tmpOffset.set(0, 0.4, 1)
          tmpOffset.normalize()
          tmpOffset.y = Math.max(tmpOffset.y, 0.3)
          tmpOffset.normalize().multiplyScalar(dist)
          desiredCamPos.current.copy(tmpTarget).add(tmpOffset)
          transitionUntil.current = now + duration
        }
      }
    }
  }, [focus, camera])

  // "Surprise me" → a random pretty viewpoint over the whole system.
  useEffect(() => {
    if (poseSeed === 0) return
    const store = useSimulation.getState()
    const angle = Math.random() * Math.PI * 2
    const height = 18 + Math.random() * 70
    const dist = 55 + Math.random() * 110
    desiredCamPos.current.set(Math.cos(angle) * dist, height, Math.sin(angle) * dist)
    transitionUntil.current = performance.now() + (store.reduceMotion ? 400 : 2600)
  }, [poseSeed])

  useFrame((_, dt) => {
    const c = controls.current
    if (!c) return
    const store = useSimulation.getState()
    const f = store.focus
    const lambda = store.reduceMotion ? 12 : 3.2

    if (f.mode === 'spacecraft') {
      // Chase camera behind the craft.
      const obj = getBodyObject('spacecraft')
      if (obj) {
        obj.getWorldPosition(tmpTarget)
        obj.getWorldQuaternion(tmpQuat)
        tmpDir.set(0, 0, 1).applyQuaternion(tmpQuat) // backwards vector
        tmpOffset.copy(tmpTarget).addScaledVector(tmpDir, 7).add(tmpDir.set(0, 2.4, 0))
        camera.position.x = THREE.MathUtils.damp(camera.position.x, tmpOffset.x, 4, dt)
        camera.position.y = THREE.MathUtils.damp(camera.position.y, tmpOffset.y, 4, dt)
        camera.position.z = THREE.MathUtils.damp(camera.position.z, tmpOffset.z, 4, dt)
      }
    } else {
      let tracking = false
      if (f.mode !== 'system' && f.bodyId) {
        const obj = getBodyObject(f.bodyId)
        if (obj) {
          obj.getWorldPosition(tmpTarget)
          tracking = true
        }
      }
      if (!tracking) tmpTarget.set(0, 0, 0)

      c.target.x = THREE.MathUtils.damp(c.target.x, tmpTarget.x, lambda, dt)
      c.target.y = THREE.MathUtils.damp(c.target.y, tmpTarget.y, lambda, dt)
      c.target.z = THREE.MathUtils.damp(c.target.z, tmpTarget.z, lambda, dt)

      const now = performance.now()
      if (now < transitionUntil.current) {
        const moveLambda = store.reduceMotion ? 10 : 2.2
        camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredCamPos.current.x, moveLambda, dt)
        camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredCamPos.current.y, moveLambda, dt)
        camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredCamPos.current.z, moveLambda, dt)
      }

      c.minDistance =
        f.mode !== 'system' && f.bodyId ? bodyRadius(f.bodyId) * 1.6 + 0.2 : 3
    }

    c.maxDistance = 420
    c.update()
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.55}
      panSpeed={0.7}
      zoomSpeed={0.8}
      minDistance={3}
      maxDistance={420}
    />
  )
}
