import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { BufferAttribute, BufferGeometry, Color, NormalBlending, Points, ShaderMaterial, Vector3 } from 'three'
import type { Group } from 'three'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import type { QualityLevel } from '../../types'
import { EARTH_MAP } from '../../data/earthMap'
import type { EarthMapVisuals } from '../../data/earthMap'
import {
  borderSegmentPositions,
  labelledPlaces,
  loadBorders,
  loadPlaces,
  loadRegions,
  lonLatToDirection,
  placeName,
  type GeoLines,
  type GeoPlace,
} from '../../utils/geo'
import { useTranslation } from '../../i18n'
import { getTexture, hasTexture } from '../../utils/textures'
import { smoothstep } from '../../utils/random'
import { SUN_POSITION } from './constants'
import { EARTH_MAP_PARS, createEarthMapUniforms, type EarthMapUniforms } from './earthMapShader'
import type { TerrainRelief } from './terrain'

/**
 * The optional "World map" overlay: national borders, regional (state/province)
 * borders, capitals and major cities.
 *
 * It is real Natural Earth vector data (public domain — see
 * `public/geo/CREDITS.md`), drawn as a single merged `LineSegments2` per border
 * theme plus one `Points` cloud for the cities, so the whole layer is three draw
 * calls however many thousands of segments it contains.
 *
 * Both the lines and the markers are unit-sphere directions displaced in the
 * vertex shader by the same elevation model the surface is built from (see
 * `earthMapShader.ts`), which is what makes a border follow the mountains, what
 * makes the "Terrain relief" slider free to move, and what lets the overlay fade
 * onto the night side exactly as the city lights brighten there.
 *
 * It only ever exists for Earth, is off by default, and loads its data the first
 * time it is switched on.
 */

interface EarthMapProps {
  /** Earth's drawn radius in scene units. */
  radius: number
  /** The surface's longitude shift, so the overlay lines up with the day map. */
  uvOffsetU: number
  /** The live terrain relief numbers, or null when Earth has no elevation model. */
  terrain: TerrainRelief | null
  quality: QualityLevel
  showLabels: boolean
  reducedMotion: boolean
}

interface GeoData {
  borders: GeoLines
  regions: GeoLines
  places: GeoPlace[]
}

/**
 * Fetches the overlay's three data files once, and again only if the quality
 * tier changes (which swaps the coarse set for the detailed one). The fetch is
 * cached in `utils/geo`, so toggling the layer never refetches.
 */
function useGeoData(quality: QualityLevel): GeoData | null {
  const [data, setData] = useState<GeoData | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([loadBorders(quality), loadRegions(), loadPlaces(quality)])
      .then(([borders, regions, places]) => {
        if (!cancelled) setData({ borders, regions, places: places.places })
      })
      .catch((error: unknown) => {
        if (import.meta.env.DEV) window.console.warn('World map data failed to load', error)
      })
    return () => {
      cancelled = true
    }
  }, [quality])

  return data
}

/**
 * A cheap CPU copy of the elevation model, for placing the text labels (which
 * are DOM elements and cannot be displaced by a shader). The markers themselves
 * do not use it: they hug the terrain in the shader like the borders. Returns
 * null when there is no elevation model, and the labels then sit just above sea
 * level.
 */
function createElevationSampler(): ((lon: number, lat: number) => number) | null {
  if (!hasTexture('earthHeightmap')) return null
  const image = getTexture('earthHeightmap').image as CanvasImageSource | undefined
  if (!image) return null
  const width = 1024
  const height = 512
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.drawImage(image, 0, 0, width, height)
  const pixels = context.getImageData(0, 0, width, height).data
  return (lon, lat) => {
    const u = (((lon + 180) / 360) % 1 + 1) % 1
    const v = Math.min(0.999999, Math.max(0, (90 - lat) / 180))
    const x = Math.min(width - 1, Math.floor(u * width))
    const y = Math.min(height - 1, Math.floor(v * height))
    return pixels[(y * width + x) * 4] / 255
  }
}

