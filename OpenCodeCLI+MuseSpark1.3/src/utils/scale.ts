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

export function planetDistance(idx: number, mode: ScaleMode, distMult: number, massBoost = 1): number {
  const au = PLANETS[idx].distanceAU;
  let d: number;
  switch (mode) {
    case 'educational':
      d = EDU_DIST[idx];
      break;
    case 'relative':
      // sizes true-ish relative, distances still compressed so everything fits
      d = 12 + au * 4.2;
      break;
    case 'distances':
      d = 12 + Math.sqrt(au) * 22;
      break;
    case 'custom':
      d = EDU_DIST[idx] * distMult;
      break;
  }
  // gravity demo: heavier sun "pulls orbits tighter" visually
  d = d / Math.sqrt(massBoost);
  return d;
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

export function orbitalAngle(idx: number, simDays: number): number {
  const period = PLANETS[idx].orbitalPeriodDays;
  const phase = idx * 0.85 + 1.2; // fixed nice spread
  return phase + (simDays / period) * Math.PI * 2;
}

export function orbitalPosition(idx: number, simDays: number, mode: ScaleMode, distMult: number, massBoost = 1): [number, number, number] {
  const d = planetDistance(idx, mode, distMult, massBoost);
  const a = orbitalAngle(idx, simDays);
  return [Math.cos(a) * d, 0, Math.sin(a) * d];
}

export const EARTH_INDEX = 2;
export const MOON_ORBIT_RADIUS_ADD = 1.7;
export const MOON_ORBIT_Y = 0.2;

/** Moon's orbital angle around Earth (matches the 3D Moon mesh). */
export function moonAngle(simDays: number, manual: boolean, phase: number): number {
  if (manual) return phase * Math.PI * 2;
  return simDays * 0.48 + EARTH_INDEX;
}

/** World position of the Moon = Earth position + lunar orbit offset. */
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
  const a = moonAngle(simDays, manual, phase);
  return [e[0] + Math.cos(a) * (r + MOON_ORBIT_RADIUS_ADD), MOON_ORBIT_Y, e[2] + Math.sin(a) * (r + MOON_ORBIT_RADIUS_ADD)];
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
  const r = HALLEY_A * (1 - HALLEY_E * HALLEY_E) / (1 + HALLEY_E * Math.cos(nu));
  const u = r * Math.cos(nu);
  const w = r * Math.sin(nu);
  // retrograde + tilted out of the ecliptic
  return [u, w * Math.sin(HALLEY_TILT), -w * Math.cos(HALLEY_TILT)];
}
