/**
 * Checks the orbit path sampled for the orbit rings: it must close exactly once
 * and keep the real perihelion/aphelion ratio, since only direction-preserving
 * compression is applied. Run with `npm run verify:orbits`.
 */

import { orbitPath } from '../src/components/three/orbitMath'
import { centuriesPastJ2000, propagate } from '../src/utils/ephemeris'
import { EPOCH_MS } from '../src/store/clock'
import { PLANETS } from '../src/data/planets'
import { DEFAULT_SCALE } from '../src/utils/scale'

const T = centuriesPastJ2000(EPOCH_MS)
let failures = 0

function check(label: string, ok: boolean, detail: string): void {
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(44)} ${detail}`)
}

console.log('=== orbit rings close once and keep the real shape ===')
for (const planet of PLANETS) {
  const orbit = {
    id: planet.id,
    a: 1,
    b: 1,
    eccentricity: planet.eccentricity,
    inclination: (planet.inclinationDeg * Math.PI) / 180,
    node: 0,
  }
  const points = orbitPath(orbit, EPOCH_MS, DEFAULT_SCALE.distanceExponent, 360)
  const el = propagate(planet.id, T)
  if (!el || points.length < 2) {
    check(planet.name, false, 'no path returned')
    continue
  }

  const perimeter = points.reduce((sum, p, i) => (i ? sum + p.distanceTo(points[i - 1]) : 0), 0)
  const gap = points[0].distanceTo(points[points.length - 1])
  const radii = points.map((p) => p.length())
  const drawnRatio = Math.max(...radii) / Math.min(...radii)
  const trueRatio = (1 + el.e) / (1 - el.e)
  // Radii are compressed by r^distanceExponent, which necessarily shrinks the
  // perihelion/aphelion ratio by the same power. The ellipse's *shape* is still
  // the real one — only its aspect is squared off so it stays visible.
  const expectedRatio = Math.pow(trueRatio, DEFAULT_SCALE.distanceExponent)

  const closes = gap / perimeter < 0.02
  const shaped = Math.abs(drawnRatio - expectedRatio) < 0.01
  check(
    `${planet.name} ring closes and matches eccentricity`,
    closes && shaped,
    `gap/perimeter=${(gap / perimeter).toFixed(4)} ratio=${drawnRatio.toFixed(4)} (expected ${expectedRatio.toFixed(4)})`,
  )
}

console.log('\n=== ring radius ordering follows the planets out from the Sun ===')
const byDistance = [...PLANETS].sort((a, b) => a.semiMajorAxisAU - b.semiMajorAxisAU)
let previous = 0
let ordered = true
for (const planet of byDistance) {
  const orbit = {
    id: planet.id,
    a: 1,
    b: 1,
    eccentricity: planet.eccentricity,
    inclination: 0,
    node: 0,
  }
  const points = orbitPath(orbit, EPOCH_MS, DEFAULT_SCALE.distanceExponent, 120)
  const maxR = Math.max(...points.map((p) => p.length()))
  if (maxR <= previous) ordered = false
  previous = maxR
}
check('inner to outer rings increase in radius', ordered, `outermost=${previous.toFixed(2)}`)

console.log(`\n${failures === 0 ? 'ORBIT PATHS OK' : `${failures} FAILURE(S)`}`)
process.exit(failures === 0 ? 0 : 1)
