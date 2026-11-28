import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Matrix4,
  NormalBlending,
  Points,
  Quaternion,
  ShaderMaterial,
  Vector3,
} from 'three'
import type { Camera, Group } from 'three'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import type { QualityLevel } from '../../types'
import { EARTH_MAP } from '../../data/earthMap'
import type { EarthMapVisuals } from '../../data/earthMap'
import {
  borderSegmentPositions,
  countryName,
  densifyLines,
  labelledPlaces,
  loadBorders,
  loadCountries,
  loadPlaces,
  loadRegions,
  limbFacingThreshold,
  lonLatToDirection,
  placeName,
  type GeoCountry,
  type GeoLines,
  type GeoPlace,
} from '../../utils/geo'
import { useTranslation } from '../../i18n'
import { cameraRayTo, getBodyOccluders, rayBlockedBySphere } from '../../utils/bodyRegistry'
import { getTexture, hasTexture } from '../../utils/textures'
import { smoothstep } from '../../utils/random'
import { SUN_POSITION } from './constants'
import { EARTH_MAP_PARS, createEarthMapUniforms, type EarthMapUniforms } from './earthMapShader'
import { TERRAIN_COAST_TAPER_TEXELS, TERRAIN_KERNEL_MIN_TEXELS, type TerrainRelief } from './terrain'

/**
 * The optional "World map" overlay: national borders, regional (state/province)
 * borders, country names, national and state/provincial capitals, and cities
 * down to about a million people.
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
 * The *names* are DOM elements (see `MapLabels`), and which of them are drawn is
 * the one piece of the overlay that is a choice rather than a consequence of the
 * data: the "Country names" switch swaps the country names in for the smaller
 * cities, and a second switch decides whether the capitals join them. That one
 * is off by default, because a capital's badge beside its own country's name
 * hides the smaller countries; with the city names the capitals are always
 * there, and there is room for them.
 *
 * A city that carries no name at all still answers the pointer: hovering its dot
 * brings its name up for as long as the pointer stays by it, so the small places
 * are discoverable without crowding every view with several hundred more names
 * (see `pickUnlabelledCity`).
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
  /**
   * The surface mesh's tessellation — `widthSegments`, `heightSegments`. The
   * overlay has to interpolate the elevation model across the same facets the
   * ground is drawn with, so it needs the mesh's resolution, and it changes as
   * the planet climbs a level of detail (see `geometry.ts`).
   */
  meshColumns: number
  meshRows: number
  quality: QualityLevel
  showLabels: boolean
  /**
   * Whether the map names countries instead of the smaller cities. Capitals are
   * named with the cities; with the countries they are a separate choice (see
   * `showCapitalNames`).
   */
  showCountryNames: boolean
  /**
   * Whether capitals are named alongside the country names. It has no effect
   * with the city names, which always carry their capitals.
   */
  showCapitalNames: boolean
}

interface GeoData {
  borders: GeoLines
  regions: GeoLines
  places: GeoPlace[]
  countries: GeoCountry[]
}

/**
 * Fetches the overlay's four data files once, and again only if the quality
 * tier changes (which swaps the coarse set for the detailed one). The fetch is
 * cached in `utils/geo`, so toggling the layer never refetches.
 */
