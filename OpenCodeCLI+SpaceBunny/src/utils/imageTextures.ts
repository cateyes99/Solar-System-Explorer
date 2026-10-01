import * as THREE from 'three'
import { MOONS, PLANETS } from '../data/planets'
import type { PlanetId } from '../types'

/**
 * Real NASA/JPL/USGS imagery, used in place of the procedural painter wherever a
 * true equirectangular map is available.
 *
 * Every file in `public/textures` is a 2:1 equirectangular map, which is what a
 * sphere's UV layout requires. Rendered globes and ordinary photographs are
 * deliberately excluded: wrapping them on a sphere looks wrong.
 *
 * Two bodies have no public 2:1 map and keep their procedural texture. Uranus is
 * the clear case: NASA has published maps of its moons but only ever *rendered
 * globes* of Uranus itself, so there is nothing to wrap on a sphere. The Sun is
 * procedural for the same reason — a photograph of the photosphere does not tile
 * around the limb. Both are honest: Uranus really is a featureless pale cyan
 * disc, and Saturn-style banding on it would be an invention.
 *
 * Sources are NASA / ESA / USGS public-domain products. See
 * `scripts/fetch-textures.ps1` for the exact URLs, which are fetched once and
 * committed so the app never needs network access at runtime.
 */

const TEXTURE_DIR = '/textures'

/** Maps a body id to its committed file, when one exists. */
const REAL_MAPS: Record<string, string> = {
  mercury: 'mercury.jpg',
  venus: 'venus.jpg',
  // Blue Marble, re-encoded from the upstream PNG (see fetch-textures.ps1).
  earth: 'earth.jpg',
  mars: 'mars.jpg',
  jupiter: 'jupiter.jpg',
  saturn: 'saturn.jpg',
  neptune: 'neptune.jpg',
  luna: 'luna.jpg',
  io: 'io.jpg',
  europa: 'europa.jpg',
  ganymede: 'ganymede.jpg',
  callisto: 'callisto.jpg',
  titan: 'titan.jpg',
  enceladus: 'enceladus.jpg',
  rhea: 'rhea.jpg',
  dione: 'dione.jpg',
  iapetus: 'iapetus.jpg',
  mimas: 'mimas.jpg',
  tethys: 'tethys.jpg',
  triton: 'triton.jpg',
  ariel: 'ariel.jpg',
  miranda: 'miranda.jpg',
  titania: 'titania.jpg',
  oberon: 'oberon.jpg',
  umbriel: 'umbriel.jpg',
  phobos: 'phobos.jpg',
  deimos: 'deimos.jpg',
}

/** Bodies with no public equirectangular map, which stay procedural. */
export const PROCEDURAL_ONLY: string[] = ['uranus', 'sun']

const loaded = new Map<string, THREE.Texture>()
const inFlight = new Map<string, Promise<THREE.Texture | null>>()
const loader = new THREE.TextureLoader()

function configure(texture: THREE.Texture): THREE.Texture {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  // Longitude wraps around the sphere; latitude must not, or the poles smear.
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

export function hasRealTexture(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(REAL_MAPS, id)
}

/** Synchronous peek at an already-loaded map, or null. */
export function realTextureNow(id: string): THREE.Texture | null {
  return loaded.get(id) ?? null
}

/** Loads a body map, resolving to null when the body has no real imagery. */
export function loadRealTexture(id: string): Promise<THREE.Texture | null> {
  const file = REAL_MAPS[id]
  if (!file) return Promise.resolve(null)

  const cached = loaded.get(id)
  if (cached) return Promise.resolve(cached)
  const pending = inFlight.get(id)
  if (pending) return pending

  const task = new Promise<THREE.Texture | null>((resolve) => {
    loader.load(
      `${TEXTURE_DIR}/${file}`,
      (texture) => {
        const ready = configure(texture)
        loaded.set(id, ready)
        inFlight.delete(id)
        resolve(ready)
      },
      undefined,
      () => {
        inFlight.delete(id)
        resolve(null)
      },
    )
  })
  inFlight.set(id, task)
  return task
}

/** Every body id that has committed imagery. */
export function realTextureIds(): string[] {
  return Object.keys(REAL_MAPS)
}

/** All moon ids that have committed imagery, for the preload list. */
export function moonIdsWithImagery(): string[] {
  return MOONS.filter((m) => hasRealTexture(m.id)).map((m) => m.id)
}

/** Every planet id that has committed imagery. */
export function planetIdsWithImagery(): PlanetId[] {
  return PLANETS.filter((p) => hasRealTexture(p.id)).map((p) => p.id)
}
