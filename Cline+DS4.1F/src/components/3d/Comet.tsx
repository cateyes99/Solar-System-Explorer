import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
} from 'three'
import type { BufferAttribute, Group, Mesh, PointsMaterial, Sprite, SpriteMaterial } from 'three'
import type { CelestialBody } from '../../types'
import type { CometVisuals } from '../../data/visuals'
import { BODY_VISUALS } from '../../data/visuals'
import { AU_KM, orbitalState, toSceneXZ } from '../../utils/astronomy'
import { clock } from '../../utils/simulationClock'
import { scaleDistanceKm } from '../../utils/scale'
import { clamp, createRandom, fbm } from '../../utils/random'
import { getTexture } from '../../utils/textures'
import { registerBody, unregisterBody } from '../../utils/bodyRegistry'
import { useSimulationStore } from '../../store/simulationStore'
import { audio } from '../../utils/audio'
import { PlanetLabel } from './PlanetLabel'

/**
 * A comet.
 *
 * A comet is not a little planet: it is a few kilometres of dark, dirty ice that
 * spends most of its life frozen and invisible, then boils off a glowing coma and
 * two very different tails as it nears the Sun.
 *
 * Everything here is drawn from the published measurements:
 *
 *  - **Nucleus.** Halley's is a 15 × 7 × 7 km peanut photographed by Giotto in
 *    1986, so it is modelled as an elongated, lumpy ellipsoid with a pinched
 *    waist. Its crust reflects about 4% of the sunlight that hits it — one of the
 *    darkest surfaces ever measured — so it is rendered as near-black, mottled,
 *    cratered ice tinted with reddish tholins. Cline-1, a younger visitor, is
 *    rounder and paler.
 *  - **Coma.** The halo of gas and dust that hugs the nucleus. It grows and
 *    brightens as the comet heats up.
 *  - **Two tails.** The blue plasma (ion) tail is thin, straight and points
 *    exactly anti-sunward, carried by the solar wind. The dust tail is broader,
 *    warmer in colour and visibly curved, because the dust lags behind the
 *    comet's own motion instead of following the field lines.
 *  - **Activity.** Comet water ice starts sublimating inside about 3 au; the
 *    production scales roughly with the inverse square of the heliocentric
 *    distance, so a comet at 17 au is dormant and one at perihelion is blazing.
 *
 * The nucleus's true size (a few km) is far below anything the scene can show, so
 * it is drawn at a small, deliberately cosmetic size — the same honest cheat the
 * rest of the app makes for planets — while the tails carry the real drama.
 */
const NUCLEUS_LONG_RADIUS = 0.24
const NUCLEUS_SEGMENTS = 48

interface NucleusOptions {
  /** Longest, middle and shortest axis, normalised to the longest. */
  axes: [number, number, number]
  /** Depth of the peanut-like waist, 0 = plain ellipsoid. */
  waist: number
  seed: number
}

/**
 * A lumpy, elongated nucleus.
 *
 * A sphere is warped in two ways: its radius is perturbed by fractal noise, so
 * the surface is irregular rather than egg-smooth, and the middle is pinched in
 * along the long axis, which is what turns a 2:1 cigar into the peanut Giotto
 * photographed.
 */
function createNucleusGeometry({ axes, waist, seed }: NucleusOptions): BufferGeometry {
  const [ax, ay, az] = axes
  const geometry = new SphereGeometry(1, NUCLEUS_SEGMENTS, Math.round(NUCLEUS_SEGMENTS * 0.7))
  const position = geometry.attributes.position as BufferAttribute
  const normal = geometry.attributes.normal as BufferAttribute
  const point = new Vector3()
  const face = new Vector3()

  for (let i = 0; i < position.count; i += 1) {
    const nx = normal.getX(i)
    const ny = normal.getY(i)
    const nz = normal.getZ(i)
    // Broad lumps plus finer relief, both deterministic and seed-specific.
    const lumps = fbm(nx * 1.4 + seed * 0.11, ny * 1.4, nz * 1.4, 3, seed)
    const grain = fbm(nx * 3.8, ny * 3.8, nz * 3.8, 4, seed + 917)
    const radius = 1 + (lumps - 0.5) * 0.62 + (grain - 0.5) * 0.2

    point.set(nx * ax, ny * ay, nz * az).multiplyScalar(radius)
    // Pinch the middle: only the long (x) axis's centre is squeezed, so the
    // ends stay fat and the silhouette becomes a dumbbell.
    const pinch = 1 - waist * Math.exp(-(point.x * point.x) / (ax * ax * 0.34))
    point.y *= pinch
    point.z *= pinch

    position.setXYZ(i, point.x, point.y, point.z)
    face.copy(point).normalize()
    normal.setXYZ(i, face.x, face.y, face.z)
  }

  position.needsUpdate = true
  normal.needsUpdate = true
  geometry.computeBoundingSphere()
  return geometry
}

