import * as THREE from 'three';

// Simple, fast hash
function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

// 2D value noise
function noise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  
  const x1 = a + (b - a) * ux;
  const x2 = c + (d - c) * ux;
  return x1 + (x2 - x1) * uy;
}

// Fractal Brownian Motion - returns 0 to 1
function fbm(x: number, y: number, octaves: number): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * (noise(x * frequency, y * frequency) * 2 - 1);
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value * 0.5 + 0.5;
}

// Ridged noise - returns 0 to 1
function ridge(x: number, y: number, octaves: number): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(noise(x * frequency, y * frequency) * 2 - 1);
    value += amplitude * n;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function uvToSpherical(u: number, v: number) {
  const phi = u * Math.PI * 2;
  const theta = (v - 0.5) * Math.PI;
  return { lon: phi, lat: theta, latDeg: theta * 180 / Math.PI };
}

function createTexture(
  width: number,
  height: number,
  generator: (u: number, v: number) => THREE.Color
): THREE.DataTexture {
  const data = new Uint8Array(width * height * 4);
  for (let yy = 0; yy < height; yy++) {
    for (let xx = 0; xx < width; xx++) {
      const u = xx / width;
      const v = yy / height;
      const color = generator(u, v);
      const idx = (yy * width + xx) * 4;
      data[idx] = Math.round(clamp(color.r, 0, 1) * 255);
      data[idx + 1] = Math.round(clamp(color.g, 0, 1) * 255);
      data[idx + 2] = Math.round(clamp(color.b, 0, 1) * 255);
      data[idx + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Star field
export function createStarField(count: number = 3000): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const twinkleSpeeds = new Float32Array(count);
  const twinklePhases = new Float32Array(count);

  const colorOptions = [
    new THREE.Color(0xffffff), new THREE.Color(0xfffafa), new THREE.Color(0xfff0e0),
    new THREE.Color(0xe0e0ff), new THREE.Color(0xffe0e0), new THREE.Color(0xffffe0),
  ];

  for (let i = 0; i < count; i++) {
    const radius = 500 + Math.random() * 500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
    sizes[i] = 0.5 + Math.random() * 2;
    twinkleSpeeds[i] = 0.5 + Math.random() * 2;
    twinklePhases[i] = Math.random() * Math.PI * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));
  geometry.setAttribute('twinklePhase', new THREE.BufferAttribute(twinklePhases, 1));
  return geometry;
}

// Nebula
export function createNebulaGeometry(count: number = 500): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const opacities = new Float32Array(count);
  const velocities = new Float32Array(count * 3);

  const nebulaColors = [
    new THREE.Color(0x1a0a2e), new THREE.Color(0x2d1b4e), new THREE.Color(0x0f0f23),
    new THREE.Color(0x16213e), new THREE.Color(0x0d0d1a),
  ];

  for (let i = 0; i < count; i++) {
    const radius = 300 + Math.random() * 400;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    const color = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
    colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
    sizes[i] = 20 + Math.random() * 50;
    opacities[i] = 0.02 + Math.random() * 0.08;
    velocities[i * 3] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  return geometry;
}

// Asteroid belt
export function createAsteroidBelt(count: number = 2000): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const orbitalData = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    const radius = 140 + Math.random() * 40;
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * 0.3;

    positions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
    positions[i * 3 + 1] = radius * Math.sin(phi);
    positions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

    const gray = 0.3 + Math.random() * 0.4;
    colors[i * 3] = gray; colors[i * 3 + 1] = gray; colors[i * 3 + 2] = gray;
    sizes[i] = 0.1 + Math.random() * 0.5;

    orbitalData[i * 4] = radius;
    orbitalData[i * 4 + 1] = theta;
    orbitalData[i * 4 + 2] = phi;
    orbitalData[i * 4 + 3] = 0.5 + Math.random() * 1.5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('orbitalData', new THREE.BufferAttribute(orbitalData, 4));
  return geometry;
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function lerpVec3(start: THREE.Vector3, end: THREE.Vector3, t: number): THREE.Vector3 {
  return start.clone().lerp(end, t);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function formatDistance(km: number): string {
  if (km >= 1e9) return `${(km / 1e9).toFixed(1)}B km`;
  if (km >= 1e6) return `${(km / 1e6).toFixed(1)}M km`;
  return `${km.toLocaleString()} km`;
}

export function formatNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(1)}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = hours / 24;
  if (days < 365) return `${days.toFixed(1)}d`;
  const years = days / 365;
  return `${years.toFixed(1)}y`;
}

export function getSpeedLabel(speed: number): string {
  if (speed === 0) return 'Paused';
  if (speed < 1) return `${(speed * 86400).toFixed(0)}× (${formatTime(1 / speed)} per day)`;
  if (speed < 365) return `${speed.toFixed(0)}× (${formatTime(86400 / speed)} per day)`;
  return `${(speed / 365).toFixed(0)}× (${formatTime(86400 * 365 / speed)} per year)`;
}

export function calculateOrbitalPosition(radius: number, speed: number, time: number, offset: number = 0): THREE.Vector3 {
  const angle = (time * speed + offset) % (Math.PI * 2);
  return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
}

export function calculateInclinedOrbitalPosition(
  radius: number, speed: number, time: number, inclination: number, offset: number = 0
): THREE.Vector3 {
  const angle = (time * speed + offset) % (Math.PI * 2);
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = Math.sin(angle) * Math.sin(inclination) * radius * 0.1;
  return new THREE.Vector3(x, y, z);
}

export function calculateOrbitalPosition3D(
  radius: number,
  speed: number,
  time: number,
  inclination: number,
  longitudeOfAscendingNode: number,
  argumentOfPeriapsis: number = 0,
  offset: number = 0
): THREE.Vector3 {
  const angle = (time * speed + offset) % (Math.PI * 2);
  
  // Position in orbital plane (before rotations)
  const xOrbital = Math.cos(angle) * radius;
  const yOrbital = Math.sin(angle) * radius;
  const zOrbital = 0;
  
  // Rotation matrices
  // 1. Argument of periapsis (ω) - rotation around Z in orbital plane
  const cosW = Math.cos(argumentOfPeriapsis);
  const sinW = Math.sin(argumentOfPeriapsis);
  let x1 = xOrbital * cosW - yOrbital * sinW;
  let y1 = xOrbital * sinW + yOrbital * cosW;
  let z1 = zOrbital;
  
  // 2. Inclination (i) - rotation around X
  const cosI = Math.cos(inclination);
  const sinI = Math.sin(inclination);
  let x2 = x1;
  let y2 = y1 * cosI - z1 * sinI;
  let z2 = y1 * sinI + z1 * cosI;
  
  // 3. Longitude of ascending node (Ω) - rotation around Z
  const cosO = Math.cos(longitudeOfAscendingNode);
  const sinO = Math.sin(longitudeOfAscendingNode);
  const x3 = x2 * cosO - y2 * sinO;
  const y3 = x2 * sinO + y2 * cosO;
  const z3 = z2;
  
  return new THREE.Vector3(x3, y3, z3);
}

export function createRingGeometry(innerRadius: number, outerRadius: number, segments: number = 128): THREE.RingGeometry {
  return new THREE.RingGeometry(innerRadius, outerRadius, segments, 8);
}

export function createPlanetTexture(type: string): THREE.DataTexture {
  const size = 1024;
  
  switch (type) {
    case 'mercury': {
      return createTexture(size, size, (u, v) => {
        const s = uvToSpherical(u, v);
        const craters = ridge(s.lon * 8, s.lat * 8, 4);
        const smallCraters = fbm(s.lon * 30, s.lat * 30, 5) * 0.3;
        const roughness = fbm(s.lon * 80, s.lat * 80, 3) * 0.15;
        const val = 0.1 + craters * 0.12 + smallCraters + roughness;
        const c = clamp(val, 0.05, 0.35);
        return new THREE.Color(c * 1.0, c * 0.97, c * 0.92);
      });
    }
    case 'venus': {
      return createTexture(size, size, (u, v) => {
        const s = uvToSpherical(u, v);
        const latDeg = s.latDeg;
        const bands = Math.sin(s.lat * 12) * 0.12 + Math.sin(s.lat * 28) * 0.04;
        const swirls = fbm(s.lon * 10, s.lat * 10, 4) * 0.06;
        const polar = Math.abs(latDeg) > 60 ? (1 - smoothstep(60, 90, Math.abs(latDeg))) * 0.15 : 0;
        const brightness = 0.92 + bands + swirls + polar;
        const b = clamp(brightness, 0.8, 1.0);
        return new THREE.Color(b * 1.0, b * 0.94, b * 0.78);
      });
    }
    case 'earth': {
      return createTexture(size, size, (u, v) => {
        const s = uvToSpherical(u, v);
        const lat = s.latDeg;
        const lon = s.lon;
        const cont = fbm(lon * 2.2, lat * 2.2, 6);
        const detail = fbm(lon * 7, lat * 7, 4) * 0.35;
        const isLand = cont + detail > 0.4;
        if (isLand) {
          const veg = fbm(lon * 10, lat * 10, 3);
          let g = Math.abs(lat) < 23 ? 0.32 + veg * 0.12 : Math.abs(lat) < 50 ? 0.22 + veg * 0.08 : 0.12 + veg * 0.06;
          return new THREE.Color(0.1, clamp(g, 0.05, 0.5), 0.05);
        }
        const deep = fbm(lon * 4, lat * 4, 3);
        const shallow = fbm(lon * 18, lat * 18, 2) * 0.25;
        const depth = 0.2 + deep * 0.45 + shallow;
        if (Math.abs(lat) > 72) {
          const ice = 0.85 + fbm(lon * 25, lat * 25, 3) * 0.12;
          return new THREE.Color(ice * 0.96, ice, ice * 1.02);
        }
        return new THREE.Color(0.01 + depth * 0.04, 0.06 + depth * 0.18, 0.18 + depth * 0.35);
      });
    }
    case 'earth_clouds': {
      return createTexture(size, size, () => new THREE.Color(1, 1, 1));
    }
    case 'mars': {
      return createTexture(size, size, (u, v) => {
        const s = uvToSpherical(u, v);
        const lat = s.latDeg;
        const terrain = fbm(s.lon * 15, s.lat * 15, 5);
        const craters = ridge(s.lon * 10, s.lat * 10, 4) * 0.15;
        const dunes = fbm(s.lon * 35, s.lat * 35, 3) * 0.08;
        let base = 0.38 + terrain * 0.22 + craters + dunes;
        base = clamp(base, 0.2, 0.75);
        if (Math.abs(lat) > 55) {
          const cap = 1 - smoothstep(55, 85, Math.abs(lat));
          base = Math.max(base, cap * 0.8);
        }
        return new THREE.Color(
          clamp(base * 1.0, 0.15, 0.8),
          clamp(base * 0.32, 0.05, 0.3),
          clamp(base * 0.15, 0.02, 0.15)
        );
      });
    }
    case 'jupiter': {
      return createTexture(size, size, (uu, vv) => {
        const s = uvToSpherical(uu, vv);
        const bands = Math.sin(s.lat * 35) * 0.35;
        const fineBands = Math.sin(s.lat * 100) * 0.08;
        const turb = fbm(s.lon * 20, Math.abs(s.lat) * 15, 4) * 0.12;
        const grs = (s.lat > -24 && s.lat < -14 && s.lon > 2.1 && s.lon < 3.4) ? 1 : 0;
        const val = 0.72 + bands + fineBands + turb + grs * 0.3;
        const vv2 = clamp(val, 0.3, 1.0);
        if (grs) return new THREE.Color(0.85, 0.3, 0.12);
        return new THREE.Color(clamp(vv2 * 1.1, 0.3, 1.0), clamp(vv2 * 0.78, 0.2, 0.8), clamp(vv2 * 0.4, 0.1, 0.5));
      });
    }
    case 'saturn': {
      return createTexture(size, size, (uu, vv) => {
        const s = uvToSpherical(uu, vv);
        const bands = Math.sin(s.lat * 22) * 0.18;
        const fine = Math.sin(s.lat * 70) * 0.05;
        const haze = fbm(s.lon * 12, s.lat * 8, 3) * 0.04;
        const val = 0.85 + bands + fine + haze;
        const vv2 = clamp(val, 0.6, 1.0);
        return new THREE.Color(vv2 * 1.0, vv2 * 0.88, vv2 * 0.62);
      });
    }
    case 'uranus': {
      return createTexture(size, size, (uu, vv) => {
        const s = uvToSpherical(uu, vv);
        const haze = fbm(s.lon * 6, s.lat * 6, 3) * 0.03;
        const val = 0.52 + haze;
        const vv2 = clamp(val, 0.4, 0.65);
        return new THREE.Color(vv2 * 0.65, vv2 * 0.9, vv2 * 1.0);
      });
    }
    case 'neptune': {
      return createTexture(size, size, (uu, vv) => {
        const s = uvToSpherical(uu, vv);
        const bands = Math.sin(s.lat * 25) * 0.12;
        const spots = fbm(s.lon * 15, s.lat * 15, 3) * 0.06;
        const val = 0.3 + bands + spots;
        const vv2 = clamp(val, 0.15, 0.5);
        if (s.lat > -24 && s.lat < -14 && s.lon > 4.2 && s.lon < 4.9) {
          return new THREE.Color(0.08, 0.12, 0.3);
        }
        return new THREE.Color(vv2 * 0.4, vv2 * 0.55, vv2 * 1.0);
      });
    }
    default:
      return createTexture(size, size, () => new THREE.Color(0.5, 0.5, 0.5));
  }
}