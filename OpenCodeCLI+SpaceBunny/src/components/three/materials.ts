import { AdditiveBlending, BackSide, Color, ShaderMaterial, Vector3 } from 'three'
import type { Texture } from 'three'

/**
 * Shared shader materials. They are created once per scene and reused so the
 * renderer never has to compile or upload the same program repeatedly.
 */

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormalView = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSunDirView;
  uniform float uStrength;
  uniform float uPower;
  uniform float uOpacity;
  varying vec3 vNormalView;
  varying vec3 vViewDir;

  void main() {
    float fresnel = pow(1.0 - clamp(dot(vNormalView, vViewDir), 0.0, 1.0), uPower);
    float sunFacing = smoothstep(-0.55, 0.6, dot(normalize(vNormalView), normalize(uSunDirView)));
    float alpha = fresnel * uStrength * uOpacity * (0.16 + 0.84 * sunFacing);
    if (alpha <= 0.001) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`

export function createAtmosphereMaterial(color: string, strength: number, power = 3.0): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(color) },
      uSunDirView: { value: new Vector3(0, 0, 1) },
      uStrength: { value: strength },
      uPower: { value: power },
      uOpacity: { value: 1 },
    },
    vertexShader: ATMOSPHERE_VERTEX,
    fragmentShader: ATMOSPHERE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: BackSide,
  })
}

/**
 * Twinkling point stars. Size and brightness are baked into attributes so the
 * whole sky is a single draw call with one shader.
 */
const STAR_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScale;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    float twinkle = 0.72 + 0.28 * sin(uTime * 1.6 + aPhase);
    vAlpha = twinkle;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uScale * uPixelRatio * (1.0 / max(1.0, -mvPosition.z * 0.0016));
  }
`

const STAR_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    // A tight core with only a whisper of halo, so bloom stays subtle.
    float core = smoothstep(0.5, 0.06, d);
    gl_FragColor = vec4(vColor * (core * 0.85 + pow(core, 6.0) * 0.5), vAlpha * core * 0.9);
  }
`

export function createStarMaterial(pixelRatio: number): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uScale: { value: 1 },
    },
    vertexShader: STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
}

/**
 * A soft volumetric-looking glow billboard used for the corona, atmosphere
 * halos and the comet's tail.
 */
const GLOW_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const GLOW_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(uMap, vUv);
    gl_FragColor = vec4(uColor * tex.rgb * uIntensity, tex.a * uIntensity);
  }
`

export function createGlowMaterial(map: Texture, color: string): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uColor: { value: new Color(color) },
      uIntensity: { value: 1 },
    },
    vertexShader: GLOW_VERTEX,
    fragmentShader: GLOW_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
}