/** Injects the shared terrain/day-night GLSL into a `LineMaterial`. */
function patchLineMaterial(material: LineMaterial, uniforms: EarthMapUniforms): void {
  Object.assign(material.uniforms, uniforms)
  material.vertexShader = material.vertexShader
    .replace('#include <common>', `#include <common>\n${EARTH_MAP_PARS}\nvarying float vEarthDay;`)
    .replace(
      'vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );',
      'vec3 earthStart = earthMapDisplace( instanceStart );\n' +
        'vec3 earthEnd = earthMapDisplace( instanceEnd );\n' +
        'vEarthDay = earthMapDay( position.y < 0.5 ? earthStart : earthEnd );\n' +
        'vec4 start = modelViewMatrix * vec4( earthStart, 1.0 );',
    )
    .replace(
      'vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );',
      'vec4 end = modelViewMatrix * vec4( earthEnd, 1.0 );',
    )
  material.fragmentShader = material.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying float vEarthDay;')
    .replace(
      'gl_FragColor = vec4( diffuseColor.rgb, alpha );',
      'gl_FragColor = vec4( diffuseColor.rgb, alpha * vEarthDay );',
    )
}

interface LineOverlayOptions {
  color: string
  width: number
  opacity: number
}

function buildLineOverlay(
  lines: GeoLines,
  uvOffsetU: number,
  uniforms: EarthMapUniforms,
  options: LineOverlayOptions,
): LineSegments2 {
  const geometry = new LineSegmentsGeometry()
  geometry.setPositions(borderSegmentPositions(lines.lines, uvOffsetU))
  const material = new LineMaterial({
    // A `Color` (linear), not a hex number: `LineMaterial` hands its `color`
    // straight to the `diffuse` uniform, and its own shader does the tone
    // mapping and output conversion.
    color: new Color(options.color),
    linewidth: options.width,
    opacity: options.opacity,
    transparent: true,
    depthWrite: false,
  })
  patchLineMaterial(material, uniforms)
  const object = new LineSegments2(geometry, material)
  // The geometry is a unit sphere, but the shader pushes it out by the terrain,
  // so its own bounding sphere is a slight underestimate; the object is always
  // relevant while Earth is on screen anyway.
  object.frustumCulled = false
  object.renderOrder = 1
  return object
}

const MARKER_VERTEX = /* glsl */ `
${EARTH_MAP_PARS}
attribute float aSize;
attribute vec3 aColor;
uniform float uPixelRatio;
varying vec3 vMarkerColor;
varying float vMarkerDay;
void main() {
  vec3 displaced = earthMapDisplace(position);
  vMarkerColor = aColor;
  vMarkerDay = earthMapDay(displaced);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  gl_PointSize = aSize * uPixelRatio;
}
`

