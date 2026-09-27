import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Group, Matrix4, MeshBasicMaterial, SphereGeometry, Vector3 } from 'three'
import { MakeTime } from 'astronomy-engine'
import { DAY_MS, EPOCH } from '../../data/planets'
import { useSimulation } from '../../store/simulationStore'
import { cometActivity, halleyVectorAt } from '../../utils/halley'

export function NucleusGeometry() {
  const [geometry] = useState(() => {
    const shape = new SphereGeometry(1, 80, 48)
    const positions = shape.attributes.position
    for (let index = 0; index < positions.count; index++) {
      const horizontal = positions.getX(index)
      const vertical = positions.getY(index)
      const depth = positions.getZ(index)
      const relief = 1 + .06 * Math.sin(horizontal * 13 + vertical * 8) * Math.sin(depth * 17 - vertical * 9)
      const waist = 1 - .15 * Math.exp(-(((horizontal + .15) / .3) ** 2))
      positions.setXYZ(index, horizontal * relief, vertical * (8 / 15) * relief * waist, depth * (8 / 15) * relief * waist * (1 + .1 * horizontal))
    }
    shape.computeVertexNormals()
    return shape
  })
  useEffect(() => () => geometry.dispose(), [geometry])
  return <primitive object={geometry} attach="geometry" />
}

function Tail({ dust }: { dust: boolean }) {
  const [geometry] = useState(() => {
    const shape = new BufferGeometry()
    const positions = new Float32Array(1800 * 3)
    for (let index = 0; index < 1800; index++) {
      const distance = (index + .5) / 1800
      const angle = index * 2.399963
      const spread = Math.sqrt(((index * 73) % 1799) / 1799) * (dust ? .16 : .035) * Math.sqrt(distance)
      positions.set([Math.cos(angle) * spread + (dust ? .32 * distance * distance : 0), Math.sin(angle) * spread, distance], index * 3)
    }
    shape.setAttribute('position', new BufferAttribute(positions, 3))
    return shape
  })
  useEffect(() => () => geometry.dispose(), [geometry])
  return <points geometry={geometry} frustumCulled={false}>
    <shaderMaterial transparent depthWrite={false} blending={AdditiveBlending}
      uniforms={{ tint: { value: new Vector3(...(dust ? [.85, .8, .67] : [.35, .65, 1])) } }}
      vertexShader={`varying float fade; void main(){fade=pow(1.0-position.z,1.7); vec4 point=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*point;gl_PointSize=clamp(110.0/-point.z,2.0,18.0);}`}
      fragmentShader={`uniform vec3 tint; varying float fade; void main(){float soft=1.0-smoothstep(0.0,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(tint,soft*fade*.28);}`} />
  </points>
}

export function CometActivity({ radius }: { radius: number }) {
  const group = useRef<Group>(null)
  const tails = useRef<Group>(null)
  const coma = useRef<MeshBasicMaterial>(null)
  useFrame(() => {
    if (!group.current || !tails.current) return
    const state = useSimulation.getState()
    const date = MakeTime(new Date(EPOCH + state.days * DAY_MS)).tt + 2451545
    const vector = halleyVectorAt(date)
    const activity = cometActivity(Math.hypot(...vector))
    group.current.visible = activity > .001
    if (!group.current.visible) return
    const next = halleyVectorAt(date + .01)
    const outward = new Vector3(vector[0], vector[2], -vector[1]).normalize()
    const trailing = new Vector3(vector[0] - next[0], vector[2] - next[2], next[1] - vector[1])
    trailing.addScaledVector(outward, -trailing.dot(outward)).normalize()
    const vertical = new Vector3().crossVectors(outward, trailing).normalize()
    group.current.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(trailing, vertical, outward))
    if (coma.current) coma.current.opacity = .055 * activity
    tails.current.scale.setScalar(radius * 45 * activity)
  })
  return <group ref={group}>
    <mesh scale={[radius * 1.7, radius * 1.7, radius * 1.7]}>
      <sphereGeometry args={[1, 32, 20]} />
      <meshBasicMaterial ref={coma} color="#a9c9bd" transparent opacity={.055} depthWrite={false} />
    </mesh>
    <group ref={tails}><Tail dust={false} /><group scale={[1, 1, .72]}><Tail dust /></group></group>
  </group>
}