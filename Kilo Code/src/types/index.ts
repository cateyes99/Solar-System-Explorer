import type * as THREE from 'three';

export type ScaleMode = 'educational' | 'relative-size' | 'distances' | 'custom';

export type CameraMode = 'solar-system' | 'planet' | 'follow';

export type ViewMode = 'explore' | 'learn' | 'cinematic' | 'whatif' | 'spacecraft';

export interface PlanetData {
  id: string;
  name: string;
  type: 'terrestrial' | 'gas-giant' | 'ice-giant' | 'star' | 'dwarf';
  diameterKm: number;
  distanceFromSunKm: number;
  orbitalPeriodDays: number;
  rotationPeriodHours: number;
  moons: number;
  temperatureC: number;
  axialTiltDeg: number;
  color: string;
  description: string;
  facts: string[];
  textureFeatures?: {
    hasRings?: boolean;
    hasGreatRedSpot?: boolean;
    hasClouds?: boolean;
    hasAtmosphere?: boolean;
    hasCraters?: boolean;
    ringColor?: string;
    ringInnerRadius?: number;
    ringOuterRadius?: number;
  };
  orbitalSpeed: number;
  orbitalRadius: number;
  scaleRadius: {
    educational: number;
    'relative-size': number;
    distances: number;
    custom: number;
  };
  scaleDistance: {
    educational: number;
    'relative-size': number;
    distances: number;
    custom: number;
  };
}

export interface MoonData {
  id: string;
  name: string;
  planetId: string;
  diameterKm: number;
  distanceFromPlanetKm: number;
  orbitalPeriodDays: number;
  color: string;
  orbitalSpeed: number;
  orbitalRadius: number;
  scaleRadius: {
    educational: number;
    'relative-size': number;
    distances: number;
    custom: number;
  };
  scaleDistance: {
    educational: number;
    'relative-size': number;
    distances: number;
    custom: number;
  };
}

export interface StarData {
  position: [number, number, number];
  size: number;
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
}

export interface SimulationState {
  selectedPlanetId: string | null;
  hoveredPlanetId: string | null;
  cameraMode: CameraMode;
  cameraTarget: THREE.Vector3 | null;
  simulationSpeed: number;
  simulationDate: Date;
  isPaused: boolean;
  scaleMode: ScaleMode;
  showLabels: boolean;
  showOrbits: boolean;
  showStars: boolean;
  reducedMotion: boolean;
  soundEnabled: boolean;
  viewMode: ViewMode;
  cinematicTourActive: boolean;
  cinematicTourStep: number;
  cinematicTourProgress: number;
  spacecraftActive: boolean;
  spacecraftPosition: THREE.Vector3;
  spacecraftVelocity: THREE.Vector3;
  spacecraftTarget: string | null;
}

export interface UIState {
  planetPanelOpen: boolean;
  settingsPanelOpen: boolean;
  timeControlsOpen: boolean;
  missionControlOpen: boolean;
  tourControlsOpen: boolean;
  loading: boolean;
  loadingProgress: number;
  error: string | null;
  welcomeMessage: boolean;
  randomFact: string | null;
}

export interface CinematicTourStep {
  id: string;
  title: string;
  description: string;
  targetPosition: [number, number, number];
  targetLookAt: [number, number, number];
  duration: number;
  planetId?: string;
}

export interface WhatIfScenario {
  id: string;
  title: string;
  description: string;
  icon: string;
  apply: (planets: PlanetData[]) => PlanetData[];
  revert: (planets: PlanetData[]) => PlanetData[];
}

export interface RandomFact {
  id: string;
  fact: string;
  category: string;
}

export interface SpacecraftState {
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  speed: number;
  target: string | null;
  followMode: boolean;
}

export interface AudioState {
  enabled: boolean;
  ambientPlaying: boolean;
  masterVolume: number;
}