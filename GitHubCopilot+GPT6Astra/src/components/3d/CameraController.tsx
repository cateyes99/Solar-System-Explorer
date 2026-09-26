import { useEffect, useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, Vector3 } from 'three'
import type { OrbitControls as Controls } from 'three-stdlib'
import { useSimulation } from '../../store/simulationStore'
import { orbitFor, positionFor, radiusFor } from '../../utils/astronomy'

export function CameraController() {
  const controls = useRef<Controls>(null)
  const moving = useRef(true)
  const lastTarget = useRef(new Vector3())
  const target = useRef(new Vector3())
  const desired = useRef(new Vector3())
  const revision = useSimulation(state => state.cameraRevision)
  const scale = useSimulation(state => state.scale)
  const spacing = useSimulation(state => state.spacing)
  const selected = useSimulation(state => state.selected)
  const mode = useSimulation(state => state.cameraMode)
  const tourPaused = useSimulation(state => state.tourPaused)
  const size = useSimulation(state => state.size)
  const { camera, size: viewport, gl } = useThree()
  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return
    if (viewport.width <= 800 && selected && mode !== 'system') camera.setViewOffset(viewport.width, viewport.height, 0, viewport.height * .3, viewport.width, viewport.height)
    else camera.clearViewOffset()
  }, [camera, selected, mode, viewport.width, viewport.height])
  useEffect(() => {
    moving.current = true
    const state = useSimulation.getState()
    lastTarget.current.set(...(state.selected && state.cameraMode !== 'system' ? positionFor(state.selected, state.days, state.scale, state.spacing, state.size) : [0, 0, 0] as [number, number, number]))
  }, [revision, scale, spacing, selected, mode, size, tourPaused, viewport.width, viewport.height])
  useFrame((_, delta) => {
    const control = controls.current
    if (!control) return
    const state = useSimulation.getState()
    if (state.tour !== null && state.tourPaused) return
    const focused = state.selected && state.cameraMode !== 'system'
    if (focused) {
      target.current.set(...positionFor(state.selected!, state.days, state.scale, state.spacing, state.size))
    } else target.current.set(0, 0, 0)
    if (focused && (moving.current || state.cameraMode === 'follow')) {
      const shift = target.current.clone().sub(lastTarget.current)
      camera.position.add(shift)
      control.target.add(shift)
    }
    if (moving.current) {
      const radius = focused ? radiusFor(state.selected!, state.scale, state.size) : orbitFor('neptune', state.scale, state.spacing)
      const aspect = viewport.width / viewport.height
      const distance = focused ? Math.max(radius * (viewport.width <= 800 ? 12 : state.selected === 'saturn' ? 7 : 5.8), 3) : radius * Math.max(1.65, 1.7 / aspect)
      desired.current.copy(target.current).add(new Vector3(distance * .28, distance * (focused ? .32 : .68), distance * .93))
      const easing = state.reducedMotion ? .72 : 1 - Math.exp(-delta * 2.6)
      camera.position.lerp(desired.current, easing)
      control.target.lerp(target.current, easing)
      if (camera.position.distanceTo(desired.current) < .08 && control.target.distanceTo(target.current) < .08) moving.current = false
    } else if (state.cameraMode === 'follow' && state.selected && !state.tourPaused) {
      control.target.copy(target.current)
    }
    lastTarget.current.copy(target.current)
    gl.domElement.dataset.cameraMoving = String(moving.current)
    control.update()
  })
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.07} minDistance={.6} maxDistance={1000} maxPolarAngle={Math.PI * .94} onStart={() => { moving.current = false }} />
}