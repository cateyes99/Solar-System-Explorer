import * as THREE from 'three';

const cache = new Map<string, THREE.CanvasTexture>();

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext('2d')! };
}

function toTexture(key: string, c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  cache.set(key, t);
  return t;
}

function rand(seedRef: { s: number }) {
  // mulberry32
  seedRef.s |= 0;
  seedRef.s = (seedRef.s + 0x6d2b79f5) | 0;
  let t = Math.imul(seedRef.s ^ (seedRef.s >>> 15), 1 | seedRef.s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function rockyTexture(base: string, dark: string, light: string, seed = 7, craters = true): THREE.CanvasTexture {
  const key = `rocky-${base}-${seed}-${craters}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { c, ctx } = canvas(256, 128);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 128);
  const r = { s: seed };
  for (let i = 0; i < 900; i++) {
    const x = rand(r) * 256, y = rand(r) * 128, rad = 1 + rand(r) * 6;
    ctx.fillStyle = rand(r) > 0.5 ? dark : light;
    ctx.globalAlpha = 0.12 + rand(r) * 0.22;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, 7);
    ctx.fill();
  }
  if (craters) {
    for (let i = 0; i < 60; i++) {
      const x = rand(r) * 256, y = rand(r) * 128, rad = 1 + rand(r) * 4;
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, 7);
      ctx.stroke();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(x - rad * 0.2, y - rad * 0.2, rad * 0.7, 0, 7);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  return toTexture(key, c);
}

export function bandedTexture(colors: string[], seed = 3, wobble = true, spot = false): THREE.CanvasTexture {
  const key = `banded-${colors.join('|')}-${spot}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { c, ctx } = canvas(512, 256);
  const n = colors.length * 3;
  for (let y = 0; y < 256; y++) {
    const band = Math.floor((y / 256) * n);
    ctx.fillStyle = colors[band % colors.length];
    ctx.fillRect(0, y, 512, 1);
  }
  // turbulence
  const r = { s: seed };
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 260; i++) {
    const y = rand(r) * 256;
    const h = 2 + rand(r) * 7;
    ctx.fillStyle = rand(r) > 0.5 ? '#ffffff' : '#5b3a1e';
    const x = rand(r) * 512;
    const w = 20 + rand(r) * 90;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, 7);
    ctx.fill();
  }
  if (wobble) {
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = '#ffffff';
    for (let i = 0; i < 26; i++) {
      ctx.lineWidth = 1 + rand(r) * 2;
      ctx.beginPath();
      const y = rand(r) * 256;
      ctx.moveTo(0, y);
      for (let x = 0; x <= 512; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 4);
      ctx.stroke();
    }
  }
  if (spot) {
    // Great Red Spot
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.ellipse(360, 158, 44, 24, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#e67e5a';
    ctx.beginPath();
    ctx.ellipse(360, 158, 30, 15, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#922b21';
    ctx.beginPath();
    ctx.ellipse(360, 158, 16, 8, 0, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return toTexture(key, c);
}

export function earthTexture(): THREE.CanvasTexture {
  const key = 'earth';
  const hit = cache.get(key);
  if (hit) return hit;
  const { c, ctx } = canvas(512, 256);
  const ocean = ctx.createLinearGradient(0, 0, 0, 256);
  ocean.addColorStop(0, '#1d4ed8');
  ocean.addColorStop(0.5, '#2563eb');
  ocean.addColorStop(1, '#1e40af');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, 512, 256);
  const r = { s: 42 };
  // continents
  const land = ['#3f9e4d', '#65a30d', '#a16207', '#4d7c0f'];
  for (let i = 0; i < 14; i++) {
    const cx = rand(r) * 512, cy = 40 + rand(r) * 176;
    for (let j = 0; j < 26; j++) {
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = land[Math.floor(rand(r) * land.length)];
      ctx.beginPath();
      ctx.ellipse(cx + (rand(r) - 0.5) * 90, cy + (rand(r) - 0.5) * 50, 6 + rand(r) * 22, 5 + rand(r) * 14, rand(r) * 3, 0, 7);
      ctx.fill();
    }
  }
  // ice caps
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 14);
  ctx.fillRect(0, 242, 512, 14);
  return toTexture(key, c);
}

export function cloudTexture(): THREE.CanvasTexture {
  const key = 'clouds';
  const hit = cache.get(key);
  if (hit) return hit;
  const { c, ctx } = canvas(512, 256);
  ctx.clearRect(0, 0, 512, 256);
  const r = { s: 99 };
  for (let i = 0; i < 220; i++) {
    ctx.globalAlpha = 0.1 + rand(r) * 0.25;
    ctx.fillStyle = '#ffffff';
    const x = rand(r) * 512, y = rand(r) * 256;
    ctx.beginPath();
    ctx.ellipse(x, y, 12 + rand(r) * 42, 3 + rand(r) * 9, (rand(r) - 0.5) * 0.6, 0, 7);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  cache.set(key, t);
  return t;
}

export function sunTexture(): THREE.CanvasTexture {
  const key = 'sun';
  const hit = cache.get(key);
  if (hit) return hit;
  const { c, ctx } = canvas(512, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#ffb703');
  g.addColorStop(0.5, '#fb8500');
  g.addColorStop(1, '#e36414');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);
  const r = { s: 7 };
  for (let i = 0; i < 700; i++) {
    ctx.globalAlpha = 0.15 + rand(r) * 0.3;
    ctx.fillStyle = rand(r) > 0.5 ? '#ffd60a' : '#9d0208';
    ctx.beginPath();
    ctx.arc(rand(r) * 512, rand(r) * 256, 1 + rand(r) * 5, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return toTexture(key, c);
}

export function ringTexture(): THREE.CanvasTexture {
  const key = 'saturn-ring';
  const hit = cache.get(key);
  if (hit) return hit;
  const { c, ctx } = canvas(512, 16);
  const r = { s: 11 };
  for (let x = 0; x < 512; x++) {
    const band = Math.sin(x * 0.11) * 0.5 + Math.sin(x * 0.031) * 0.5;
    const a = x > 200 && x < 235 ? 0.05 : 0.35 + Math.abs(band) * 0.55 + rand(r) * 0.15; // Cassini gap
    const shade = 200 + Math.floor(band * 40);
    ctx.fillStyle = `rgba(${shade},${185 + Math.floor(band * 20)},${140},${Math.min(1, a)})`;
    ctx.fillRect(x, 0, 1, 16);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  cache.set(key, t);
  return t;
}

export function glowSprite(color: string): THREE.CanvasTexture {
  const key = `glow-${color}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { c, ctx } = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  g.addColorStop(0, color);
  g.addColorStop(0.35, color + 'aa');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  cache.set(key, t);
  return t;
}

/* ------------------------------------------------------------------ */
/* Real NASA-based surface maps (Solar System Scope, CC BY 4.0 — see   */
/* README credits). Served locally from /textures so the app works     */
/* offline. Loaded once via drei useTexture in SolarSystemScene.       */
/* ------------------------------------------------------------------ */

export const REAL_TEXTURE_URLS = {
  sun: '/textures/2k_sun.jpg',
  mercury: '/textures/2k_mercury.jpg',
  venus: '/textures/2k_venus_atmosphere.jpg',
  earthDay: '/textures/2k_earth_daymap.jpg',
  earthNight: '/textures/2k_earth_nightmap.jpg',
  earthClouds: '/textures/2k_earth_clouds.jpg',
  moon: '/textures/2k_moon.jpg',
  mars: '/textures/2k_mars.jpg',
  jupiter: '/textures/2k_jupiter.jpg',
  saturn: '/textures/2k_saturn.jpg',
  saturnRing: '/textures/2k_saturn_ring_alpha.png',
  uranus: '/textures/2k_uranus.jpg',
  neptune: '/textures/2k_neptune.jpg',
  milkyWay: '/textures/2k_stars_milky_way.jpg',
} as const;

export type RealMaps = Record<keyof typeof REAL_TEXTURE_URLS, THREE.Texture>;

/** Prepare a color (albedo/emissive) map for correct rendering. */
export function prepColorMap(t: THREE.Texture): THREE.Texture {
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Remap RingGeometry UVs so u runs radially (inner→outer) for ring strips. */
export function remapRingUVs(geo: THREE.RingGeometry, inner: number, outer: number): void {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
  }
  uv.needsUpdate = true;
}

/** Pluto: pale tan world, dark equatorial band (Cthulhu Macula) and the bright
 *  heart of Tombaugh Regio at ~180° longitude — its most famous feature. */
export function plutoTexture(): THREE.CanvasTexture {
  const key = 'pluto-heart';
  const hit = cache.get(key);
  if (hit) return hit;
  const { c, ctx } = canvas(512, 256);
  // latitude shading: bright poles, tan mid-latitudes
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#ddd2bd');
  g.addColorStop(0.3, '#c4a87f');
  g.addColorStop(0.5, '#a9855e');
  g.addColorStop(0.62, '#6f5840');
  g.addColorStop(0.72, '#a9855e');
  g.addColorStop(1, '#cfc0a8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);
  const r = { s: 2015 };
  // mottled terrain
  for (let i = 0; i < 500; i++) {
    ctx.globalAlpha = 0.08 + rand(r) * 0.16;
    ctx.fillStyle = rand(r) > 0.5 ? '#7a6248' : '#e6d9c2';
    ctx.beginPath();
    ctx.ellipse(rand(r) * 512, rand(r) * 256, 2 + rand(r) * 14, 1 + rand(r) * 7, rand(r) * 3, 0, 7);
    ctx.fill();
  }
  // Tombaugh Regio — the heart (left + right lobes)
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = '#ece1cd';
  ctx.beginPath();
  ctx.ellipse(238, 118, 26, 30, -0.25, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(282, 116, 30, 34, 0.25, 0, 7);
  ctx.fill();
  // smooth nitrogen-ice plains (Sputnik Planitia, right lobe) + darker left lobe edge
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#f4ecdc';
  ctx.beginPath();
  ctx.ellipse(284, 118, 20, 24, 0.2, 0, 7);
  ctx.fill();
  ctx.globalAlpha = 1;
  return toTexture(key, c);
}

export function textureForPlanet(id: string): THREE.CanvasTexture {
  switch (id) {
    case 'mercury':
      return rockyTexture('#8a7f72', '#4a4239', '#b8a99a', 7, true);
    case 'venus':
      return bandedTexture(['#e9c46a', '#f4e1a1', '#d4a24e', '#f8ecc0', '#c98f3d'], 5, false);
    case 'earth':
      return earthTexture();
    case 'mars':
      return rockyTexture('#b5532a', '#6b2d14', '#e07b39', 21, true);
    case 'jupiter':
      return bandedTexture(['#d8b48f', '#b07a4f', '#f1e3d3', '#c68e5e', '#8f5a33', '#e8d0ae'], 3, true, true);
    case 'saturn':
      return bandedTexture(['#e9d8a6', '#d4b87c', '#f5e9c8', '#c9a86a', '#b8935a'], 9, true);
    case 'uranus':
      return bandedTexture(['#9adbe8', '#7fc9d6', '#b5ecf2', '#86cfda'], 13, false);
    case 'neptune':
      return bandedTexture(['#3f66f2', '#2b3fd4', '#6f8bff', '#1e2fb0', '#5168ee'], 17, true);
    default:
      return rockyTexture('#888', '#444', '#aaa', 1, false);
  }
}
