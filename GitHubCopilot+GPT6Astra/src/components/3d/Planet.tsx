import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BackSide, Group, Mesh, ShaderMaterial, Sprite, SRGBColorSpace, Texture, TextureLoader, Vector3 } from 'three'
import type { CelestialBody } from '../../data/planets'
import { useSimulation } from '../../store/simulationStore'
import { positionFor, radiusFor } from '../../utils/astronomy'
import { makeClouds, makeGlow, makeSurface } from '../../utils/textures'
import { CometActivity, NucleusGeometry } from './Comet'

const sunVertex = `varying vec3 vPosition;
void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`
const sunFragment = `uniform float time; varying vec3 vPosition;
float hash(vec3 point){return fract(sin(dot(point,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 point){vec3 cell=floor(point);vec3 rest=fract(point);rest=rest*rest*(3.0-2.0*rest);
return mix(mix(mix(hash(cell),hash(cell+vec3(1,0,0)),rest.x),mix(hash(cell+vec3(0,1,0)),hash(cell+vec3(1,1,0)),rest.x),rest.y),mix(mix(hash(cell+vec3(0,0,1)),hash(cell+vec3(1,0,1)),rest.x),mix(hash(cell+vec3(0,1,1)),hash(cell+vec3(1,1,1)),rest.x),rest.y),rest.z);}
void main(){vec3 point=vPosition*3.0+vec3(time*.06);float granules=noise(point*7.0)*.5+noise(point*16.0)*.3+noise(point*35.0)*.2;
vec3 color=mix(vec3(1.0,.19,.018),vec3(1.0,.86,.35),granules);gl_FragColor=vec4(color*1.45,1.0);}`
const atmosphereVertex = `varying vec3 normalView;varying vec3 viewDirection;
void main(){vec4 viewPosition=modelViewMatrix*vec4(position,1.0);normalView=normalize(normalMatrix*normal);viewDirection=normalize(-viewPosition.xyz);gl_Position=projectionMatrix*viewPosition;}`
const atmosphereFragment = `uniform vec3 glowColor; varying vec3 normalView;varying vec3 viewDirection;
void main(){float rim=pow(1.0-abs(dot(normalize(normalView),normalize(viewDirection))),3.5);gl_FragColor=vec4(glowColor,rim*.38);}`

function Atmosphere({ radius, color }: { radius: number; color: [number, number, number] }) {
  return <mesh scale={radius * 1.055}>
    <sphereGeometry args={[1, 40, 24]} />
    <shaderMaterial vertexShader={atmosphereVertex} fragmentShader={atmosphereFragment} uniforms={{ glowColor: { value: color } }} transparent side={BackSide} blending={AdditiveBlending} depthWrite={false} />
  </mesh>
}

function Rings({ radius }: { radius: number }) {
  return <group rotation={[Math.PI / 2, 0, 0]}>
    {Array.from({ length: 12 }, (_, index) => <mesh key={index}>
      <ringGeometry args={[radius * (1.35 + index * .087), radius * (1.42 + index * .087), 128]} />
      <meshStandardMaterial color={index % 3 === 0 ? '#8c8066' : '#e5d3aa'} transparent opacity={index === 7 ? .14 : .7} side={2} roughness={1} />
    </mesh>)}
  </group>
}