const MARKER_FRAGMENT = /* glsl */ `
uniform float uOpacity;
varying vec3 vMarkerColor;
varying float vMarkerDay;
void main() {
  // A filled disc with a soft rim, drawn straight from the point sprite.
  float radius = length(gl_PointCoord - vec2(0.5));
  float alpha = smoothstep(0.5, 0.38, radius);
  if (alpha <= 0.001) discard;
  gl_FragColor = vec4(vMarkerColor, alpha * vMarkerDay * uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

function buildMarkerOverlay(
  places: GeoPlace[],
  uvOffsetU: number,
  uniforms: EarthMapUniforms,
  visuals: EarthMapVisuals,
): Points {
  const count = places.length
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const capital = new Color(visuals.capital.color)
  const city = new Color(visuals.city.color)
  for (let i = 0; i < count; i += 1) {
    const place = places[i]
    const [x, y, z] = lonLatToDirection(place.lon, place.lat, uvOffsetU)
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    const colour = place.cap === 1 ? capital : city
    colors[i * 3] = colour.r
    colors[i * 3 + 1] = colour.g
    colors[i * 3 + 2] = colour.b
    // Capitals read a little larger than the other cities.
    sizes[i] = place.cap === 1 ? visuals.capital.size : visuals.city.size
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aColor', new BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
  const material = new ShaderMaterial({
    vertexShader: MARKER_VERTEX,
    fragmentShader: MARKER_FRAGMENT,
    uniforms: {
      ...uniforms,
      uPixelRatio: { value: 1 },
      uOpacity: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: NormalBlending,
  })
  const points = new Points(geometry, material)
  points.frustumCulled = false
  points.renderOrder = 1
  return points
}

/** One city's text label: a DOM element anchored on the globe. */
function CityLabel({
  place,
  name,
  uvOffsetU,
  sampler,
  terrain,
  centerRef,
  visuals,
  reducedMotion,
}: {
  place: GeoPlace
  /** The place's name in the current interface language. */
  name: string
  uvOffsetU: number
  sampler: ((lon: number, lat: number) => number) | null
  terrain: TerrainRelief | null
  centerRef: RefObject<Group | null>
  visuals: EarthMapVisuals
  reducedMotion: boolean
}) {
  const groupRef = useRef<Group>(null)
  const elementRef = useRef<HTMLDivElement>(null)
  const opacity = useRef(0)

  // In the parent group's own (unit-sphere) space: the group already scales by
  // Earth's radius, so the anchor is just the terrain height plus a small lift.
  const position = useMemo<[number, number, number]>(() => {
    const [x, y, z] = lonLatToDirection(place.lon, place.lat, uvOffsetU)
    const height = sampler ? sampler(place.lon, place.lat) : 0
    const r = 1 + height * (terrain?.scale ?? 0) + (terrain?.bias ?? 0) + visuals.label.lift
    return [x * r, y * r, z * r]
  }, [place, uvOffsetU, sampler, terrain, visuals])

  useFrame(({ camera }, delta) => {
    const element = elementRef.current
    const group = groupRef.current
    const center = centerRef.current
    if (!element || !group || !center) return
    group.getWorldPosition(_labelWorld)
    center.getWorldPosition(_centerWorld)
    _normal.subVectors(_labelWorld, _centerWorld)
    _view.subVectors(camera.position, _centerWorld)
    const denominator = _normal.length() * _view.length() || 1
    const facing = _normal.dot(_view) / denominator
    // Only the hemisphere turned toward the camera carries labels; the far side
    // is hidden by the globe itself.
    const target = facing > 0.1 ? 1 : 0
    const speed = reducedMotion ? 1 : Math.min(1, delta * 9)
    opacity.current += (target - opacity.current) * speed
    element.style.opacity = opacity.current.toFixed(3)
  })

  return (
    <group ref={groupRef} position={position}>
      <Html center={false} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <div
          ref={elementRef}
          className="sse-city-label"
          style={{ color: visuals.label.color, opacity: 0 }}
        >
          <span className="sse-city-label__dot" aria-hidden="true" />
          {name}
        </div>
      </Html>
    </group>
  )
}

const _labelWorld = new Vector3()
const _centerWorld = new Vector3()
const _normal = new Vector3()
const _view = new Vector3()
const _sunLocal = new Vector3()

export function EarthMap({ radius, uvOffsetU, terrain, quality, showLabels, reducedMotion }: EarthMapProps) {
  const data = useGeoData(quality)
  // The city names follow the interface language, like every other label.
  const { language } = useTranslation()
  const groupRef = useRef<Group>(null)
  const [labelsVisible, setLabelsVisible] = useState(false)
  // 0 names only the biggest places; 1 adds every capital and major city.
  const [labelTier, setLabelTier] = useState(0)

  const visuals = EARTH_MAP
  const uniforms = useMemo(
    () => createEarthMapUniforms(getTexture('earthHeightmap'), uvOffsetU, visuals),
    [uvOffsetU, visuals],
  )

  // The relief slider moves the mountains under the overlay: keep the shared
  // uniforms in step instead of rebuilding any geometry.
  useEffect(() => {
    const hasElevation = hasTexture('earthHeightmap')
    uniforms.uEarthHeightMap.value = getTexture('earthHeightmap')
    uniforms.uTerrainScale.value = hasElevation ? (terrain?.scale ?? 0) : 0
    uniforms.uTerrainBias.value = hasElevation ? (terrain?.bias ?? 0) : 0
    uniforms.uTerrainUvOffset.value = uvOffsetU
  }, [uniforms, terrain, uvOffsetU])

  const sampler = useMemo(() => createElevationSampler(), [quality])

  const borders = useMemo(
    () => (data ? buildLineOverlay(data.borders, uvOffsetU, uniforms, visuals.border) : null),
    [data, uvOffsetU, uniforms, visuals],
  )
  const regions = useMemo(
    () => (data ? buildLineOverlay(data.regions, uvOffsetU, uniforms, visuals.region) : null),
    [data, uvOffsetU, uniforms, visuals],
  )
  const markers = useMemo(
    () => (data ? buildMarkerOverlay(data.places, uvOffsetU, uniforms, visuals) : null),
    [data, uvOffsetU, uniforms, visuals],
  )

  // The geometries and materials are created here, so they are disposed here
  // too. The shared height map belongs to the texture cache and is left alone.
  useEffect(() => {
    return () => {
      for (const object of [borders, regions, markers]) {
        if (!object) continue
        object.geometry.dispose()
        const material = object.material
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
        else material.dispose()
      }
    }
  }, [borders, regions, markers])

  const labels = useMemo(() => (data ? labelledPlaces(data.places) : []), [data])
  const visibleLabels = useMemo(
    () => labels.filter((place) => place.tier <= labelTier),
    [labels, labelTier],
  )

  useFrame(({ camera, gl }) => {
    const group = groupRef.current
    if (!group) return

    // The sun, expressed in the overlay's own frame, so the shader can fade it
    // toward the terminator without knowing about the camera.
    group.updateWorldMatrix(true, false)
    _sunLocal.copy(SUN_POSITION)
    group.worldToLocal(_sunLocal).normalize()
    uniforms.uSunDirection.value.copy(_sunLocal)

    const center = _centerWorld
    group.getWorldPosition(center)
    const distance = camera.position.distanceTo(center)
    const apparent = (radius * 2) / Math.max(distance, 1e-3)

    // Hide the whole overlay while Earth is a distant speck, and fade the busy
    // regional borders in as the viewer closes in.
    group.visible = apparent > 0.012
    if (regions) {
      const material = regions.material as LineMaterial
      material.opacity = visuals.region.opacity * smoothstep(visuals.regionFade[0], visuals.regionFade[1], apparent)
    }
    if (markers) {
      const material = markers.material as ShaderMaterial
      material.uniforms.uPixelRatio.value = gl.getPixelRatio()
    }

    // Labels only appear once Earth fills enough of the view, with hysteresis so
    // a camera parked on the threshold cannot flicker. A second, higher
    // threshold reveals the smaller capitals and cities.
    const wanted = showLabels && apparent > (labelsVisible ? visuals.labelFade[0] : visuals.labelFade[1])
    if (wanted !== labelsVisible) setLabelsVisible(wanted)
    const detail =
      showLabels && apparent > (labelTier >= 1 ? visuals.labelDetailFade[0] : visuals.labelDetailFade[1])
    const nextTier = detail ? 1 : 0
    if (nextTier !== labelTier) setLabelTier(nextTier)
  })

  if (!data) return null

  return (
    <group ref={groupRef} scale={radius}>
      {borders ? <primitive object={borders} /> : null}
      {regions ? <primitive object={regions} /> : null}
      {markers ? <primitive object={markers} /> : null}
      {labelsVisible
        ? visibleLabels.map((place) => (
            <CityLabel
              key={`${place.name}-${place.lon}-${place.lat}`}
              place={place}
              name={placeName(place, language)}
              uvOffsetU={uvOffsetU}
              sampler={sampler}
              terrain={terrain}
              centerRef={groupRef}
              visuals={visuals}
              reducedMotion={reducedMotion}
            />
          ))
        : null}
    </group>
  )
}
