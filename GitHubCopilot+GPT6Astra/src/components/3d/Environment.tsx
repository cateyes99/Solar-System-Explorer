import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { BufferAttribute, Color, InstancedMesh, Object3D, Points, ShaderMaterial } from 'three'
import { useSimulation } from '../../store/simulationStore'
import { bodyById, planets, type BodyId } from '../../data/planets'
import { orbitFor, orbitPathFor, type ScaleMode } from '../../utils/astronomy'

export function StarField() {
  const points = useRef<Points>(null)
  const shader = useRef<ShaderMaterial>(null)
  const [attributes] = useState(() => {
    const positions = new Float32Array(3600 * 3)
    const colors = new Float32Array(3600 * 3)
    const sizes = new Float32Array(3600)
    const color = new Color()
    for (let index = 0; index < 3600; index++) {
      const angle = Math.random() * Math.PI * 2
      const vertical = Math.acos(Math.random() * 2 - 1)
      const distance = 180 + Math.random() * 300
      positions.set([Math.sin(vertical) * Math.cos(angle) * distance, Math.cos(vertical) * distance, Math.sin(vertical) * Math.sin(angle) * distance], index * 3)
      color.set(['#dbe4e9', '#8ca7bc', '#e4cab0', '#b7c8ce'][index % 4])
      colors.set([color.r, color.g, color.b], index * 3)
      sizes[index] = .8 + Math.random() * 2
    }
    return { position: new BufferAttribute(positions, 3), color: new BufferAttribute(colors, 3), size: new BufferAttribute(sizes, 1) }
  })
  useFrame((_, delta) => {
    if (!useSimulation.getState().reducedMotion && shader.current) shader.current.uniforms.time.value += delta
  })
  return <points ref={points} frustumCulled={false}>
    <bufferGeometry attributes={attributes} />
    <shaderMaterial ref={shader} transparent depthWrite={false} uniforms={{ time: { value: 0 } }} vertexShader={`attribute float size; varying vec3 starColor; varying float sparkle;uniform float time;
      void main(){starColor=color;sparkle=.6+.25*sin(time*.45+position.x);vec4 point=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*point;gl_PointSize=size;}`} fragmentShader={`varying vec3 starColor;varying float sparkle;void main(){float distanceToCenter=length(gl_PointCoord-.5);gl_FragColor=vec4(starColor,(1.0-smoothstep(.05,.5,distanceToCenter))*sparkle);}`} vertexColors />
  </points>
}

function OrbitPath({ id, scale, spacing, size }: { id: Exclude<BodyId, 'sun' | 'moon'>; scale: ScaleMode; spacing: number; size: number }) {
  const interval = id === 'halley' ? 16 : bodyById[id].year / 4
  const epoch = useSimulation(state => Math.floor(state.days / interval))
  const points = orbitPathFor(id, (epoch + .5) * interval, scale, spacing, size)
  return <Line points={points} color={id === 'halley' ? '#9fbfba' : '#647982'} transparent opacity={id === 'halley' ? .5 : .3} lineWidth={1} depthWrite={false} />
}

export function OrbitPaths() {
  const scale = useSimulation(state => state.scale)
  const spacing = useSimulation(state => state.spacing)
  const size = useSimulation(state => state.size)
  const visible = useSimulation(state => state.orbits)
  return <group visible={visible}>
    {planets.map(body => <OrbitPath key={body.id} id={body.id as Exclude<BodyId, 'sun' | 'moon'>} scale={scale} spacing={spacing} size={size} />)}
    <OrbitPath id="halley" scale={scale} spacing={spacing} size={size} />
  </group>
}

export function AsteroidBelt() {
  const mesh = useRef<InstancedMesh>(null)
  const scale = useSimulation(state => state.scale)
  const spacing = useSimulation(state => state.spacing)
  useEffect(() => {
    if (!mesh.current) return
    const object = new Object3D()
    const inner = orbitFor('mars', scale, spacing)
    const outer = orbitFor('jupiter', scale, spacing)
    for (let index = 0; index < 1100; index++) {
      const angle = index * 2.399963
      const radius = inner + (outer - inner) * (.25 + Math.random() * .45)
      object.position.set(Math.cos(angle) * radius, (Math.random() - .5) * .7, Math.sin(angle) * radius)
      object.scale.setScalar(.018 + Math.random() * .065)
      object.rotation.set(index, index * .7, index * 1.2)
      object.updateMatrix()
      mesh.current.setMatrixAt(index, object.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [scale, spacing])
  useFrame((_, delta) => {
    const state = useSimulation.getState()
    if (mesh.current && !state.reducedMotion && !state.paused) mesh.current.rotation.y += delta * state.speed * .0004
  })
  return <instancedMesh ref={mesh} args={[undefined, undefined, 1100]}><icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#9c9380" roughness={1} /></instancedMesh>
}