function useGeoData(quality: QualityLevel): GeoData | null {
  const [data, setData] = useState<GeoData | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([loadBorders(quality), loadRegions(), loadPlaces(quality), loadCountries(quality)])
      .then(([borders, regions, places, countries]) => {
        if (!cancelled) {
          setData({ borders, regions, places: places.places, countries: countries.countries })
        }
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

/** One of Earth's maps, read back as raw RGBA pixels for the CPU samplers. */
function readMapPixels(textureId: 'earthHeightmap' | 'earthRoughness') {
  if (!hasTexture(textureId)) return null
  const image = getTexture(textureId).image as CanvasImageSource | undefined
  if (!image) return null
  const source = image as { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number }
  const width = source.naturalWidth ?? source.width ?? 2048
  const height = source.naturalHeight ?? source.height ?? 1024
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.drawImage(image, 0, 0, width, height)
  return { width, height, data: context.getImageData(0, 0, width, height).data }
}

/**
 * The ground a name should sit on: the surface mesh's height and the fraction of
 * the land relief the coastal apron still shows there.
 *
 * A cheap CPU copy of the elevation model, for placing the text labels (which are
 * DOM elements and cannot be displaced by a shader). The markers themselves do
 * not use it: they hug the terrain in the shader like the borders. Returns null
 * when there is no elevation model, and the labels then sit just above sea level.
 *
 * It mirrors `earthMapGroundHeight` in `earthMapShader.ts` — the band-limited
 * sampler, the mesh facet interpolation and the coastal taper — so a name lands on
 * the ground the mesh draws rather than on a single raw texel or, at a coast, on
 * the slope the taper has taken away. The height and the taper are returned
 * separately because the caller knows the live relief numbers: the rise the
 * shader draws is `height × scale + bias × taper`, and only that form keeps a
 * name on its marker as the slider moves.
 */
function createElevationSampler(
  uvOffsetU: number,
  meshColumns: number,
  meshRows: number,
): ((lon: number, lat: number) => { height: number; taper: number }) | null {
  const heights = readMapPixels('earthHeightmap')
  if (!heights) return null
  // The ocean's water mask (the roughness map's red channel) defines the coast.
  // Without it the apron is switched off, exactly as in the shader.
  const mask = readMapPixels('earthRoughness')
  // A texel of a map, in the sampler's own top-down layout.
  const texelOf = (map: { width: number; height: number; data: Uint8ClampedArray }) =>
    (mapU: number, mapV: number) => {
      const u = (((mapU % 1) + 1) % 1)
      const v = Math.min(0.999999, Math.max(0, 1 - mapV))
      const x = Math.min(map.width - 1, Math.floor(u * map.width))
      const y = Math.min(map.height - 1, Math.floor(v * map.height))
      return map.data[(y * map.width + x) * 4] / 255
    }
  const heightTexel = texelOf(heights)
  const maskTexel = mask ? texelOf(mask) : null
  const columns = Math.max(meshColumns, 1)
  const rows = Math.max(meshRows, 1)
  // Mirror of `terrainHeightAt` in `terrain.ts`: the elevation averaged over one
  // mesh cell (never finer than the model's texel staircase), so a name sits on
  // the ground the displaced mesh draws rather than on a single raw texel.
  const cellU = Math.max(1 / columns, (1 / heights.width) * TERRAIN_KERNEL_MIN_TEXELS)
  const cellV = Math.max(1 / rows, (1 / heights.height) * TERRAIN_KERNEL_MIN_TEXELS)
  // The nine-tap box, with the same offsets the shader uses: `terrainHeightAt`
  // samples at half a cell, `terrainLandnessAt` at the full radius.
  const average = (
    sample: (u: number, v: number) => number,
    u: number,
    v: number,
    offsetU: number,
    offsetV: number,
  ) =>
    (sample(u, v) +
      sample(u + offsetU, v) +
      sample(u - offsetU, v) +
      sample(u, v + offsetV) +
      sample(u, v - offsetV) +
      sample(u + offsetU, v + offsetV) +
      sample(u + offsetU, v - offsetV) +
      sample(u - offsetU, v + offsetV) +
      sample(u - offsetU, v - offsetV)) /
    9
  const heightAt = (u: number, v: number) =>
    average(heightTexel, u, v, cellU * 0.5, cellV * 0.5)
  // Mirror of `terrainLandnessAt` and the apron width in `TERRAIN_VERTEX_DISPLACE`:
  // one mesh cell, or the floor, whichever is wider.
  const taperTexels = Math.max(
    TERRAIN_COAST_TAPER_TEXELS,
    (1 / columns) / (1 / heights.width),
    (1 / rows) / (1 / heights.height),
  )
  const taperU = (1 / heights.width) * taperTexels
  const taperV = (1 / heights.height) * taperTexels
  const taperAt = (u: number, v: number) => {
    if (!maskTexel) return 1
    const landness = 1 - average(maskTexel, u, v, taperU, taperV)
    return smoothstep(0.5, 1, landness)
  }
  // Mirror of the shader's earthMapGroundHeight. The taper is applied per grid
  // corner, before the triangle interpolation, exactly as the surface shader
  // fades each corner's rise.
  return (lon, lat) => {
    const mapU = (lon + 180) / 360
    const mapV = (90 + lat) / 180
    const gu = (mapU - uvOffsetU) * columns
    const gv = Math.min(Math.max((1 - mapV) * rows, 0), rows - 1e-3)
    const iu = Math.floor(gu)
    const iv = Math.floor(gv)
    const au = gu - iu
    const av = gv - iv
    const u0 = iu / columns + uvOffsetU
    const u1 = (iu + 1) / columns + uvOffsetU
    const v0 = 1 - iv / rows
    const v1 = 1 - (iv + 1) / rows
    const tA = taperAt(u1, v0)
    const tB = taperAt(u0, v0)
    const tC = taperAt(u0, v1)
    const tD = taperAt(u1, v1)
    const hA = heightAt(u1, v0) * tA
    const hB = heightAt(u0, v0) * tB
    const hC = heightAt(u0, v1) * tC
    const hD = heightAt(u1, v1) * tD
    const northCap = iv < 0.5
    const southCap = iv > rows - 1.5
    if (southCap || (!northCap && au >= av)) {
      return {
        height: hA * (au - av) + hB * (1 - au) + hD * av,
        taper: tA * (au - av) + tB * (1 - au) + tD * av,
      }
    }
    return {
      height: hB * (1 - av) + hC * (av - au) + hD * au,
      taper: tB * (1 - av) + tC * (av - au) + tD * au,
    }
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
      'vec4 end = modelViewMatrix * vec4( earthEnd, 1.0 );\n' +
        '// Out of the ground the coarse mesh only approximates.\n' +
        'start = earthMapLift( start );\n' +
        'end = earthMapLift( end );',
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
  // Long, sparse segments (Greenland's municipal lines are the worst) are split
  // so the straight line follows the ground between its original points.
  geometry.setPositions(borderSegmentPositions(densifyLines(lines.lines), uvOffsetU))
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
  gl_Position = projectionMatrix * earthMapLift( modelViewMatrix * vec4(displaced, 1.0) );
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

/** One name the overlay draws: a country, a national or regional capital, or another city. */
export interface MapLabelEntry {
  kind: 'country' | 'capital' | 'state' | 'city'
  name: string
  lon: number
  lat: number
}

interface MapLabelsProps {
  entries: MapLabelEntry[]
  uvOffsetU: number
  sampler: ((lon: number, lat: number) => { height: number; taper: number }) | null
  terrain: TerrainRelief | null
  /** The globe's own group, which carries the overlay's transform. */
  groupRef: RefObject<Group | null>
  visuals: EarthMapVisuals
}

interface MapLabelPlacement {
  /** The name's unit direction in the globe group's own space. */
  dir: Vector3
  /**
   * The elevation at the name, weighted by the coastal apron (`Σ w·h·t`), so the
   * radius is `height · scale + bias · taper`: the same corner-by-corner
   * interpolation the surface shader does, kept linear in the live scale and bias.
   */
  height: number
  /** The apron's own interpolated share there (`Σ w·t`), 0…1. */
  taper: number
}

/**
 * The map's names — countries, capitals and cities, each in its own style.
 *
 * A globe carries a couple of hundred of them, which is far more than drei's
 * `<Html>` is built for: each instance runs its own `useFrame`, and each of
 * those walks the object's parents, projects the point, allocates, and writes
 * both a `transform` and a `z-index` — several times the work of the label
 * itself, a few hundred times a frame. So the names are plain elements in one
 * overlay here, built by hand rather than reconciled (a React portal inside the
 * canvas is rendered by the three.js reconciler, which knows nothing of a
 * `<div>`), and a single `useFrame` places them all:
 *
 *  - **The cull costs one dot product.** The globe turns as a rigid body, so the
 *    camera's direction is rotated into the globe's own frame once a frame and
 *    each name is tested against its precomputed direction. That drops the whole
 *    back face — and the rim, where foreshortening piles the names up — before
 *    any work is spent finding a position.
 *  - **One matrix a frame, one multiply a name.** The camera and the globe are
 *    folded into a single matrix, so a visible name costs one `applyMatrix4` and
 *    one `transform` write.
 *  - **The fade is a CSS transition.** Visibility is a data attribute, so a name
 *    that is not crossing the limb costs nothing but its position write.
 *
 * The entries arrive already chosen and already styled (see `EarthMap`): this
 * component only has to place them, and the class it builds carries the kind's
 * badge — a capital's ringed amber, a country's wide-tracked parchment, or a
 * city's cool white with a dot.
 */
function MapLabels({ entries, uvOffsetU, sampler, terrain, groupRef, visuals }: MapLabelsProps) {
  const gl = useThree((state) => state.gl)
  const nodes = useRef<HTMLDivElement[]>([])
  const shown = useRef<Uint8Array>(new Uint8Array(0))
  const lastX = useRef<Float32Array>(new Float32Array(0))
  const lastY = useRef<Float32Array>(new Float32Array(0))

  // Only the names and their directions are fixed here; the elevation is kept as
  // a raw texel (and the apron's share of it) so that moving the relief slider
  // never rebuilds anything — the radius is worked out in the frame loop from the
  // live terrain numbers.
  const placements = useMemo<MapLabelPlacement[]>(
    () =>
      entries.map((entry) => {
        const [x, y, z] = lonLatToDirection(entry.lon, entry.lat, uvOffsetU)
        const ground = sampler ? sampler(entry.lon, entry.lat) : { height: 0, taper: 1 }
        return {
          dir: new Vector3(x, y, z),
          height: ground.height,
          taper: ground.taper,
        }
      }),
    [entries, uvOffsetU, sampler],
  )

  const facingMin = limbFacingThreshold(visuals.label.limbRadius)

  // One overlay beside the canvas, beneath the interface panels, with one
  // element per name — built by hand, once per set of names.
  useEffect(() => {
    const parent = gl.domElement.parentNode
    if (!parent) return
    const container = document.createElement('div')
    container.className = 'sse-map-labels'
    const created = entries.map((entry) => {
      const element = document.createElement('div')
      element.className = `sse-map-label sse-map-label--${entry.kind}`
      if (entry.kind === 'capital') {
        element.style.color = visuals.capitalLabel.color
        element.style.background = visuals.capitalLabel.background
        element.style.borderColor = visuals.capitalLabel.border
      } else if (entry.kind === 'state') {
        element.style.color = visuals.stateCapitalLabel.color
        element.style.background = visuals.stateCapitalLabel.background
        element.style.borderColor = visuals.stateCapitalLabel.border
      } else if (entry.kind === 'country') {
        element.style.color = visuals.countryLabel.color
        element.style.background = visuals.countryLabel.background
      } else {
        element.style.color = visuals.label.color
      }
      // A country is an area, not a point: it carries no marker dot.
      if (entry.kind !== 'country') {
        const dot = document.createElement('span')
        dot.className = 'sse-map-label__dot'
        dot.setAttribute('aria-hidden', 'true')
        element.appendChild(dot)
      }
      element.appendChild(document.createTextNode(entry.name))
      container.appendChild(element)
      return element
    })
    parent.appendChild(container)
    nodes.current = created
    shown.current = new Uint8Array(created.length)
    lastX.current = new Float32Array(created.length)
    lastY.current = new Float32Array(created.length)
    return () => {
      parent.removeChild(container)
      nodes.current = []
      shown.current = new Uint8Array(0)
      lastX.current = new Float32Array(0)
      lastY.current = new Float32Array(0)
    }
  }, [gl, entries, visuals])

  useFrame(({ camera, size }) => {
    const group = groupRef.current
    const elements = nodes.current
    if (!group || elements.length === 0) return

    // Everything happens in the globe's own frame: one world-matrix update, one
    // decomposition and one quaternion inversion a frame, not per name.
    group.updateWorldMatrix(true, false)
    group.matrixWorld.decompose(_centerWorld, _globeQuaternion, _globeScale)
    _viewDirection.subVectors(camera.position, _centerWorld).normalize()
    _globeQuaternion.invert()
    _viewLocal.copy(_viewDirection).applyQuaternion(_globeQuaternion)

    // The camera and the globe in one matrix, so projecting a name is a single
    // multiply.
    camera.updateMatrixWorld()
    _projectionView
      .multiplyMatrices(camera.projectionMatrix, _viewMatrix.copy(camera.matrixWorld).invert())
      .multiply(group.matrixWorld)

    const halfWidth = size.width / 2
    const halfHeight = size.height / 2
    const terrainScale = terrain?.scale ?? 0
    const terrainBias = terrain?.bias ?? 0
    const lift = visuals.label.lift
    // The bodies a name can hide behind, read once a frame rather than once a
    // name.
    const occluderCount = refreshOccluders(camera.position)

    for (let index = 0; index < elements.length; index += 1) {
      const element = elements[index]
      const placement = placements[index]
      if (!placement) continue
      const dir = placement.dir
      // 1 at the point facing the camera, 0 at the limb, negative behind it.
      const facing = dir.x * _viewLocal.x + dir.y * _viewLocal.y + dir.z * _viewLocal.z
      let visible = facing > facingMin
      let radius = 0
      if (visible) {
        radius = 1 + placement.height * terrainScale + terrainBias * placement.taper + lift
        // A DOM label is never depth-tested, so the globe and the other worlds
        // have to be tested by hand — otherwise the Moon, passing in front of
        // South America, has the names behind it drawn on top of it. The globe's
        // own sphere only ever blocks a name that is already past the limb, so
        // this doubles as the exact near-side test the fixed cull cannot give a
        // close camera.
        _anchor.copy(dir).multiplyScalar(radius).applyMatrix4(group.matrixWorld)
        const rayLength = cameraRayTo(_anchor, camera.position, _labelRay)
        if (rayLength > 0) {
          for (let body = 0; body < occluderCount; body += 1) {
            if (
              rayBlockedBySphere(_labelRay, rayLength, _occluderCentres[body], _occluderRadii[body])
            ) {
              visible = false
              break
            }
          }
        }
      }
      const turned = visible !== (shown.current[index] === 1)
      if (turned) {
        shown.current[index] = visible ? 1 : 0
        element.classList.toggle('is-visible', visible)
      }
      if (!visible) continue

      _ndc.copy(dir).multiplyScalar(radius).applyMatrix4(_projectionView)
      // Off the viewport: leave the last position; the overlay clips it.
      if (_ndc.x < -1.1 || _ndc.x > 1.1 || _ndc.y < -1.1 || _ndc.y > 1.1) continue
      const x = _ndc.x * halfWidth + halfWidth
      const y = halfHeight - _ndc.y * halfHeight
      // Only touch the DOM when the name has actually moved (or has just come
      // back into view): a paused globe or a still camera then costs nothing at
      // all, and a slow one only pays for the pixels it really shifts.
      if (
        !turned &&
        Math.abs(x - lastX.current[index]) < 0.5 &&
        Math.abs(y - lastY.current[index]) < 0.5
      ) {
        continue
      }
      lastX.current[index] = x
      lastY.current[index] = y
      element.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-100%)`
    }
  })

  return null
}

const _centerWorld = new Vector3()
const _sunLocal = new Vector3()
const _viewDirection = new Vector3()
const _viewLocal = new Vector3()
const _globeQuaternion = new Quaternion()
const _globeScale = new Vector3()
const _projectionView = new Matrix4()
const _viewMatrix = new Matrix4()
const _ndc = new Vector3()
const _anchor = new Vector3()
const _labelRay = new Vector3()
/**
 * The bodies a name can hide behind, as camera-relative centres and radii,
 * refreshed once a frame. Both lists are reused, so a frame allocates nothing.
 */
const _occluderCentres: Vector3[] = []
const _occluderRadii: number[] = []

function refreshOccluders(cameraPosition: Vector3): number {
  const bodies = getBodyOccluders()
  for (let index = 0; index < bodies.length; index += 1) {
    let centre = _occluderCentres[index]
    if (!centre) {
      centre = new Vector3()
      _occluderCentres[index] = centre
    }
    bodies[index].object.getWorldPosition(centre).sub(cameraPosition)
    _occluderRadii[index] = bodies[index].radius
  }
  return bodies.length
}

/**
 * One unlabelled city, with the direction and elevation its marker is drawn at —
 * the same figures `MapLabels` uses, so the pointer is tested against the dot
 * the viewer actually sees.
 */
interface HoverCandidate {
  place: GeoPlace
  dir: Vector3
  height: number
  taper: number
}

/** How near a marker the pointer has to come to name it, in CSS pixels. */
const HOVER_PICK_RADIUS = 8

/**
 * The nearest unlabelled city under the pointer, or null.
 *
 * Only the cities that never carry a name are candidates (see `EarthMap`), so a
 * city that already shows its label never gains a second one. The test is done
 * in screen space: each marker is projected exactly as the names are, the ones
 * on the far side or behind another body are skipped with the names' own tests,
 * and the closest dot within `HOVER_PICK_RADIUS` wins. Projecting a few hundred
 * dots once a frame is far cheaper than turning the markers into pickable
 * geometry, and it keeps the hit area generous enough to find a three-pixel dot.
 */
function pickUnlabelledCity(
  candidates: HoverCandidate[],
  camera: Camera,
  group: Group,
  terrain: TerrainRelief | null,
  visuals: EarthMapVisuals,
  pointer: { x: number; y: number },
  width: number,
  height: number,
): GeoPlace | null {
  if (candidates.length === 0) return null

  // The same frame and cull set-up as `MapLabels`: the globe's own frame, one
  // combined camera-and-globe matrix, and one quaternion inversion.
  group.updateWorldMatrix(true, false)
  group.matrixWorld.decompose(_centerWorld, _globeQuaternion, _globeScale)
  _viewDirection.subVectors(camera.position, _centerWorld).normalize()
  _globeQuaternion.invert()
  _viewLocal.copy(_viewDirection).applyQuaternion(_globeQuaternion)

  camera.updateMatrixWorld()
  _projectionView
    .multiplyMatrices(camera.projectionMatrix, _viewMatrix.copy(camera.matrixWorld).invert())
    .multiply(group.matrixWorld)

  const facingMin = limbFacingThreshold(visuals.label.limbRadius)
  const terrainScale = terrain?.scale ?? 0
  const terrainBias = terrain?.bias ?? 0
  const lift = visuals.label.lift
  const occluderCount = refreshOccluders(camera.position)
  const halfWidth = width / 2
  const halfHeight = height / 2
  let picked: GeoPlace | null = null
  let nearest = HOVER_PICK_RADIUS * HOVER_PICK_RADIUS

  for (const candidate of candidates) {
    const dir = candidate.dir
    // 1 at the point facing the camera, 0 at the limb, negative behind it.
    if (dir.x * _viewLocal.x + dir.y * _viewLocal.y + dir.z * _viewLocal.z <= facingMin) continue
    const radius = 1 + candidate.height * terrainScale + terrainBias * candidate.taper + lift
    // The same hand-run occlusion test the names get: the globe and the other
    // worlds are never depth-tested against either.
    _anchor.copy(dir).multiplyScalar(radius).applyMatrix4(group.matrixWorld)
    const rayLength = cameraRayTo(_anchor, camera.position, _labelRay)
    if (rayLength > 0) {
      let blocked = false
      for (let body = 0; body < occluderCount; body += 1) {
        if (rayBlockedBySphere(_labelRay, rayLength, _occluderCentres[body], _occluderRadii[body])) {
          blocked = true
          break
        }
      }
      if (blocked) continue
    }
    _ndc.copy(dir).multiplyScalar(radius).applyMatrix4(_projectionView)
    if (_ndc.x < -1 || _ndc.x > 1 || _ndc.y < -1 || _ndc.y > 1) continue
    const dx = (_ndc.x + 1) * halfWidth - pointer.x
    const dy = (1 - _ndc.y) * halfHeight - pointer.y
    const distance = dx * dx + dy * dy
    if (distance < nearest) {
      nearest = distance
      picked = candidate.place
    }
  }
  return picked
}

export function EarthMap({
  radius,
  uvOffsetU,
  terrain,
  meshColumns,
  meshRows,
  quality,
  showLabels,
  showCountryNames,
  showCapitalNames,
}: EarthMapProps) {
  const data = useGeoData(quality)
  const gl = useThree((state) => state.gl)
  // The names follow the interface language, like every other label.
  const { language } = useTranslation()
  const groupRef = useRef<Group>(null)
  const [labelsVisible, setLabelsVisible] = useState(false)
  // 0 names only the biggest places; 1 adds the rest of the national capitals and
  // largest cities; 2 adds the state/provincial capitals; 3 adds every city of a
  // million people or more once the viewer is close enough.
  const [labelTier, setLabelTier] = useState(0)
  // The unlabelled city under the pointer, if any, and where the pointer is in
  // canvas pixels (null while it is elsewhere or a drag is under way).
  const [hovered, setHovered] = useState<GeoPlace | null>(null)
  const hoveredRef = useRef<GeoPlace | null>(null)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)

  const visuals = EARTH_MAP
  const uniforms = useMemo(
    () =>
      createEarthMapUniforms(
        getTexture('earthHeightmap'),
        getTexture('earthRoughness'),
        uvOffsetU,
        visuals,
      ),
    [uvOffsetU, visuals],
  )

  // The relief slider moves the mountains under the overlay: keep the shared
  // uniforms in step instead of rebuilding any geometry.
  useEffect(() => {
    const hasElevation = hasTexture('earthHeightmap')
    const heightMap = getTexture('earthHeightmap')
    uniforms.uEarthHeightMap.value = heightMap
    // The ocean's water mask rides in the roughness map's red channel, and the
    // overlay fades the coastal rise with it exactly as the surface does.
    uniforms.uWaterMask.value = getTexture('earthRoughness')
    uniforms.uTerrainScale.value = hasElevation ? (terrain?.scale ?? 0) : 0
    uniforms.uTerrainBias.value = hasElevation ? (terrain?.bias ?? 0) : 0
    uniforms.uTerrainUvOffset.value = uvOffsetU
    // One texel of the uploaded model: a quality switch can change its width.
    const image = heightMap.image as
      | { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number }
      | undefined
    uniforms.uTerrainTexel.value.set(
      1 / (image?.naturalWidth ?? image?.width ?? 2048),
      1 / (image?.naturalHeight ?? image?.height ?? 1024),
    )
    // The mesh whose facets the overlay has to sit on. It changes with the level
    // of detail, so it is a live uniform rather than a shader constant.
    uniforms.uMeshSegments.value.set(meshColumns, meshRows)
    // A hair toward the camera, so a line coplanar with the ground it lies on
    // wins the depth test instead of stippling against it. The shader works in
    // world units, so the fraction of the radius becomes a world distance here.
    uniforms.uCameraLift.value = visuals.cameraLift * radius
  }, [uniforms, terrain, uvOffsetU, radius, meshColumns, meshRows, visuals, quality])

  const sampler = useMemo(
    () => createElevationSampler(uvOffsetU, meshColumns, meshRows),
    // `quality` can swap in a differently sized elevation model, so the texel
    // floor has to be measured again even when the mesh rung is unchanged.
    [uvOffsetU, meshColumns, meshRows, quality],
  )

  // The dots that answer the pointer: the cities that never carry a name. A city
  // that already carries one would only be given a second label, so it is left
  // to the names (see `pickUnlabelledCity`).
  const hoverCandidates = useMemo<HoverCandidate[]>(() => {
    if (!data) return []
    const candidates: HoverCandidate[] = []
    for (const place of data.places) {
      if (place.label === 1) continue
      const [x, y, z] = lonLatToDirection(place.lon, place.lat, uvOffsetU)
      const ground = sampler ? sampler(place.lon, place.lat) : { height: 0, taper: 1 }
      candidates.push({
        place,
        dir: new Vector3(x, y, z),
        height: ground.height,
        taper: ground.taper,
      })
    }
    return candidates
  }, [data, uvOffsetU, sampler])

  // The pointer's own position, tracked on the canvas. A drag clears it (the
  // viewer is turning the globe, not pointing at a city), and so does leaving the
  // canvas for the interface. Touch is ignored: hovering is a mouse gesture, and
  // a finger has no hover state to leave.
  useEffect(() => {
    const canvas = gl.domElement
    const track = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const bounds = canvas.getBoundingClientRect()
      pointerRef.current =
        event.buttons === 0
          ? { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
          : null
    }
    const forget = () => {
      pointerRef.current = null
    }
    canvas.addEventListener('pointermove', track)
    canvas.addEventListener('pointerdown', forget)
    canvas.addEventListener('pointerleave', forget)
    canvas.addEventListener('pointercancel', forget)
    return () => {
      canvas.removeEventListener('pointermove', track)
      canvas.removeEventListener('pointerdown', forget)
      canvas.removeEventListener('pointerleave', forget)
      canvas.removeEventListener('pointercancel', forget)
    }
  }, [gl])

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

  // Which names are drawn. The city names carry their capitals always; the
  // country names carry them only when asked, because a capital's badge beside
  // its own country's name hides the smaller countries. Countries and cities
  // arrive in importance tiers — the big names from the first close-up, the rest
  // once the viewer zooms in — followed by the state/provincial capitals, then
  // cities of a million people or more at the closest tier, so they never crowd
  // the wider views.
  const labelEntries = useMemo<MapLabelEntry[]>(() => {
    if (!data) return []
    const places = labelledPlaces(data.places)
    const entries: MapLabelEntry[] = []
    if (showCountryNames) {
      for (const country of data.countries) {
        if (country.tier <= labelTier) {
          entries.push({
            kind: 'country',
            name: countryName(country, language),
            lon: country.lon,
            lat: country.lat,
          })
        }
      }
    } else {
      for (const place of places) {
        if (place.cap === 0 && place.tier <= labelTier) {
          entries.push({
            // A provincial seat keeps its own badge, even when its population
            // would also have earned it a plain city name.
            kind: place.stateCap === 1 ? 'state' : 'city',
            name: placeName(place, language),
            lon: place.lon,
            lat: place.lat,
          })
        }
      }
    }
    // Capitals last, so their badges paint over the plain names.
    if (!showCountryNames || showCapitalNames) {
      for (const place of places) {
        if (place.cap === 1) {
          entries.push({ kind: 'capital', name: placeName(place, language), lon: place.lon, lat: place.lat })
        }
      }
    }
    return entries
  }, [data, language, showCountryNames, showCapitalNames, labelTier])

  // The hovered city's name, in its own one-entry overlay so that moving between
  // dots never rebuilds the several hundred names above.
  const hoverEntries = useMemo<MapLabelEntry[]>(
    () =>
      hovered
        ? [
            {
              kind: hovered.stateCap === 1 ? 'state' : 'city',
              name: placeName(hovered, language),
              lon: hovered.lon,
              lat: hovered.lat,
            },
          ]
        : [],
    [hovered, language],
  )

  useFrame(({ camera, size }) => {
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
    // threshold reveals the smaller capitals and cities; a third reveals the
    // state/provincial capitals; a fourth, closer one reveals the million-plus
    // cities.
    const wanted = showLabels && apparent > (labelsVisible ? visuals.labelFade[0] : visuals.labelFade[1])
    if (wanted !== labelsVisible) setLabelsVisible(wanted)
    let nextTier = 0
    if (showLabels) {
      const detail =
        apparent > (labelTier >= 1 ? visuals.labelDetailFade[0] : visuals.labelDetailFade[1])
      if (detail) nextTier = 1
      const regional =
        apparent > (labelTier >= 2 ? visuals.labelStateFade[0] : visuals.labelStateFade[1])
      if (regional) nextTier = 2
      const million =
        apparent > (labelTier >= 3 ? visuals.labelMillionFade[0] : visuals.labelMillionFade[1])
      if (million) nextTier = 3
    }
    if (nextTier !== labelTier) setLabelTier(nextTier)

    // Name the city under the pointer, if it is one that carries no name of its
    // own. The dots are only worth aiming at once Earth is large enough for the
    // permanent names to be about to appear, and the test runs every frame so a
    // turning globe takes the name away with the dot.
    const pointer = pointerRef.current
    const picked =
      pointer && apparent > visuals.labelFade[1]
        ? pickUnlabelledCity(
            hoverCandidates,
            camera,
            group,
            terrain,
            visuals,
            pointer,
            size.width,
            size.height,
          )
        : null
    if (picked !== hoveredRef.current) {
      hoveredRef.current = picked
      setHovered(picked)
    }
  })

  if (!data) return null

  return (
    <group ref={groupRef} scale={radius}>
      {borders ? <primitive object={borders} /> : null}
      {regions ? <primitive object={regions} /> : null}
      {markers ? <primitive object={markers} /> : null}
      {labelsVisible ? (
        <MapLabels
          entries={labelEntries}
          uvOffsetU={uvOffsetU}
          sampler={sampler}
          terrain={terrain}
          groupRef={groupRef}
          visuals={visuals}
        />
      ) : null}
      {/* The hovered city's name gets its own overlay, so the permanent names are
          never rebuilt when the pointer moves from one dot to the next. It is not
          tied to the labels' switch: the dots always answer the pointer. */}
      {hoverEntries.length > 0 ? (
        <MapLabels
          entries={hoverEntries}
          uvOffsetU={uvOffsetU}
          sampler={sampler}
          terrain={terrain}
          groupRef={groupRef}
          visuals={visuals}
        />
      ) : null}
    </group>
  )
}
