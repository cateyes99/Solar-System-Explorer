import { PLANETS } from '../data/planets';
import type { ScaleMode } from '../store/simulationStore';

// Deliberately designed "educational" distances (scene units) and sizes.
// Real scale would make planets invisible, so we compress distances with a
// roughly logarithmic mapping and exaggerate small planets.

const EDU_DIST = [14, 18, 23, 28, 38, 50, 61, 71, 80];
const EDU_SIZE = [0.5, 0.85, 0.95, 0.7, 2.9, 2.5, 1.7, 1.65, 0.4];

export function planetIndex(id: string): number {
  return PLANETS.findIndex((p) => p.id === id);
}

/* --- Real orbital elements: NASA JPL Keplerian Elements & Rates, Table 1
   (fit 1800–2050; https://ssd.jpl.nasa.gov/planets/approx_pos.html).
   a [AU], e, i/L/lp/node [deg] at J2000 + rates per Julian century.
   Pluto was dropped from JPL's table after reclassification; its elements are
   the classic JPL listings (rate from its 90,560-day period). */
type Elements = {
  a: number; da: number; e: number; de: number; i: number; di: number;
  L: number; dL: number; lp: number; dlp: number; node: number; dnode: number;
};
const ELEMENTS: Record<string, Elements> = {
  mercury: { a: 0.38709927, da: 0.00000037, e: 0.20563593, de: 0.00001906, i: 7.00497902, di: -0.00594749, L: 252.2503235, dL: 149472.67411175, lp: 77.45779628, dlp: 0.16047689, node: 48.33076593, dnode: -0.12534081 },
  venus: { a: 0.72333566, da: 0.0000039, e: 0.00677672, de: -0.00004107, i: 3.39467605, di: -0.0007889, L: 181.9790995, dL: 58517.81538729, lp: 131.60246718, dlp: 0.00268329, node: 76.67984255, dnode: -0.27769418 },
  earth: { a: 1.00000261, da: 0.00000562, e: 0.01671123, de: -0.00004392, i: -0.00001531, di: -0.01294668, L: 100.46457166, dL: 35999.37244981, lp: 102.93768193, dlp: 0.32327364, node: 0, dnode: 0 },
  mars: { a: 1.52371034, da: 0.00001847, e: 0.0933941, de: 0.00007882, i: 1.84969142, di: -0.00813131, L: -4.55343205, dL: 19140.30268499, lp: -23.94362959, dlp: 0.44441088, node: 49.55953891, dnode: -0.29257343 },
  jupiter: { a: 5.202887, da: -0.00011607, e: 0.04838624, de: -0.00013253, i: 1.30439695, di: -0.00183714, L: 34.39644051, dL: 3034.74612775, lp: 14.72847983, dlp: 0.21252668, node: 100.47390909, dnode: 0.20469106 },
  saturn: { a: 9.53667594, da: -0.0012506, e: 0.05386179, de: -0.00050991, i: 2.48599187, di: 0.00193609, L: 49.95424423, dL: 1222.49362201, lp: 92.59887831, dlp: -0.41897216, node: 113.66242448, dnode: -0.28867794 },
  uranus: { a: 19.18916464, da: -0.00196176, e: 0.04725744, de: -0.00004397, i: 0.77263783, di: -0.00242939, L: 313.23810451, dL: 428.48202785, lp: 170.9542763, dlp: 0.40805281, node: 74.01692503, dnode: 0.04240589 },
  neptune: { a: 30.06992276, da: 0.00026291, e: 0.00859048, de: 0.00005105, i: 1.77004347, di: 0.00035372, L: -55.12002969, dL: 218.45945325, lp: 44.96476227, dlp: -0.32241464, node: 131.78422574, dnode: -0.00508664 },
  pluto: { a: 39.482, da: 0, e: 0.2488, de: 0, i: 17.16, di: 0, L: 238.929, dL: 145.18, lp: 224.069, dlp: 0, node: 110.299, dnode: 0 },
};

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;
/** Days from J2000 (2000-01-01 12:00) to sim day 0 (2026-01-01). */
const J2000_TO_SIM0 = 9496.5;