interface TailOptions {
  count: number
  /** Length of the tail along -Z (anti-sunward) before group scaling. */
  length: number
  /** Radius of the stream where it leaves the coma. */
  width: number
  /** How far the tail bends sideways over its length (dust lags; ions do not). */
  curve: number
  /** Vertical squash, so a tail is a sheet rather than a tube. */
  flatten: number
  /** Brightness falloff along the tail: higher = fades sooner. */
  fade: number
  color: string
  seed: number
}

/**
 * A tail as a stream of additive points, with a per-point colour that fades from
 * the bright head to nothing at the tip. Positions are baked with the bend, so
 * scaling the group stretches the tail along its own curve.
 */
function createTailGeometry(options: TailOptions): BufferGeometry {
  const random = createRandom(options.seed)
  const tint = new Color(options.color)
  const positions = new Float32Array(options.count * 3)
  const colors = new Float32Array(options.count * 3)

  for (let i = 0; i < options.count; i += 1) {
    const t = Math.pow(random(), 0.62)
    const back = -t * options.length
    const bend = options.curve * t * t
    const angle = random() * Math.PI * 2
    const spread = options.width * (0.14 + t * 0.9) * Math.pow(random(), 0.7)

    positions[i * 3] = Math.cos(angle) * spread + bend
    positions[i * 3 + 1] = Math.sin(angle) * spread * options.flatten
    positions[i * 3 + 2] = back

    const fade = Math.pow(1 - t, options.fade) * (0.5 + random() * 0.5)
    colors[i * 3] = tint.r * fade
    colors[i * 3 + 1] = tint.g * fade
    colors[i * 3 + 2] = tint.b * fade
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return geometry
}

/** Fallback look if a comet were ever defined without its own recipe. */
const DEFAULT_COMET_LOOK: CometVisuals = {
  nucleusColor: '#cec7ba',
  emissiveColor: '#8fe0ff',
  emissiveIntensity: 0.1,
  tailColor: '#b6e8ff',
  nucleusAxes: [1, 0.8, 0.9],
  nucleusWaist: 0.12,
  ionTailColor: '#8fd2ff',
  dustTailColor: '#eef2ff',
  comaColor: '#c8ecff',
}

interface CometProps {
  body: CelestialBody
  reducedMotion: boolean
  showLabels: boolean
}

export function Comet({ body, reducedMotion, showLabels }: CometProps) {
  const groupRef = useRef<Group>(null)
  const nucleusRef = useRef<Mesh>(null)
  const haloRef = useRef<Sprite>(null)
  const ionRef = useRef<Group>(null)
  const dustRef = useRef<Group>(null)
  const spriteMaterialRef = useRef<SpriteMaterial>(null)
  const ionMaterialRef = useRef<PointsMaterial>(null)
  const dustMaterialRef = useRef<PointsMaterial>(null)
  // How far the dust tail currently leans away from anti-sun, in radians.
  const dustLag = useRef(0)
  const motionTmp = useRef(new Vector3())
  const localTmp = useRef(new Vector3())
  const inverseQuaternion = useRef(new Quaternion())

  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const customScale = useSimulationStore((state) => state.customScale)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const focusBody = useSimulationStore((state) => state.focusBody)
  const setHovered = useSimulationStore((state) => state.setHovered)
  const registerDiscovery = useSimulationStore((state) => state.registerDiscovery)
  const showToast = useSimulationStore((state) => state.showToast)
  const discoveries = useSimulationStore((state) => state.discoveries)

  const visuals = BODY_VISUALS[body.id]
  // Every comet ships a `comet` recipe; fall back to the bright default if one is ever missing.
  const look = visuals.comet ?? DEFAULT_COMET_LOOK

  const seed = useMemo(() => {
    let value = 0
    for (let i = 0; i < body.id.length; i += 1) value = (value * 31 + body.id.charCodeAt(i)) >>> 0
    return value
  }, [body.id])

  const nucleusGeometry = useMemo(
    () =>
      createNucleusGeometry({
        axes: look.nucleusAxes ?? [1, 0.8, 0.9],
        waist: look.nucleusWaist ?? 0.12,
        seed,
      }),
    [look.nucleusAxes, look.nucleusWaist, seed],
  )

  const nucleusMaterial = useMemo(() => {
    const map = getTexture('cometNucleus')
    return new MeshStandardMaterial({
      map,
      bumpMap: map,
      bumpScale: 0.04,
      color: look.nucleusColor,
      roughness: visuals.roughness,
      metalness: visuals.metalness,
      emissive: look.emissiveColor,
      emissiveIntensity: look.emissiveIntensity,
    })
  }, [look.nucleusColor, look.emissiveColor, look.emissiveIntensity, visuals.roughness, visuals.metalness])

  const ionColor = look.ionTailColor ?? look.tailColor
  const dustColor = look.dustTailColor ?? look.tailColor

  const ionGeometry = useMemo(
    () =>
      createTailGeometry({
        count: 900,
        length: 13,
        width: 0.3,
        curve: 0,
        flatten: 0.7,
        fade: 1.5,
        color: ionColor,
        seed: seed + 3,
      }),
    [ionColor, seed],
  )
  const dustGeometry = useMemo(
    () =>
      createTailGeometry({
        count: 1100,
        length: 9,
        width: 1.05,
        curve: 3.6,
        flatten: 0.6,
        fade: 1.15,
        color: dustColor,
        seed: seed + 7,
      }),
    [dustColor, seed],
  )

  useEffect(
    () => () => {
      nucleusGeometry.dispose()
      ionGeometry.dispose()
      dustGeometry.dispose()
      nucleusMaterial.dispose()
    },
    [nucleusGeometry, ionGeometry, dustGeometry, nucleusMaterial],
  )

  useEffect(() => {
    const object = groupRef.current
    if (!object) return
    registerBody(body.id, object)
    return () => unregisterBody(body.id, object)
  }, [body.id])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    const days = clock.daysSinceJ2000
    const state = orbitalState(body, days)
    const distance = scaleDistanceKm(state.distanceKm, scaleMode, customScale)
    const scene = toSceneXZ(distance, state.angleRad)
    group.position.set(scene.x, 0, scene.z)
    // +Z then points at the Sun, so the tails (built along -Z) trail behind.
    group.lookAt(0, 0, 0)

    // --- How alive is the comet? -------------------------------------------
    // Sublimation of water ice turns on sharply inside a few au, so activity is
    // driven by the real heliocentric distance rather than by the drawn orbit.
    const au = state.distanceKm / AU_KM
    const activity = clamp((3.2 / Math.max(au, 0.2)) ** 2, 0.004, 1)

    // --- Nucleus tumble -----------------------------------------------------
    if (nucleusRef.current && !reducedMotion) {
      // Spin at the body's real sidereal period (Halley takes 2.2 days per turn),
      // plus a slow secondary tumble: real nuclei are not principal-axis spinners.
      const spin =
        body.rotationPeriodHours !== 0
          ? (clock.lastFrameDays * 24 / body.rotationPeriodHours) * Math.PI * 2
          : delta * 0.2
      nucleusRef.current.rotation.y += spin
      nucleusRef.current.rotation.z += delta * 0.06
    }

    // --- Dust tail lag ------------------------------------------------------
    // The plasma tail follows the solar wind and points dead anti-sunward, but
    // the heavier dust keeps some of the comet's own sideways motion, so its tail
    // lags behind and the two tails visibly split apart.
    const aheadState = orbitalState(body, days + 0.1)
    const aheadDistance = scaleDistanceKm(aheadState.distanceKm, scaleMode, customScale)
    const ahead = toSceneXZ(aheadDistance, aheadState.angleRad)
    motionTmp.current.set(ahead.x - scene.x, 0, ahead.z - scene.z)
    if (motionTmp.current.lengthSq() > 1e-8) {
      inverseQuaternion.current.copy(group.quaternion).invert()
      // Trailing direction = -velocity, expressed in the comet's own frame.
      localTmp.current.copy(motionTmp.current).multiplyScalar(-1).applyQuaternion(inverseQuaternion.current)
      const lean = clamp(Math.atan2(-localTmp.current.x, -localTmp.current.z) * 0.5, -0.85, 0.85)
      dustLag.current += (lean - dustLag.current) * Math.min(1, delta * 3)
    }
    if (dustRef.current) dustRef.current.rotation.y = dustLag.current

    // --- Coma and tails grow with activity ---------------------------------
    const ionScale = 0.14 + activity * 1.55
    const dustScale = 0.12 + activity * 1.35
    if (ionRef.current) ionRef.current.scale.setScalar(ionScale)
    if (dustRef.current) dustRef.current.scale.setScalar(dustScale)
    if (ionMaterialRef.current) ionMaterialRef.current.opacity = 0.16 + activity * 0.5
    if (dustMaterialRef.current) dustMaterialRef.current.opacity = 0.13 + activity * 0.42
    if (spriteMaterialRef.current) spriteMaterialRef.current.opacity = 0.3 + activity * 0.42

    if (haloRef.current) {
      const shimmer = reducedMotion ? 1 : 1 + Math.sin(performance.now() * 0.0013) * 0.05
      const size = (0.45 + activity * 1.35) * shimmer
      haloRef.current.scale.set(size, size, 1)
    }
  })

  const discovered = discoveries.includes(body.id)

  return (
    <group ref={groupRef}>
      <mesh
        ref={nucleusRef}
        geometry={nucleusGeometry}
        material={nucleusMaterial}
        scale={NUCLEUS_LONG_RADIUS}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(body.id)
        }}
        onPointerOut={() => setHovered(null)}
        onClick={(event) => {
          event.stopPropagation()
          selectBody(body.id)
          focusBody(body.id, 'planet', 9)
          audio.play('arrive')
          if (!discovered) {
            registerDiscovery(body.id)
            showToast(body.discoveryToast ?? `You found ${body.name}!`, 'fun')
          }
        }}
      />

      {/* The coma: a soft glow of freshly sublimated gas and dust. */}
      <sprite ref={haloRef} scale={[0.5, 0.5, 1]}>
        <spriteMaterial
          ref={spriteMaterialRef}
          map={getTexture('comet')}
          color={look.comaColor ?? look.tailColor}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
          opacity={0.4}
          toneMapped={false}
        />
      </sprite>

      {/* Plasma tail: thin, straight, blown exactly anti-sunward. */}
      <group ref={ionRef}>
        <points geometry={ionGeometry} frustumCulled={false}>
          <pointsMaterial
            ref={ionMaterialRef}
            map={getTexture('star')}
            size={0.17}
            sizeAttenuation
            vertexColors
            blending={AdditiveBlending}
            transparent
            depthWrite={false}
            opacity={0.3}
            toneMapped={false}
          />
        </points>
      </group>

      {/* Dust tail: broader and warmer, curving as the dust lags the comet. */}
      <group ref={dustRef}>
        <points geometry={dustGeometry} frustumCulled={false}>
          <pointsMaterial
            ref={dustMaterialRef}
            map={getTexture('star')}
            size={0.26}
            sizeAttenuation
            vertexColors
            blending={AdditiveBlending}
            transparent
            depthWrite={false}
            opacity={0.25}
            toneMapped={false}
          />
        </points>
      </group>

      {showLabels ? (
        <PlanetLabel bodyId={body.id} name={body.name} accent={visuals.accent} offset={2.1} />
      ) : null}
    </group>
  )
}