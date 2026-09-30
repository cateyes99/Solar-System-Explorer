import { useEffect } from 'react'
import { AdaptiveDpr } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useAppStore } from '../../store/useAppStore'
import { bodyPosition, setBodyRadius } from '../../store/registry'
import { createSpaceBackdrop } from '../../utils/textures'
import { StarField } from './StarField'
import { SolarSystemScene } from './SolarSystemScene'
import { CameraRig } from './CameraRig'
import { Effects } from './Effects'
import { LessonScene } from './lessons/LessonScene'
import { WhatIfScene } from './whatIf/WhatIfScenes'

/** Deep-space background, painted once and shared by every mode. */
function SpaceBackdrop() {
  const scene = useThree((state) => state.scene)
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    const backdrop = createSpaceBackdrop()
    const previous = scene.background
    scene.background = backdrop
    scene.backgroundIntensity = 1.5
    gl.setClearColor('#04060f', 1)
    return () => {
      scene.background = previous
      backdrop.dispose()
    }
  }, [scene, gl])

  return null
}

const WHAT_IF_FRAMING: Record<string, number> = {
  'two-moons': 30,
  'earth-jupiter': 42,
  'no-sun': 62,
  'no-rotation': 20,
}

/**
 * Chooses which scene to show. Only one mode is mounted at a time so lessons
 * and scenarios never have to coexist with the full orrery, and the shared
 * camera rig keeps working across all of them.
 */
export function SceneRoot() {
  const sceneMode = useAppStore((s) => s.sceneMode)
  const distanceExponent = useAppStore((s) => s.scale.distanceExponent)
  const reducedMotion = useAppStore((s) => s.reducedMotion)
  const quality = useAppStore((s) => s.quality)
  const whatIfId = useAppStore((s) => s.whatIfId)

  useEffect(() => {
    if (!whatIfId) return
    bodyPosition('whatif-focus').set(0, 0, 0)
    setBodyRadius('whatif-focus', 4)
    useAppStore.getState().setCameraOverride({
      id: 'whatif-focus',
      distance: WHAT_IF_FRAMING[whatIfId] ?? 30,
    })
    return () => useAppStore.getState().setCameraOverride(null)
  }, [whatIfId])

  const starCount = reducedMotion || quality === 'performance' ? 4200 : 9500

  return (
    <>
      <SpaceBackdrop />
      <StarField count={starCount} />
      {sceneMode === 'system' && <SolarSystemScene />}
      {sceneMode === 'lesson' && <LessonScene />}
      {sceneMode === 'whatif' && whatIfId && <WhatIfScene scenario={whatIfId} />}
      <CameraRig distanceExponent={sceneMode === 'system' ? distanceExponent : 1} />
      <Effects />
      <AdaptiveDpr pixelated={false} />
    </>
  )
}