export function Planet({ body }: { body: CelestialBody }) {
  const group = useRef<Group>(null)
  const surface = useRef<Mesh>(null)
  const sun = useRef<ShaderMaterial>(null)
  const cloudsMesh = useRef<Mesh>(null)
  const secondMoon = useRef<Mesh>(null)
  const glow = useRef<Sprite>(null)
  const [hovered, setHovered] = useState(false)
  const [surfaceMap, setSurfaceMap] = useState<Texture>(() => makeSurface(body.id))
  const [cloudMap] = useState(() => body.id === 'earth' ? makeClouds() : null)
  const [glowMap] = useState(() => body.id === 'sun' ? makeGlow() : null)
  const label = useRef<HTMLElement | null>(null)
  const projected = useRef(new Vector3())
  const scale = useSimulation(state => state.scale)
  const size = useSimulation(state => state.size)
  const experiment = useSimulation(state => state.experiment)
  const [flare, setFlare] = useState(0)
  const clickCount = useRef(0)
  const radius = radiusFor(body.id === 'earth' && experiment === 'giant-earth' ? 'jupiter' : body.id, scale, size)

  useEffect(() => { label.current = document.getElementById(`scene-label-${body.id}`) }, [body.id])

  useEffect(() => {
    if (body.id !== 'earth') return
    let active = true
    const loaded = new TextureLoader().load('/textures/earth.jpg', texture => {
      if (!active) { texture.dispose(); return }
      texture.colorSpace = SRGBColorSpace
      texture.anisotropy = 4
      setSurfaceMap(texture)
    }, undefined, () => undefined)
    return () => { active = false; loaded.dispose() }
  }, [body.id])
  useEffect(() => () => surfaceMap.dispose(), [surfaceMap])
  useEffect(() => () => { cloudMap?.dispose(); glowMap?.dispose() }, [cloudMap, glowMap])

  useFrame((state, delta) => {
    const simulation = useSimulation.getState()
    if (group.current) group.current.position.set(...positionFor(body.id, simulation.days, simulation.scale, simulation.spacing, simulation.size))
    if (label.current && group.current) {
      projected.current.copy(group.current.position).add(new Vector3(0, radius + .5, 0)).project(state.camera)
      const screen = projected.current
      const visible = (simulation.labels || hovered || simulation.selected === body.id) && screen.z < 1 && Math.abs(screen.x) < .96 && Math.abs(screen.y) < .9
      label.current.style.display = visible ? 'flex' : 'none'
      label.current.style.transform = `translate(${(screen.x + 1) * state.size.width / 2}px,${(-screen.y + 1) * state.size.height / 2}px) translate(-50%, -100%)`
      label.current.dataset.hovered = String(hovered)
      label.current.style.opacity = String(Math.max(.25, Math.min(1, 1.3 - state.camera.position.distanceTo(group.current.position) / 350)))
    }
    if (secondMoon.current) secondMoon.current.position.set(Math.cos(simulation.days * .15) * radius * 3.8, .3, -Math.sin(simulation.days * .15) * radius * 3.8)
    if (!simulation.reducedMotion && !simulation.paused && !(body.id === 'earth' && simulation.experiment === 'no-spin')) {
      if (surface.current && body.id === 'halley') {
        const spin = simulation.days * 24 / body.day
        surface.current.rotation.set(.4 * Math.sin(spin * .37), spin * .16, .3 * Math.sin(spin * .19))
      } else if (surface.current) surface.current.rotation.y += Math.min(delta, .1) * simulation.speed * 24 / Math.abs(body.day) * .16
      if (cloudsMesh.current) cloudsMesh.current.rotation.y += Math.min(delta, .1) * .025
      if (sun.current) sun.current.uniforms.time.value += Math.min(delta, .1)
    }
    if (glow.current) {
      const pulse = simulation.reducedMotion ? 1 : 1 + Math.sin(state.clock.elapsedTime * .7) * .035 + (flare > Date.now() ? .25 : 0)
      glow.current.scale.setScalar(radius * 6 * pulse)
    }
  })

  const click = () => {
    useSimulation.getState().select(body.id)
    if (body.id === 'sun' && ++clickCount.current % 3 === 0) setFlare(Date.now() + 2500)
  }

  return <group ref={group}>
    <group rotation={[0, 0, body.tilt * Math.PI / 180]}>
      <mesh ref={surface} scale={radius * (hovered ? 1.035 : 1)} onPointerOver={event => { event.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }} onPointerOut={() => { setHovered(false); document.body.style.cursor = '' }} onClick={event => { event.stopPropagation(); if (!event.ctrlKey && !event.metaKey && !event.shiftKey) click() }} onDoubleClick={event => { event.stopPropagation(); if (!event.ctrlKey && !event.metaKey && !event.shiftKey) click() }}>
        {body.id === 'halley' ? <NucleusGeometry /> : <sphereGeometry args={[1, 64, 40]} />}
        {body.id === 'sun' && experiment !== 'no-sun'
          ? <shaderMaterial ref={sun} vertexShader={sunVertex} fragmentShader={sunFragment} uniforms={{ time: { value: 0 } }} />
          : <meshStandardMaterial map={body.id === 'halley' ? null : surfaceMap} color={body.id === 'sun' ? '#08090b' : body.id === 'halley' ? '#343433' : '#ffffff'} roughness={body.id === 'earth' ? .73 : .96} metalness={0} emissive={body.color} emissiveIntensity={hovered ? .15 : body.id === 'halley' ? .045 : .018} />}
      </mesh>
      {body.id === 'saturn' && <Rings radius={radius} />}
      {body.id === 'earth' && cloudMap && <mesh ref={cloudsMesh} scale={radius * 1.012}><sphereGeometry args={[1, 48, 32]} /><meshStandardMaterial map={cloudMap} transparent opacity={.55} depthWrite={false} /></mesh>}
      {['earth', 'venus', 'uranus', 'neptune'].includes(body.id) && <Atmosphere radius={radius} color={body.id === 'venus' ? [1, .7, .25] : [.2, .6, 1]} />}
    </group>
    {body.id === 'halley' && <CometActivity radius={radius} />}
    {body.id === 'sun' && experiment !== 'no-sun' && <>
      <pointLight intensity={55} decay={1} distance={400} color="#fff1d6" />
      <sprite ref={glow} scale={radius * 6}><spriteMaterial map={glowMap} transparent blending={AdditiveBlending} depthWrite={false} /></sprite>
    </>}
    {body.id === 'earth' && experiment === 'two-moons' && <mesh ref={secondMoon} position={[radius * 3.8, 0, 0]}><sphereGeometry args={[.32, 24, 16]} /><meshStandardMaterial color="#b7bebf" /></mesh>}
  </group>
}