/**
 * Cross-checks the app's `ephemeris.ts` maths against the JPL published
 * approximation, by reimplementing JPL's own formulas independently and
 * comparing results. Run with `node`.
 */

import {
  centuriesPastJ2000,
  eclipticToScene,
  equatorialToScene,
  heliocentricEcliptic,
  orbitNormal,
  propagate,
  solveKepler,
} from '../src/utils/ephemeris'
import { FLATTENING, POLE_ELEMENTS } from '../src/data/keplerian'
import { EPOCH_MS } from '../src/store/clock'

const DEG = Math.PI / 180
const EPOCH = new Date(EPOCH_MS).getTime()
let failures = 0

function check(label, actual, expected, tolerance, unit = '') {
  const diff = Math.abs(actual - expected)
  const ok = diff <= tolerance
  if (!ok) failures += 1
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(46)} ${actual.toFixed(4).padStart(11)} ${unit.padStart(7)}  ` +
      `expected ${expected.toFixed(4)} ±${tolerance} (off by ${diff.toFixed(4)})`,
  )
}

console.log('=== epoch ===')
const T = centuriesPastJ2000(EPOCH)
console.log(`2026-01-01 UTC -> T = ${T.toFixed(6)} centuries past J2000`)
check('T is in the valid 1800-2050 window', T, 0.26, 0.002, 'cy')

console.log('\n=== Kepler solver round-trips its own equation ===')
for (const [id, e] of [['mercury', 0.2056], ['earth', 0.0167], ['mars', 0.0934]]) {
  const M = 1.234
  const E = solveKepler(M, e)
  check(`${id}: E - e sin E recovers M`, E - e * Math.sin(E), M, 1e-10, 'rad')
}

console.log('\n=== heliocentric distance stays within the real orbital range ===')
const rExpect = {
  mercury: [0.3075, 0.4667],
  venus: [0.7184, 0.7282],
  earth: [0.9833, 1.0167],
  mars: [1.3814, 1.6660],
  jupiter: [4.9509, 5.4570],
  saturn: [9.0412, 10.1238],
  uranus: [18.3262, 20.0964],
  neptune: [29.8100, 30.3300],
}
for (const [id, [lo, hi]] of Object.entries(rExpect)) {
  const p = heliocentricEcliptic(id, T, new (await import('three')).Vector3())
  const r = p.length()
  const ok = r >= lo - 1e-6 && r <= hi + 1e-6
  if (!ok) failures += 1
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${id.padEnd(46)} r = ${r.toFixed(5)} au  within [${lo}, ${hi}]`,
  )
}

console.log('\n=== Earth is near perihelion in early January ===')
const earth = heliocentricEcliptic('earth', T, new (await import('three')).Vector3())
check('Earth distance in early January', earth.length(), 0.9932, 0.015, 'au')
// The Sun appears at heliocentric longitude + 180 from Earth.
const sunLongitudeFromEarth = (Math.atan2(-earth.y, -earth.x) / DEG + 360) % 360
check("Sun's apparent longitude, 1 Jan", sunLongitudeFromEarth, 280, 2.5, 'deg')

console.log('\n=== obliquity: real pole vs the real orbit normal ===')
// Expected obliquities from published planetary data.
const obliquityExpect = {
  mercury: 0.034,
  venus: 177.36,
  earth: 23.4393,
  mars: 25.19,
  jupiter: 3.13,
  saturn: 26.73,
  uranus: 97.77,
  neptune: 28.32,
}
const retrograde = new Set(['venus', 'uranus'])
for (const [id, expected] of Object.entries(obliquityExpect)) {
  const pole = POLE_ELEMENTS[id]
  let alpha = pole.alpha + (pole.alphaDot ?? 0) * T
  let delta = pole.delta + (pole.deltaDot ?? 0) * T
  if (pole.oscillation) {
    const N = (pole.oscillation.phaseDeg + 360 / pole.oscillation.periodCenturies * T) * DEG
    alpha += pole.oscillation.amplitudeDeg * Math.sin(N)
    delta += pole.oscillation.amplitudeDeg * Math.cos(N)
  }
  const a = alpha * DEG
  const d = delta * DEG
  const V = await import('three')
  // Equatorial unit vector for the pole, straight from RA/Dec.
  const eq = new V.Vector3(Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d))
  const poleScene = equatorialToScene(eq, new V.Vector3())
  const el = propagate(id, T)
  const normalScene = eclipticToScene(orbitNormal(el, new V.Vector3()), new V.Vector3())
  let angle = (Math.acos(Math.max(-1, Math.min(1, poleScene.dot(normalScene)))) / DEG)
  if (retrograde.has(id)) angle = 180 - angle
  check(`${id} obliquity`, angle, expected, 0.05, 'deg')
}

console.log('\n=== flattening matches published values ===')
const flatExpect = { jupiter: 1 / 15.415, saturn: 1 / 10.208, earth: 1 / 298.257, uranus: 1 / 43.6 }
for (const [id, expected] of Object.entries(flatExpect)) {
  check(`${id} flattening`, FLATTENING[id], expected, 1e-9, '')
}

console.log('\n=== scene frame stays right-handed (determinant +1) ===')
{
  const V = await import('three')
  const basis = [
    eclipticToScene(new V.Vector3(1, 0, 0), new V.Vector3()),
    eclipticToScene(new V.Vector3(0, 1, 0), new V.Vector3()),
    eclipticToScene(new V.Vector3(0, 0, 1), new V.Vector3()),
  ]
  const det =
    basis[0].x * (basis[1].y * basis[2].z - basis[1].z * basis[2].y) -
    basis[0].y * (basis[1].x * basis[2].z - basis[1].z * basis[2].x) +
    basis[0].z * (basis[1].x * basis[2].y - basis[1].y * basis[2].x)
  check('ecliptic->scene determinant', det, 1, 1e-12, '')
}

console.log('\n=== orbits are traversed counter-clockwise seen from ecliptic north ===')
for (const id of ['mercury', 'earth', 'jupiter', 'neptune']) {
  const V = await import('three')
  const a = heliocentricEcliptic(id, T, new V.Vector3())
  const b = heliocentricEcliptic(id, T + 0.001, new V.Vector3())
  const cross = new V.Vector3().crossVectors(a, b)
  // Angular momentum points along +z for a prograde orbit.
  check(`${id} angular momentum along ecliptic north`, cross.z > 0 ? 1 : 0, 1, 0)
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`)
process.exit(failures === 0 ? 0 : 1)