/** Solve Kepler's equation M = E − e·sinE (radians, Newton iterations). */
function keplerE(M: number, e: number): number {
  let E = M + e * Math.sin(M);
  for (let k = 0; k < 6; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

/** Rotate orbital-plane coords (x' toward perihelion) to ecliptic via JPL's
 *  Rz(−Ω) Rx(−I) Rz(−ω) frame rotation. Returns [x, y, z_eclNorth]. */
function toEcliptic(xp: number, yp: number, w: number, node: number, inc: number): [number, number, number] {
  const cw = Math.cos(w), sw = Math.sin(w);
  const co = Math.cos(node), so = Math.sin(node);
  const ci = Math.cos(inc), si = Math.sin(inc);
  return [
    (cw * co - sw * so * ci) * xp + (-sw * co - cw * so * ci) * yp,
    (cw * so + sw * co * ci) * xp + (-sw * so + cw * co * ci) * yp,
    (sw * si) * xp + (cw * si) * yp,
  ];
}

/** True heliocentric ecliptic position in AU (JPL method, e.g. Earth is at
 *  0.9833 AU on Jan 4 — perihelion — as it should be). */
export function trueEclipticAU(idx: number, simDays: number): [number, number, number] {
  const el = ELEMENTS[PLANETS[idx].id];
  const T = (J2000_TO_SIM0 + simDays) / 36525;
  const a = el.a + el.da * T;
  const e = el.e + el.de * T;
  const inc = (el.i + el.di * T) * D2R;
  const L = (el.L + el.dL * T) * D2R;
  const lp = (el.lp + el.dlp * T) * D2R;
  const node = (el.node + el.dnode * T) * D2R;
  const M = (((L - lp) % TAU) + TAU) % TAU;
  const E = keplerE(M, e);
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(E);
  return toEcliptic(xp, yp, lp - node, node, inc);
}

function sceneOrbitDistance(idx: number, rAU: number, mode: ScaleMode, distMult: number): number {
  const a = ELEMENTS[PLANETS[idx].id].a;
  switch (mode) {
    case 'educational':
      // designed distances at mean radius; eccentricity breathes around them
      return EDU_DIST[idx] * (rAU / a);
    case 'relative':
      // sizes true-ish relative, distances still compressed so everything fits
      return 12 + rAU * 4.2;
    case 'distances':
      return 12 + Math.sqrt(Math.max(rAU, 0.01)) * 22;
    case 'custom':
      return EDU_DIST[idx] * distMult * (rAU / a);
  }
}

/** Scene position. Direction/tilt/node are true in every scale mode (radial
 *  remap preserves them); only the radial profile is compressed for viewing. */
export function orbitalPosition(idx: number, simDays: number, mode: ScaleMode, distMult: number, massBoost = 1): [number, number, number] {
  const [x, y, z] = trueEclipticAU(idx, simDays);
  const r = Math.hypot(x, y, z);
  const d = sceneOrbitDistance(idx, r, mode, distMult) / Math.sqrt(massBoost);
  const k = d / Math.max(r, 1e-6);
  // scene: X = ecliptic x, Y(up) = ecliptic north, Z = ecliptic y
  return [x * k, z * k, y * k];
}

export function planetRadius(idx: number, mode: ScaleMode, sizeMult: number, bigEarth = false): number {
  let r: number;
  if (mode === 'relative') {
    // true diameter ratios, scaled so Jupiter ≈ 3.2
    const jup = PLANETS[4].diameterKm;
    r = (PLANETS[idx].diameterKm / jup) * 3.2;
    if (idx === 2 && bigEarth) r = 3.2;
    r = Math.max(r, 0.22);
  } else if (mode === 'custom') {
    r = EDU_SIZE[idx] * sizeMult;
    if (idx === 2 && bigEarth) r = 2.9 * sizeMult;
  } else {
    r = EDU_SIZE[idx];
    if (idx === 2 && bigEarth) r = 2.9;
  }
  return r;
}

export function sunRadius(mode: ScaleMode, sizeMult: number): number {
  if (mode === 'relative') return 7.5;
  if (mode === 'custom') return 5 * sizeMult;
  return 5;
}

export const EARTH_INDEX = 2;
export const MOON_ORBIT_RADIUS_ADD = 1.7;
export const MOON_ORBIT_Y = 0.2;

/* Lunar theory (low-precision, after Schlyter's widely published algorithm):
   e = 0.0549, i = 5.145° to the ecliptic, sidereal period 27.321661 d. */
const LUNAR = {
  e: 0.0549,
  inclDeg: 5.145,
  L0: 218.316, Lrate: 13.176396, // mean longitude, deg/day
  perigee0: 83.353, perigeeRate: 0.11141, // longitude of perigee, deg/day
  node0: 125.044, nodeRate: -0.052954, // ascending node, deg/day (regresses)
};

/** Geocentric ecliptic UNIT direction to the Moon + true range (in units of
 *  its semi-major axis, ≈0.945–1.055). */
function moonGeoEcliptic(simDays: number): { dir: [number, number, number]; range: number } {
  const d = J2000_TO_SIM0 + simDays;
  const L = (LUNAR.L0 + LUNAR.Lrate * d) * D2R;
  const lp = (LUNAR.perigee0 + LUNAR.perigeeRate * d) * D2R;
  const node = (LUNAR.node0 + LUNAR.nodeRate * d) * D2R;
  const M = (((L - lp) % TAU) + TAU) % TAU;
  const E = keplerE(M, LUNAR.e);
  const xp = Math.cos(E) - LUNAR.e;
  const yp = Math.sqrt(1 - LUNAR.e * LUNAR.e) * Math.sin(E);
  const [x, y, z] = toEcliptic(xp, yp, lp - node, node, LUNAR.inclDeg * D2R);
  const r = Math.hypot(x, y, z);
  return { dir: [x / r, y / r, z / r], range: r };
}

/** World position of the Moon = Earth position + true lunar direction.
 *  Manual phase p (lesson slider): 0 = new (toward the Sun), 0.5 = full. */
export function moonWorldPosition(
  simDays: number,
  mode: ScaleMode,
  distMult: number,
  massBoost: number,
  sizeMult: number,
  bigEarth: boolean,
  manual: boolean,
  phase: number,
): [number, number, number] {
  const e = orbitalPosition(EARTH_INDEX, simDays, mode, distMult, massBoost);
  const r = planetRadius(EARTH_INDEX, mode, sizeMult, bigEarth);
  const R = r + MOON_ORBIT_RADIUS_ADD;
  if (manual) {
    const sunAng = Math.atan2(-e[2], -e[0]);
    const a = sunAng + phase * TAU;
    return [e[0] + Math.cos(a) * R, MOON_ORBIT_Y, e[2] + Math.sin(a) * R];
  }
  const { dir, range } = moonGeoEcliptic(simDays);
  const RR = R * range;
  // same scene mapping as planets: X = ecliptic x, Y = ecliptic north
  return [e[0] + dir[0] * RR, e[1] + dir[2] * RR, e[2] + dir[1] * RR];
}

/** Moon-phase cycle for the lesson widget: 0 = new, 0.5 = full
 *  (waxing 0→0.5, waning 0.5→1), from true Sun–Earth–Moon geometry. */
export function moonCyclePhase(simDays: number): number {
  const { dir } = moonGeoEcliptic(simDays);
  const e = trueEclipticAU(EARTH_INDEX, simDays);
  const el = Math.hypot(e[0], e[1], e[2]);
  const sun: [number, number, number] = [-e[0] / el, -e[1] / el, -e[2] / el];
  const elong = Math.acos(Math.min(1, Math.max(-1, dir[0] * sun[0] + dir[1] * sun[1] + dir[2] * sun[2])));
  const lonM = Math.atan2(dir[1], dir[0]);
  const lonS = Math.atan2(sun[1], sun[0]);
  const waxing = ((((lonM - lonS) % TAU) + TAU) % TAU) < Math.PI;
  const cyc = elong / TAU;
  return waxing ? cyc : 1 - cyc;
}

export function formatSimDate(simDays: number): string {
  const base = Date.UTC(2026, 0, 1);
  const t = new Date(base + simDays * 86400000);
  return t.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/* ---------------- Halley's Comet: long eccentric retrograde ellipse --------
   Real Halley: period ~75.3y, e ≈ 0.967, diving to 0.59 AU and retreating to
   35 AU, orbiting backwards. Scene units compress that shape (perihelion 8,
   aphelion 95) and run it on a visual period so kids can watch the swoop.
   Motion follows real Kepler mechanics: fast near the Sun, slow far away. */

export const HALLEY_ORBIT = {
  perihelion: 8,
  aphelion: 95,
  /** visual period in sim-days (real one is ~27,500 days — far too slow to see) */
  periodDays: 750,
  /** orbital plane tilt vs the ecliptic, degrees (real: 162°, i.e. backwards) */
  tiltDeg: 18,
};

const HALLEY_A = (HALLEY_ORBIT.perihelion + HALLEY_ORBIT.aphelion) / 2;
const HALLEY_E = (HALLEY_ORBIT.aphelion - HALLEY_ORBIT.perihelion) / (HALLEY_ORBIT.aphelion + HALLEY_ORBIT.perihelion);
const HALLEY_TILT = (HALLEY_ORBIT.tiltDeg * Math.PI) / 180;
const HALLEY_M0 = 1.0; // starting mean anomaly — Halley begins inbound

/** Solve Kepler's equation M = E − e·sinE (Newton iterations). */
export function halleyEccentricAnomaly(simDays: number): number {
  const M = HALLEY_M0 - ((simDays / HALLEY_ORBIT.periodDays) * Math.PI * 2) % (Math.PI * 2);
  let E = M;
  for (let i = 0; i < 5; i++) E = E - (E - HALLEY_E * Math.sin(E) - M) / (1 - HALLEY_E * Math.cos(E));
  return E;
}

/** Distance from the Sun in scene units (for tail/brightness effects). */
export function halleySunDistance(simDays: number): number {
  const E = halleyEccentricAnomaly(simDays);
  return HALLEY_A * (1 - HALLEY_E * Math.cos(E));
}

/** World position — retrograde (backwards vs the planets) and tilted. */
export function halleyPosition(simDays: number): [number, number, number] {
  const E = halleyEccentricAnomaly(simDays);
  // true anomaly from eccentric anomaly
  const nu = 2 * Math.atan2(Math.sqrt(1 + HALLEY_E) * Math.sin(E / 2), Math.sqrt(1 - HALLEY_E) * Math.cos(E / 2));
  return halleyPositionAtAnomaly(nu);
}

/** Position at a given true anomaly. Sampling the path uniformly in angle
 *  (not time) keeps point spacing even around the sharp perihelion turn,
 *  where the comet itself spends almost no time (Kepler's 2nd law). */
export function halleyPositionAtAnomaly(nu: number): [number, number, number] {
  const r = HALLEY_A * (1 - HALLEY_E * HALLEY_E) / (1 + HALLEY_E * Math.cos(nu));
  const u = r * Math.cos(nu);
  const w = r * Math.sin(nu);
  // retrograde + tilted out of the ecliptic
  return [u, w * Math.sin(HALLEY_TILT), -w * Math.cos(HALLEY_TILT)];
}
