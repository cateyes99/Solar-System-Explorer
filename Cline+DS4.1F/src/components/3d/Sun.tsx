import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute } from 'three'
import type { Mesh, MeshBasicMaterial, PointLight, Points, PointsMaterial, Sprite, SpriteMaterial } from 'three'
import { clock } from '../../utils/simulationClock'
import { getTexture } from '../../utils/textures'
import { createRandom } from '../../utils/random'
import { useSimulationStore } from '../../store/simulationStore'
import { audio } from '../../utils/audio'
import { HIGH_DETAIL_SPHERE } from './geometry'

/**
 * The Sun: a bright emissive surface, a layered corona, a point light that
 * illuminates the whole system, and occasional solar flares.
 *
 * Every third click on the Sun throws a flare — that is Easter egg number one.
 */

interface FlareState {
  /** Seconds remaining in the current burst; 0 when idle. */
  remaining: number
  duration: number
  strength: number
}

const FLARE_PARTICLES = 260

function createFlareGeometry(): BufferGeometry {
  const random = createRandom(31337)
  const directions = new Float32Array(FLARE_PARTICLES * 3)
  const speeds = new Float32Array(FLARE_PARTICLES)
  for (let i = 0; i < FLARE_PARTICLES; i += 1) {
    const theta = random() * Math.PI * 2
    const cosPhi = random() * 2 - 1
    const sinPhi = Math.sqrt(1 - cosPhi * cosPhi)
    directions[i * 3] = Math.cos(theta) * sinPhi
    directions[i * 3 + 1] = cosPhi
    directions[i * 3 + 2] = Math.sin(theta) * sinPhi
    speeds[i] = 0.55 + random() * 1.15
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(directions, 3))
  geometry.setAttribute('aDirection', new Float32BufferAttribute(directions, 3))
  geometry.setAttribute('aSpeed', new Float32BufferAttribute(speeds, 1))
  return geometry
}

interface SunProps {
  radius: number
  reducedMotion: boolean
  /** "What if the Sun disappeared?" — fades the light and the corona away. */
  extinguished: boolean
}

