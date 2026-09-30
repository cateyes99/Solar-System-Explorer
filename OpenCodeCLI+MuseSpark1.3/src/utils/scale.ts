import { PLANETS } from '../data/planets';
import type { ScaleMode } from '../store/simulationStore';

// Deliberately designed "educational" distances (scene units) and sizes.
// Real scale would make planets invisible, so we compress distances with a
// roughly logarithmic mapping and exaggerate small planets.

const EDU_DIST = [14, 18, 23, 28, 38, 50, 61, 71];
const EDU_SIZE = [0.5, 0.85, 0.95, 0.7, 2.9, 2.5, 1.7, 1.65];

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

export function formatSimDate(simDays: number): string {
  const base = Date.UTC(2026, 0, 1);
  const t = new Date(base + simDays * 86400000);
  return t.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}
