import type { PlanetData, MoonData, ScaleMode } from '../types';
import { getScaleValue } from '../data/planets';

export function getPlanetScaleRadius(planet: PlanetData, mode: ScaleMode): number {
  return getScaleValue(planet, mode, 'radius');
}

export function getPlanetScaleDistance(planet: PlanetData, mode: ScaleMode): number {
  return getScaleValue(planet, mode, 'distance');
}

export function getMoonScaleRadius(moon: MoonData, mode: ScaleMode): number {
  return getScaleValue(moon, mode, 'radius');
}

export function getMoonScaleDistance(moon: MoonData, mode: ScaleMode): number {
  return getScaleValue(moon, mode, 'distance');
}

export function getScaleModeDescription(mode: ScaleMode): string {
  switch (mode) {
    case 'educational':
      return 'Educational Scale — Planets enlarged and distances compressed for clarity';
    case 'relative-size':
      return 'Relative Size — Planet sizes to scale, distances compressed';
    case 'distances':
      return 'Distances Emphasized — Orbit distances to scale, planets enlarged for visibility';
    case 'custom':
      return 'Custom Scale — Adjust manually';
    default:
      return '';
  }
}

export function getScaleModeShortLabel(mode: ScaleMode): string {
  switch (mode) {
    case 'educational': return 'Educational';
    case 'relative-size': return 'Relative Size';
    case 'distances': return 'Distances';
    case 'custom': return 'Custom';
  }
}

export const scaleModeOptions: { value: ScaleMode; label: string; description: string }[] = [
  { value: 'educational', label: 'Educational', description: 'Best for learning — planets and orbits clearly visible' },
  { value: 'relative-size', label: 'Relative Size', description: 'True planet size ratios, orbits compressed' },
  { value: 'distances', label: 'Distances', description: 'True orbital distance ratios, planets enlarged' },
  { value: 'custom', label: 'Custom', description: 'Manual adjustment of size and distance scales' },
];

export function interpolateScale(
  educational: number,
  relativeSize: number,
  distances: number,
  mode: ScaleMode,
  customValue?: number
): number {
  switch (mode) {
    case 'educational': return educational;
    case 'relative-size': return relativeSize;
    case 'distances': return distances;
    case 'custom': return customValue ?? educational;
    default: return educational;
  }
}

export function getOrbitalSpeedMultiplier(mode: ScaleMode): number {
  switch (mode) {
    case 'educational': return 1;
    case 'relative-size': return 1;
    case 'distances': return 0.5;
    case 'custom': return 1;
    default: return 1;
  }
}

export function getCameraDistanceForScale(mode: ScaleMode): number {
  switch (mode) {
    case 'educational': return 500;
    case 'relative-size': return 800;
    case 'distances': return 1500;
    case 'custom': return 500;
    default: return 500;
  }
}

export function getMinOrbitRadius(mode: ScaleMode): number {
  switch (mode) {
    case 'educational': return 25;
    case 'relative-size': return 25;
    case 'distances': return 20;
    case 'custom': return 25;
    default: return 25;
  }
}