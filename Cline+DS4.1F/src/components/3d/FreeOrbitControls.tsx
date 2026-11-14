import { forwardRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'
import { FreeOrbitControls as FreeOrbitControlsImpl } from '../../utils/freeOrbitControls'
import type { FreeOrbitControlsOptions } from '../../utils/freeOrbitControls'

export interface FreeOrbitControlsProps extends FreeOrbitControlsOptions {
  onStart?: () => void
  onEnd?: () => void
  onChange?: () => void
}

/**
 * The react-three-fiber wrapper around {@link FreeOrbitControlsImpl}.
 *
 * It mirrors the shape of drei's `OrbitControls`: it drives the camera from a
 * `useFrame` at priority -1 (so the camera is placed before the follow and chase
 * logic read it) and exposes the controller through a ref. `enabled` and
 * `enableZoom` are deliberately *not* props — the camera controller toggles them
 * imperatively during flights and while auto-framing, exactly as it did with
 * `OrbitControls`.
 */
export const FreeOrbitControls = forwardRef<FreeOrbitControlsImpl, FreeOrbitControlsProps>(
  function FreeOrbitControls({ onStart, onEnd, onChange, ...options }, ref) {
    const camera = useThree((state) => state.camera)
    const gl = useThree((state) => state.gl)
    const events = useThree((state) => state.events)
    const invalidate = useThree((state) => state.invalidate)

    const domElement = events.connected ?? gl.domElement

    const controls = useMemo(
      () => new FreeOrbitControlsImpl(camera as PerspectiveCamera),
      [camera],
    )

    useFrame(() => {
      if (controls.enabled) controls.update()
    }, -1)

    useEffect(() => {
      controls.connect(domElement)
      return () => controls.dispose()
    }, [controls, domElement])

    // The configuration is static in practice; it is copied onto the instance
    // whenever it changes so the store's tumble switch takes effect live.
    useEffect(() => {
      const {
        enableRotate,
        enablePan,
        enableDamping,
        dampingFactor,
        rotateSpeed,
        zoomSpeed,
        panSpeed,
        minDistance,
        maxDistance,
        screenSpacePanning,
        freeTumble,
      } = options
      if (enableRotate !== undefined) controls.enableRotate = enableRotate
      if (enablePan !== undefined) controls.enablePan = enablePan
      if (enableDamping !== undefined) controls.enableDamping = enableDamping
      if (dampingFactor !== undefined) controls.dampingFactor = dampingFactor
      if (rotateSpeed !== undefined) controls.rotateSpeed = rotateSpeed
      if (zoomSpeed !== undefined) controls.zoomSpeed = zoomSpeed
      if (panSpeed !== undefined) controls.panSpeed = panSpeed
      if (minDistance !== undefined) controls.minDistance = minDistance
      if (maxDistance !== undefined) controls.maxDistance = maxDistance
      if (screenSpacePanning !== undefined) controls.screenSpacePanning = screenSpacePanning
      if (freeTumble !== undefined) controls.freeTumble = freeTumble
    }, [controls, options])

    useEffect(() => {
      const change = (): void => {
        invalidate()
        onChange?.()
      }
      if (onStart) controls.addEventListener('start', onStart)
      if (onEnd) controls.addEventListener('end', onEnd)
      controls.addEventListener('change', change)
      return () => {
        if (onStart) controls.removeEventListener('start', onStart)
        if (onEnd) controls.removeEventListener('end', onEnd)
        controls.removeEventListener('change', change)
      }
    }, [controls, onStart, onEnd, onChange, invalidate])

    return <primitive object={controls} ref={ref} />
  },
)
