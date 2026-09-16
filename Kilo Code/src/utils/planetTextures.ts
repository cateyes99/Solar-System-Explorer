import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useEffect, useState, useMemo, useRef } from 'react';

export interface PlanetTextureSet {
  color?: THREE.Texture;
  normal?: THREE.Texture;
  roughness?: THREE.Texture;
  clouds?: THREE.Texture;
  cloudsNormal?: THREE.Texture;
  loading: boolean;
  error: boolean;
}

// ===== PROCEDURAL TEXTURE CACHE (singletons) =====
const proceduralCache = new Map<string, THREE.DataTexture>();

function createProceduralTexture(type: string): THREE.DataTexture {
  if (proceduralCache.has(type)) return proceduralCache.get(type)!;

  const size = 1024;
  
  function hash(x: number, y: number): number {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }
  function noise(x: number, y: number): number {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    const x1 = a + (b - a) * ux, x2 = c + (d - c) * ux;
    return x1 + (x2 - x1) * uy;
  }
  function fbm(x: number, y: number, octaves: number): number {
    let v = 0, a = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) { v += a * (noise(x * f, y * f) * 2 - 1); a *= 0.5; f *= 2; }
    return v * 0.5 + 0.5;
  }
  function ridge(x: number, y: number, octaves: number): number {
    let v = 0, a = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) { v += a * (1 - Math.abs(noise(x * f, y * f) * 2 - 1)); a *= 0.5; f *= 2; }
    return v;
  }
  function clamp(v: number, min: number, max: number): number { return Math.max(min, Math.min(max, v)); }
  function smoothstep(e0: number, e1: number, x: number): number {
    const t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function uvToSpherical(uu: number, vv: number) {
    const phi = uu * Math.PI * 2, theta = (vv - 0.5) * Math.PI;
    return { lon: phi, lat: theta, latDeg: theta * 180 / Math.PI };
  }

  function build(generator: (uu: number, vv: number) => THREE.Color): THREE.DataTexture {
    const data = new Uint8Array(size * size * 4);
    for (let yy = 0; yy < size; yy++) {
      for (let xx = 0; xx < size; xx++) {
        const uu = xx / size, vv = yy / size;
        const c = generator(uu, vv);
        const idx = (yy * size + xx) * 4;
        data[idx] = Math.round(clamp(c.r, 0, 1) * 255);
        data[idx + 1] = Math.round(clamp(c.g, 0, 1) * 255);
        data[idx + 2] = Math.round(clamp(c.b, 0, 1) * 255);
        data[idx + 3] = 255;
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.needsUpdate = true;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  let tex: THREE.DataTexture;

  switch (type) {
    case 'mercury':
      tex = build((uu, vv) => { const s = uvToSpherical(uu, vv); const c = ridge(s.lon * 8, s.lat * 8, 4); const sc = fbm(s.lon * 30, s.lat * 30, 5) * 0.3; const r = fbm(s.lon * 80, s.lat * 80, 3) * 0.15; const val = 0.1 + c * 0.12 + sc + r; const cv = clamp(val, 0.05, 0.35); return new THREE.Color(cv * 0.8, cv * 0.5, cv * 0.3); });
      break;
    case 'venus':
      tex = build((uu, vv) => { const s = uvToSpherical(uu, vv); const ld = s.latDeg; const b = Math.sin(s.lat * 12) * 0.12 + Math.sin(s.lat * 28) * 0.04; const sw = fbm(s.lon * 10, s.lat * 10, 4) * 0.06; const p = Math.abs(ld) > 60 ? (1 - smoothstep(60, 90, Math.abs(ld))) * 0.15 : 0; const br = 0.92 + b + sw + p; const bv = clamp(br, 0.8, 1.0); return new THREE.Color(bv * 1.0, bv * 0.7, bv * 0.4); });
      break;
    case 'earth':
      tex = build((uu, vv) => { const s = uvToSpherical(uu, vv); const lat = s.latDeg, lon = s.lon; const co = fbm(lon * 2.2, lat * 2.2, 6); const de = fbm(lon * 7, lat * 7, 4) * 0.35; const land = co + de > 0.4; if (land) { const ve = fbm(lon * 10, lat * 10, 3); let g = Math.abs(lat) < 23 ? 0.32 + ve * 0.12 : Math.abs(lat) < 50 ? 0.22 + ve * 0.08 : 0.12 + ve * 0.06; return new THREE.Color(0.1, g * 0.8, 0.05); } const dp = fbm(lon * 4, lat * 4, 3); const sh = fbm(lon * 18, lat * 18, 2) * 0.25; const d = 0.2 + dp * 0.45 + sh; if (Math.abs(lat) > 72) { const ice = 0.85 + fbm(lon * 25, lat * 25, 3) * 0.12; return new THREE.Color(ice * 0.9, ice * 0.9, ice); } return new THREE.Color(0.0, 0.2 + d * 0.3, 0.5 + d * 0.3); });
      break;
    case 'earth_clouds':
      tex = build(() => new THREE.Color(1, 1, 1));
      break;
    case 'mars':
      tex = build((uu, vv) => { const s = uvToSpherical(uu, vv); const lat = s.latDeg; const t = fbm(s.lon * 15, s.lat * 15, 5); const cr = ridge(s.lon * 10, s.lat * 10, 4) * 0.15; const du = fbm(s.lon * 35, s.lat * 35, 3) * 0.08; let b = 0.38 + t * 0.22 + cr + du; b = clamp(b, 0.2, 0.75); if (Math.abs(lat) > 55) { const cap = 1 - smoothstep(55, 85, Math.abs(lat)); b = Math.max(b, cap * 0.8); } return new THREE.Color(clamp(b * 1.2, 0.3, 1.0), clamp(b * 0.2, 0.05, 0.2), clamp(b * 0.1, 0.02, 0.1)); });
      break;
    case 'jupiter':
      tex = build((uu, vv) => { const s = uvToSpherical(uu, vv); const ba = Math.sin(s.lat * 35) * 0.35; const fb = Math.sin(s.lat * 100) * 0.08; const tu = fbm(s.lon * 20, Math.abs(s.lat) * 15, 4) * 0.12; const grs = s.lat > -24 && s.lat < -14 && s.lon > 2.1 && s.lon < 3.4 ? 1 : 0; const v = 0.72 + ba + fb + tu + grs * 0.3; const cv = clamp(v, 0.3, 1.0); if (grs) return new THREE.Color(0.9, 0.2, 0.1); return new THREE.Color(clamp(cv * 1.2, 0.4, 1.0), clamp(cv * 0.7, 0.3, 0.9), clamp(cv * 0.3, 0.1, 0.6)); });
      break;
    case 'saturn':
      tex = build((uu, vv) => { const s = uvToSpherical(uu, vv); const ba = Math.sin(s.lat * 22) * 0.18; const fi = Math.sin(s.lat * 70) * 0.05; const ha = fbm(s.lon * 12, s.lat * 8, 3) * 0.04; const v = clamp(0.85 + ba + fi + ha, 0.6, 1.0); return new THREE.Color(v * 1.0, v * 0.7, v * 0.4); });
      break;
    case 'uranus':
      tex = build((uu, vv) => { const s = uvToSpherical(uu, vv); const ha = fbm(s.lon * 6, s.lat * 6, 3) * 0.03; const v = clamp(0.52 + ha, 0.4, 0.65); return new THREE.Color(v * 0.3, v * 0.7, v * 0.9); });
      break;
    case 'neptune':
      tex = build((uu, vv) => { const s = uvToSpherical(uu, vv); const ba = Math.sin(s.lat * 25) * 0.12; const sp = fbm(s.lon * 15, s.lat * 15, 3) * 0.06; const v = clamp(0.3 + ba + sp, 0.15, 0.5); if (s.lat > -24 && s.lat < -14 && s.lon > 4.2 && s.lon < 4.9) return new THREE.Color(0.1, 0.2, 0.5); return new THREE.Color(v * 0.2, v * 0.4, v * 0.9); });
      break;
    case 'moon':
      tex = build((uu, vv) => { const s = uvToSpherical(uu, vv); const craters = ridge(s.lon * 20, s.lat * 20, 5); const maria = fbm(s.lon * 8, s.lat * 8, 4) * 0.4; const roughness = fbm(s.lon * 50, s.lat * 50, 3) * 0.1; const val = 0.75 - maria * 0.25 + craters * 0.08 + roughness; const c = clamp(val, 0.5, 0.9); return new THREE.Color(c * 1.0, c * 0.95, c * 0.9); });
      break;
    default:
      tex = build(() => new THREE.Color(1, 0, 1));
  }

  proceduralCache.set(type, tex);
  return tex;
}

function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function noise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  const x1 = a + (b - a) * ux, x2 = c + (d - c) * ux;
  return x1 + (x2 - x1) * uy;
}

function fbm(x: number, y: number, octaves: number): number {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < octaves; i++) { v += a * (noise(x * f, y * f) * 2 - 1); a *= 0.5; f *= 2; }
  return v * 0.5 + 0.5;
}

function ridge(x: number, y: number, octaves: number): number {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < octaves; i++) { v += a * (1 - Math.abs(noise(x * f, y * f) * 2 - 1)); a *= 0.5; f *= 2; }
  return v;
}