export function Sun({ radius, reducedMotion, extinguished }: SunProps) {
  const coreRef = useRef<Mesh>(null)
  const coreMaterialRef = useRef<MeshBasicMaterial>(null)
  const innerCoronaRef = useRef<Sprite>(null)
  const outerCoronaRef = useRef<Sprite>(null)
  const innerCoronaMaterialRef = useRef<SpriteMaterial>(null)
  const outerCoronaMaterialRef = useRef<SpriteMaterial>(null)
  const lightRef = useRef<PointLight>(null)
  const flareRef = useRef<Points>(null)
  const flareMaterialRef = useRef<PointsMaterial>(null)

  const flareId = useSimulationStore((state) => state.flareId)
  const registerSunClick = useSimulationStore((state) => state.registerSunClick)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const focusBody = useSimulationStore((state) => state.focusBody)
  const setHovered = useSimulationStore((state) => state.setHovered)

  /**
   * The scene's only real light. Its brightness is part of the look, never a
   * performance setting: when it was tied to the quality tier, every object in
   * the Solar System dimmed the moment the frame rate dipped, which reads as the
   * lighting "going out" rather than as the graphics getting cheaper.
   */
  const baseIntensity = 3.5
  const darkness = useRef(0)
  const flare = useRef<FlareState>({ remaining: 0, duration: 1, strength: 1 })
  const autoFlareTimer = useRef(26)
  const { gl } = useThree()

  const flareGeometry = useMemo(() => createFlareGeometry(), [])
  const sunTexture = getTexture('sun')

  // Every recorded flare (the Easter egg counter lives in the store) bursts here.
  useEffect(() => {
    if (flareId === 0) return
    flare.current = { remaining: 2.6, duration: 2.6, strength: 1 }
  }, [flareId])

  // Free the flare geometry when the Sun unmounts.
  useEffect(() => () => flareGeometry.dispose(), [flareGeometry])

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05)

    // --- Rotation and plasma shimmer --------------------------------------
    if (coreRef.current) {
      coreRef.current.rotation.y += (clock.lastFrameDays / 25.38) * Math.PI * 2
    }
    if (!reducedMotion) {
      sunTexture.offset.x = (sunTexture.offset.x + step * 0.0045) % 1
      const shimmer = 1 + Math.sin(performance.now() * 0.0009) * 0.012
      coreRef.current?.scale.setScalar(radius * shimmer)
    }

    // --- "What if the Sun disappeared?" -----------------------------------
    const targetDarkness = extinguished ? 1 : 0
    darkness.current += (targetDarkness - darkness.current) * Math.min(1, step * 0.55)
    const glow = 1 - darkness.current * 0.985
    if (coreMaterialRef.current) {
      coreMaterialRef.current.color.setRGB(2.1 * glow + 0.02, 1.85 * glow + 0.025, 1.45 * glow + 0.04)
    }
    if (lightRef.current) {
      lightRef.current.intensity = baseIntensity * (1 - darkness.current * 0.995)
    }
    if (innerCoronaMaterialRef.current) innerCoronaMaterialRef.current.opacity = 0.92 * (1 - darkness.current)
    if (outerCoronaMaterialRef.current) outerCoronaMaterialRef.current.opacity = 0.5 * (1 - darkness.current)

    // A gently breathing corona: alive, never distracting.
    if (!reducedMotion && !extinguished) {
      const breathe = 1 + Math.sin(performance.now() * 0.0006) * 0.03
      innerCoronaRef.current?.scale.set(radius * 3.1 * breathe, radius * 3.1 * breathe, 1)
      outerCoronaRef.current?.scale.set(radius * 6.4 * breathe, radius * 6.4 * breathe, 1)
    }

    // --- Unprompted micro-flares ------------------------------------------
    if (!reducedMotion && !extinguished && flare.current.remaining <= 0) {
      autoFlareTimer.current -= step
      if (autoFlareTimer.current <= 0) {
        autoFlareTimer.current = 26 + Math.random() * 34
        flare.current = { remaining: 1.9, duration: 1.9, strength: 0.4 }
      }
    }

    // --- Animate the flare burst ------------------------------------------
    const burst = flare.current
    const points = flareRef.current
    const flareMaterial = flareMaterialRef.current
    if (points && flareMaterial) {
      if (burst.remaining > 0) {
        burst.remaining -= step
        const progress = 1 - Math.max(burst.remaining, 0) / burst.duration
        const positions = points.geometry.getAttribute('position') as Float32BufferAttribute
        const directions = points.geometry.getAttribute('aDirection') as Float32BufferAttribute
        const speeds = points.geometry.getAttribute('aSpeed') as Float32BufferAttribute
        const reach = radius * (1 + progress * 3.4) * burst.strength
        for (let i = 0; i < positions.count; i += 1) {
          const factor = reach * speeds.getX(i) * (0.35 + progress)
          positions.setXYZ(i, directions.getX(i) * factor, directions.getY(i) * factor, directions.getZ(i) * factor)
        }
        positions.needsUpdate = true
        flareMaterial.opacity = Math.max(0, Math.sin(progress * Math.PI)) * 0.85 * burst.strength
        points.visible = true
      } else if (points.visible) {
        points.visible = false
      }
    }
  })

  return (
    <group>
      <mesh
        ref={coreRef}
        geometry={HIGH_DETAIL_SPHERE}
        scale={radius}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered('sun')
          gl.domElement.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(null)
          gl.domElement.style.cursor = 'grab'
        }}
        onClick={(event) => {
          event.stopPropagation()
          selectBody('sun')
          focusBody('sun', 'planet', 3.6)
          registerSunClick()
          audio.play('click')
        }}
      >
        <meshBasicMaterial ref={coreMaterialRef} map={sunTexture} toneMapped={false} color="#ffd9a0" />
      </mesh>

      <sprite ref={innerCoronaRef} scale={[radius * 3.1, radius * 3.1, 1]} frustumCulled={false}>
        <spriteMaterial
          ref={innerCoronaMaterialRef}
          map={getTexture('glow')}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
          opacity={0.92}
          toneMapped={false}
        />
      </sprite>

      <sprite ref={outerCoronaRef} scale={[radius * 6.4, radius * 6.4, 1]} frustumCulled={false}>
        <spriteMaterial
          ref={outerCoronaMaterialRef}
          map={getTexture('glow')}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
          opacity={0.5}
          toneMapped={false}
        />
      </sprite>

      <points ref={flareRef} geometry={flareGeometry} visible={false} frustumCulled={false}>
        <pointsMaterial
          ref={flareMaterialRef}
          map={getTexture('glow')}
          size={radius * 1.1}
          sizeAttenuation
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
          opacity={0}
          color="#ffd08a"
          toneMapped={false}
        />
      </points>

      {/* decay={0} keeps distant planets as readable as close ones, which is far
          friendlier for children than true inverse-square falloff. */}
      <pointLight ref={lightRef} color="#fff3dc" intensity={baseIntensity} distance={0} decay={0} />
    </group>
  )
}