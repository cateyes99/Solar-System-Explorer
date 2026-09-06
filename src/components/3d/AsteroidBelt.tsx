import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSceneLayout } from '../../hooks/useSceneLayout'
import { TAU, totalDaysSinceJ2000 } from '../../utils/astronomy'
import { mulberry32 } from '../../utils/noise'

const dummy = new THREE.Object3D()

function fillBelt(mesh: THREE.InstancedMesh, inner: number, outer: number, seed: number, count: number): void {
  const rnd = mulberry32(seed)
  for (let i = 0; i < count; i++) {
    const t = (rnd() + rnd()) / 2 // bias toward the middle of the belt
    const r = inner + (outer - inner) * t
    const a = rnd() * TAU
    const y = (rnd() - 0.5) * (rnd() - 0.5) * 5
    const s = 0.3 + rnd() * rnd() * 1.6
    dummy.position.set(Math.cos(a) * r, y, -Math.sin(a) * r)
    dummy.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI)
    dummy.scale.setScalar(s)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
}

/** The asteroid belt: two instanced sub-belts rotating at slightly different speeds. */
export function AsteroidBelt(): JSX.Element {
  const layout = useSceneLayout()
  const innerRef = useRef<THREE.InstancedMesh>(null)
  const outerRef = useRef<THREE.InstancedMesh>(null)

  const innerGeo = useMemo(() => new THREE.IcosahedronGeometry(0.5, 0), [])
  const outerGeo = useMemo(() => new THREE.DodecahedronGeometry(0.45, 0), [])
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#8a8177',
        roughness: 1,
        metalness: 0,
        flatShading: true,
      }),
    [],
  )

  useEffect(() => {
    if (innerRef.current) fillBelt(innerRef.current, layout.beltInner, layout.beltOuter * 0.92, 111, 950)
    if (outerRef.current) fillBelt(outerRef.current, layout.beltInner * 1.06, layout.beltOuter, 222, 750)
  }, [layout])

  useFrame(() => {
    const days = totalDaysSinceJ2000()
    if (innerRef.current) innerRef.current.rotation.y = (TAU * days) / 1900
    if (outerRef.current) outerRef.current.rotation.y = (TAU * days) / 2500
  })

  return (
    <group>
      <instancedMesh ref={innerRef} args={[innerGeo, material, 950]} frustumCulled={false} />
      <instancedMesh ref={outerRef} args={[outerGeo, material, 750]} frustumCulled={false} />
    </group>
  )
}