function clamp(v: number, min: number, max: number): number { return Math.max(min, Math.min(max, v)); }

function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

const TEXTURE_BASE_URL = 'https://cdn.jsdelivr.net/gh/turban/SolarSystemTextures@main/textures';

export const PLANET_TEXTURE_CONFIG: Record<string, {
  color: string;
  normal?: string;
  roughness?: string;
  clouds?: string;
  cloudsNormal?: string;
  scale: number;
}> = {
  mercury: { color: `${TEXTURE_BASE_URL}/2k_mercury.jpg`, normal: `${TEXTURE_BASE_URL}/2k_mercury_normal.jpg`, roughness: `${TEXTURE_BASE_URL}/2k_mercury_roughness.jpg`, scale: 1 },
  venus: { color: `${TEXTURE_BASE_URL}/2k_venus_surface.jpg`, normal: `${TEXTURE_BASE_URL}/2k_venus_normal.jpg`, clouds: `${TEXTURE_BASE_URL}/2k_venus_clouds.jpg`, scale: 1 },
  earth: { color: `${TEXTURE_BASE_URL}/2k_earth_daymap.jpg`, normal: `${TEXTURE_BASE_URL}/2k_earth_normal.jpg`, roughness: `${TEXTURE_BASE_URL}/2k_earth_specular.jpg`, clouds: `${TEXTURE_BASE_URL}/2k_earth_clouds.jpg`, cloudsNormal: `${TEXTURE_BASE_URL}/2k_earth_clouds_normal.jpg`, scale: 1 },
  mars: { color: `${TEXTURE_BASE_URL}/2k_mars.jpg`, normal: `${TEXTURE_BASE_URL}/2k_mars_normal.jpg`, roughness: `${TEXTURE_BASE_URL}/2k_mars_roughness.jpg`, scale: 1 },
  jupiter: { color: `${TEXTURE_BASE_URL}/2k_jupiter.jpg`, normal: `${TEXTURE_BASE_URL}/2k_jupiter_normal.jpg`, scale: 1 },
  saturn: { color: `${TEXTURE_BASE_URL}/2k_saturn.jpg`, normal: `${TEXTURE_BASE_URL}/2k_saturn_normal.jpg`, scale: 1 },
  uranus: { color: `${TEXTURE_BASE_URL}/2k_uranus.jpg`, normal: `${TEXTURE_BASE_URL}/2k_uranus_normal.jpg`, scale: 1 },
  neptune: { color: `${TEXTURE_BASE_URL}/2k_neptune.jpg`, normal: `${TEXTURE_BASE_URL}/2k_neptune_normal.jpg`, scale: 1 },
  moon: { color: `${TEXTURE_BASE_URL}/2k_moon.jpg`, normal: `${TEXTURE_BASE_URL}/2k_moon_normal.jpg`, roughness: `${TEXTURE_BASE_URL}/2k_moon_roughness.jpg`, scale: 1 },
};

