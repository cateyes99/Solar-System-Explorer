import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSimulation } from '../../store/simulationStore'
import { getGlowTexture } from '../../utils/textures'
import { mulberry32 } from '../../utils/noise'

const COUNT = 90

interface SunFlareProps {
  radius: number
}

/** Easter-egg particle burst — fired by clicking the Sun three times. */
export function SunFlare({ radius }: SunFlareProps): JSX.Element {
  const points = useRef<THREE.Points>(null)
  const flash = useRef<THREE.Sprite>(null)
  const life = useRef(1)
  const flareKey = useSimulation((s) => s.sunFlareKey)

  const glow = useMemo(
    () => getGlowTexture('rgba(255,240,180,0.9)', 'rgba(255,150,40,0.4)', 'rgba(255,90,10,0)'),
    [],
  )
  const directions = useMemo(() => {
    const rnd = mulberry32(1234)
    const arr = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const u = rnd() * Math.PI * 2
      const z = rnd() * 2 - 1
      const r = Math.sqrt(1 - z * z)
      const speed = 0.6 + rnd() * 1.1
      arr[i * 3] = Math.cos(u) * r * speed
      arr[i * 3 + 1] = z * speed
      arr[i * 3 + 2] = Math.sin(u) * r * speed
    }
    return arr
  }, [])
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3))
    return g
  }, [])
  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 1,
        map: glow,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: new THREE.Color('#ffcf7d'),
      }),
    [glow],
  )
  const flashMat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: glow,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0,
      }),
    [glow],
  )

  useEffect(() => {
    if (flareKey > 0) life.current = 0
  }, [flareKey])

  useFrame((_, dt) => {
    const p = points.current
    if (!p) return
    if (life.current >= 1) {
      p.visible = false
      if (flash.current) flash.current.visible = false
      return
    }
    life.current = Math.min(1, life.current + dt / 1.4)
    const t = life.current
    p.visible = true
    const pos = p.geometry.getAttribute('position') as THREE.BufferAttribute
    const dist = radius * (1.05 + t * 7)
    for (let i = 0; i < COUNT; i++) {
      pos.setXYZ(i, directions[i * 3] * dist, directions[i * 3 + 1] * dist, directions[i * 3 + 2] * dist)
    }
    pos.needsUpdate = true
    material.opacity = (1 - t) * 0.9
    material.size = radius * (0.4 + t * 1.1)
    if (flash.current) {
      flash.current.visible = true
      flashMat.opacity = (1 - t) * 0.85
      const s = radius * (2 + t * 10)
      flash.current.scale.set(s, s, 1)
    }
  })

  return (
    <>
      <points ref={points} geometry={geometry} material={material} visible={false} frustumCulled={false} />
      <sprite ref={flash} material={flashMat} visible={false} />
    </>
  )
}
