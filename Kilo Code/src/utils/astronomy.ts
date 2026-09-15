import * as THREE from 'three';

export function createStarField(count: number = 3000): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const twinkleSpeeds = new Float32Array(count);
  const twinklePhases = new Float32Array(count);

  const colorOptions = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xfffafa),
    new THREE.Color(0xfff0e0),
    new THREE.Color(0xe0e0ff),
    new THREE.Color(0xffe0e0),
    new THREE.Color(0xffffe0),
  ];

  for (let i = 0; i < count; i++) {
    const radius = 500 + Math.random() * 500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

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

export function createNebulaGeometry(count: number = 500): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const opacities = new Float32Array(count);
  const velocities = new Float32Array(count * 3);

  const nebulaColors = [
    new THREE.Color(0x1a0a2e),
    new THREE.Color(0x2d1b4e),
    new THREE.Color(0x0f0f23),
    new THREE.Color(0x16213e),
    new THREE.Color(0x0d0d1a),
  ];

  for (let i = 0; i < count; i++) {
    const radius = 300 + Math.random() * 400;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    const color = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

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
    colors[i * 3] = gray;
    colors[i * 3 + 1] = gray;
    colors[i * 3 + 2] = gray;

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
  const angle = (time * speed * 0.01 + offset) % (Math.PI * 2);
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    0,
    Math.sin(angle) * radius
  );
}

export function calculateInclinedOrbitalPosition(
  radius: number,
  speed: number,
  time: number,
  inclination: number,
  offset: number = 0
): THREE.Vector3 {
  const angle = (time * speed * 0.01 + offset) % (Math.PI * 2);
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = Math.sin(angle) * Math.sin(inclination) * radius * 0.1;
  return new THREE.Vector3(x, y, z);
}

export function createRingGeometry(innerRadius: number, outerRadius: number, segments: number = 128): THREE.RingGeometry {
  return new THREE.RingGeometry(innerRadius, outerRadius, segments, 8);
}

export function createProceduralTexture(
  width: number,
  height: number,
  generator: (x: number, y: number, w: number, h: number) => THREE.Color
): THREE.DataTexture {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = generator(x / width, y / height, width, height);
      const idx = (y * width + x) * 4;
      data[idx] = Math.round(color.r * 255);
      data[idx + 1] = Math.round(color.g * 255);
      data[idx + 2] = Math.round(color.b * 255);
      data[idx + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createPlanetTexture(type: string): THREE.DataTexture {
  const size = 512;
  switch (type) {
    case 'sun':
      return createProceduralTexture(size, size, (x, y) => {
        const noise = Math.sin(x * 20) * Math.cos(y * 20) * 0.5 + 0.5;
        const r = 1.0;
        const g = 0.5 + noise * 0.4;
        const b = 0.0 + noise * 0.2;
        return new THREE.Color(r, g, b);
      });
    case 'mercury':
      return createProceduralTexture(size, size, (x, y) => {
        const noise = Math.sin(x * 30) * Math.cos(y * 30) + Math.sin(x * 60) * Math.cos(y * 60) * 0.5;
        const val = 0.4 + noise * 0.15;
        return new THREE.Color(val, val * 0.98, val * 0.95);
      });
    case 'venus':
      return createProceduralTexture(size, size, (x, y) => {
        const noise = Math.sin(x * 15) * Math.cos(y * 15) + Math.sin(x * 8) * Math.cos(y * 8) * 0.3;
        const val = 0.85 + noise * 0.08;
        return new THREE.Color(val, val * 0.95, val * 0.7);
      });
    case 'earth':
      return createProceduralTexture(size, size, (x, y) => {
        const lon = x * Math.PI * 2;
        const lat = (y - 0.5) * Math.PI;
        const landMask = Math.sin(lon * 3) * Math.cos(lat * 2) + Math.sin(lon * 7) * Math.cos(lat * 5) * 0.5;
        const isLand = landMask > 0.1;
        if (isLand) {
          const green = 0.2 + Math.sin(lon * 10) * 0.1;
          return new THREE.Color(0.15, green, 0.08);
        }
        const depth = Math.sin(lon * 5) * Math.cos(lat * 3) * 0.3 + 0.7;
        return new THREE.Color(0.05, 0.2 * depth, 0.5 * depth);
      });
    case 'mars':
      return createProceduralTexture(size, size, (x, y) => {
        const noise = Math.sin(x * 25) * Math.cos(y * 25) + Math.sin(x * 12) * Math.cos(y * 12) * 0.4;
        const val = 0.6 + noise * 0.15;
        return new THREE.Color(val, val * 0.4, val * 0.25);
      });
    case 'jupiter':
      return createProceduralTexture(size, size, (x, y) => {
        const bands = Math.sin(y * 40) * 0.5;
        const spots = Math.sin(x * 60) * Math.cos(y * 30) * 0.2;
        const val = 0.7 + bands + spots;
        const r = Math.min(1, val * 1.1);
        const g = Math.min(1, val * 0.85);
        const b = Math.min(1, val * 0.55);
        return new THREE.Color(r, g, b);
      });
    case 'saturn':
      return createProceduralTexture(size, size, (x, y) => {
        const bands = Math.sin(y * 25) * 0.3;
        const val = 0.85 + bands;
        return new THREE.Color(val, val * 0.95, val * 0.75);
      });
    case 'uranus':
      return createProceduralTexture(size, size, (x, y) => {
        const noise = Math.sin(x * 10) * Math.cos(y * 10) * 0.1;
        const val = 0.55 + noise;
        return new THREE.Color(val * 0.8, val, val * 1.1);
      });
    case 'neptune':
      return createProceduralTexture(size, size, (x, y) => {
        const bands = Math.sin(y * 30) * 0.2;
        const spots = Math.sin(x * 40) * Math.cos(y * 20) * 0.15;
        const val = 0.35 + bands + spots;
        return new THREE.Color(val * 0.5, val * 0.7, val * 1.2);
      });
    default:
      return createProceduralTexture(size, size, () => new THREE.Color(0.5, 0.5, 0.5));
  }
}