function loadTextureSafe(url: string, colorSpace: THREE.ColorSpace = THREE.SRGBColorSpace): Promise<THREE.Texture | undefined> {
  return new Promise((resolve) => {
    try {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(url, (t) => { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.colorSpace = colorSpace; resolve(t); }, undefined, () => resolve(undefined));
    } catch { resolve(undefined); }
  });
}

export interface PlanetTextureSet {
  color?: THREE.Texture;
  normal?: THREE.Texture;
  roughness?: THREE.Texture;
  clouds?: THREE.Texture;
  cloudsNormal?: THREE.Texture;
  loading: boolean;
  error: boolean;
}

const realTextureCache = new Map<string, PlanetTextureSet>();
const preloadPromises = new Map<string, Promise<PlanetTextureSet>>();

function preloadPlanetTextures(planetId: string): Promise<PlanetTextureSet> {
  if (preloadPromises.has(planetId)) return preloadPromises.get(planetId)!;
  if (realTextureCache.has(planetId)) return Promise.resolve(realTextureCache.get(planetId)!);

  const config = PLANET_TEXTURE_CONFIG[planetId];
  if (!config?.color) return Promise.resolve({ loading: false, error: false });

  const promise = (async () => {
    try {
      const results: PlanetTextureSet = { loading: true, error: false };
      results.color = await loadTextureSafe(config.color);
      if (!results.color) throw new Error('Color failed');

      const promises: Promise<void>[] = [];
      if (config.normal) promises.push(loadTextureSafe(config.normal, THREE.NoColorSpace).then((t: THREE.Texture | undefined) => { if (t) results.normal = t; }));
      if (config.roughness) promises.push(loadTextureSafe(config.roughness, THREE.NoColorSpace).then((t: THREE.Texture | undefined) => { if (t) results.roughness = t; }));
      if (config.clouds) promises.push(loadTextureSafe(config.clouds).then((t: THREE.Texture | undefined) => { if (t) results.clouds = t; }));
      if (config.cloudsNormal) promises.push(loadTextureSafe(config.cloudsNormal, THREE.NoColorSpace).then((t: THREE.Texture | undefined) => { if (t) results.cloudsNormal = t; }));

      await Promise.all(promises);
      results.loading = false;
      realTextureCache.set(planetId, results);
      return results;
    } catch {
      return { loading: false, error: true };
    }
  })();

  preloadPromises.set(planetId, promise);
  return promise;
}

Object.keys(PLANET_TEXTURE_CONFIG).forEach(preloadPlanetTextures);

export interface PlanetTextureSet {
  color?: THREE.Texture;
  normal?: THREE.Texture;
  roughness?: THREE.Texture;
  clouds?: THREE.Texture;
  cloudsNormal?: THREE.Texture;
  loading: boolean;
  error: boolean;
}

export function usePlanetTextures(planetId: string): PlanetTextureSet {
  const config = PLANET_TEXTURE_CONFIG[planetId];
  const [, forceUpdate] = useState({});
  const stateRef = useRef<PlanetTextureSet>({ loading: !!config?.color, error: false });
  const { gl } = useThree();

  useEffect(() => {
    if (!config?.color || !gl) {
      stateRef.current = { loading: false, error: false };
      forceUpdate(s => ({ ...s }));
      return;
    }

    let mounted = true;
    let cancelled = false;

    const load = async () => {
      const promise = preloadPromises.get(planetId) || preloadPlanetTextures(planetId);
      const result = await promise;
      if (mounted && !cancelled) {
        stateRef.current = result;
        forceUpdate(s => ({ ...s }));
      }
    };
    load();

    return () => { mounted = false; cancelled = true; };
  }, [planetId, config, gl]);

  return useMemo(() => ({
    color: stateRef.current.color,
    normal: stateRef.current.normal,
    roughness: stateRef.current.roughness,
    clouds: stateRef.current.clouds,
    cloudsNormal: stateRef.current.cloudsNormal,
    loading: stateRef.current.loading,
    error: stateRef.current.error,
  }), [stateRef.current.color, stateRef.current.normal, stateRef.current.roughness, stateRef.current.clouds, stateRef.current.cloudsNormal, stateRef.current.loading, stateRef.current.error]);
}

export function createPlanetTexture(type: string): THREE.DataTexture {
  return createProceduralTexture(type);
}

export async function preloadAllTextures(): Promise<void> {
  await Promise.all(Object.keys(PLANET_TEXTURE_CONFIG).map(preloadPlanetTextures));
}