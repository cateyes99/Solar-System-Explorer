import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  Color,
  DoubleSide,
  FrontSide,
  ShaderMaterial,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3,
  type Texture,
} from 'three'

const SIMPLEX_NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`

const WORLD_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vLocal;
void main() {
  vUv = uv;
  vLocal = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosW = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`

export interface PlanetMaterialOptions {
  map: Texture
  aux?: Texture
  ambient: number
  rimColor?: string
  rimStrength?: number
  transparent?: boolean
}

/** Sun-lit planet surface with day/night, optional city lights and ocean glint. */
export function createPlanetMaterial(options: PlanetMaterialOptions): ShaderMaterial {
  const isEarth = Boolean(options.aux)
  return new ShaderMaterial({
    defines: isEarth ? { EARTH: '' } : {},
    uniforms: {
      uMap: { value: options.map },
      uAux: { value: options.aux ?? null },
      uSunPos: { value: new Vector3() },
      uSunlight: { value: 1 },
      uAmbient: { value: options.ambient },
      uHighlight: { value: 0 },
      uHighlightColor: { value: new Color('#8fd8ff') },
      uRimColor: { value: new Color(options.rimColor ?? '#ffffff') },
      uRimStrength: { value: options.rimStrength ?? 0 },
      uOpacity: { value: 1 },
    },
    vertexShader: WORLD_VERTEX,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform sampler2D uAux;
      uniform vec3 uSunPos;
      uniform float uSunlight;
      uniform float uAmbient;
      uniform float uHighlight;
      uniform vec3 uHighlightColor;
      uniform vec3 uRimColor;
      uniform float uRimStrength;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vec3 N = normalize(vNormalW);
        vec3 L = normalize(uSunPos - vPosW);
        vec3 V = normalize(cameraPosition - vPosW);
        float ndl = dot(N, L);
        float wrap = clamp((ndl + 0.08) / 1.08, 0.0, 1.0);
        vec4 tex = texture2D(uMap, vUv);
        vec3 col = tex.rgb * (wrap * 1.3 * uSunlight + uAmbient);
        float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        col += uRimColor * fres * uRimStrength * smoothstep(-0.2, 0.6, ndl) * uSunlight;
        #ifdef EARTH
          vec4 aux = texture2D(uAux, vUv);
          float night = mix(1.0, 1.0 - smoothstep(-0.18, 0.08, ndl), uSunlight);
          col += vec3(1.0, 0.72, 0.38) * aux.r * night * 1.1;
          vec3 H = normalize(L + V);
          float spec = pow(max(dot(N, H), 0.0), 70.0) * aux.g * smoothstep(0.0, 0.2, ndl) * uSunlight;
          col += vec3(1.0, 0.93, 0.8) * spec * 0.55;
        #endif
        col += uHighlightColor * fres * uHighlight * 0.9 + col * uHighlight * 0.12;
        gl_FragColor = vec4(col, tex.a * uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: options.transparent ?? false,
    depthWrite: !options.transparent,
  })
}

/** Soft atmospheric halo that is brighter on the day side. */
export function createAtmosphereMaterial(color: string, intensity: number): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(color) },
      uIntensity: { value: intensity },
      uSunPos: { value: new Vector3() },
      uSunlight: { value: 1 },
    },
    vertexShader: WORLD_VERTEX,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform vec3 uSunPos;
      uniform float uSunlight;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vec3 N = normalize(vNormalW);
        vec3 V = normalize(cameraPosition - vPosW);
        vec3 L = normalize(uSunPos - vPosW);
        float d = clamp(dot(N, V), 0.0, 1.0);
        float rim = pow(1.0 - d, 2.6) * smoothstep(0.0, 0.22, d);
        float lit = smoothstep(-0.4, 0.5, dot(N, L));
        float a = rim * uIntensity * mix(0.08, 1.0, lit) * mix(0.15, 1.0, uSunlight);
        gl_FragColor = vec4(uColor * a, a);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: FrontSide,
  })
}

/** Planetary rings with radial texture and the planet’s shadow. */
export function createRingMaterial(map: Texture, inner: number, outer: number, opacity = 1): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uInner: { value: inner },
      uOuter: { value: outer },
      uSunPos: { value: new Vector3() },
      uPlanetPos: { value: new Vector3() },
      uPlanetRadius: { value: 1 },
      uSunlight: { value: 1 },
      uOpacity: { value: opacity },
    },
    vertexShader: WORLD_VERTEX,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uInner;
      uniform float uOuter;
      uniform vec3 uSunPos;
      uniform vec3 uPlanetPos;
      uniform float uPlanetRadius;
      uniform float uSunlight;
      uniform float uOpacity;
      varying vec3 vLocal;
      varying vec3 vPosW;
      void main() {
        float r = length(vLocal.xy);
        float t = (r - uInner) / (uOuter - uInner);
        if (t < 0.0 || t > 1.0) discard;
        vec4 tex = texture2D(uMap, vec2(t, 0.5));
        vec3 Ld = normalize(uSunPos - vPosW);
        vec3 oc = uPlanetPos - vPosW;
        float b = dot(oc, Ld);
        float shadow = 1.0;
        if (b > 0.0) {
          float dist = sqrt(max(dot(oc, oc) - b * b, 0.0));
          shadow = smoothstep(uPlanetRadius * 0.94, uPlanetRadius * 1.02, dist);
        }
        float light = (0.06 + 0.94 * shadow) * uSunlight + 0.03;
        gl_FragColor = vec4(tex.rgb * light * 1.15, tex.a * uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  })
}

export function createSunMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uFade: { value: 1 },
      uFlare: { value: 0 },
      uHighlight: { value: 0 },
    },
    vertexShader: WORLD_VERTEX,
    fragmentShader: /* glsl */ `
      ${SIMPLEX_NOISE}
      uniform float uTime;
      uniform float uFade;
      uniform float uFlare;
      uniform float uHighlight;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      varying vec3 vLocal;
      void main() {
        vec3 p = normalize(vLocal);
        float t = uTime * 0.035;
        float n1 = snoise(p * 2.6 + vec3(t, -t * 0.6, t * 0.3));
        float n2 = snoise(p * 7.0 + vec3(-t * 1.3, t, t * 0.7) + n1 * 0.4);
        float n3 = snoise(p * 20.0 + vec3(t * 2.0, t * 1.5, -t));
        float gran = n1 * 0.5 + n2 * 0.33 + n3 * 0.17;
        float spots = smoothstep(0.7, 0.86, snoise(p * 2.4 + vec3(0.0, t * 0.15, 4.0)));
        vec3 V = normalize(cameraPosition - vPosW);
        float mu = clamp(dot(normalize(vNormalW), V), 0.0, 1.0);
        float limb = pow(mu, 0.5);
        float k = gran * 0.5 + 0.5;
        vec3 deep = vec3(0.95, 0.22, 0.02);
        vec3 mid = vec3(1.0, 0.5, 0.08);
        vec3 hot = vec3(1.0, 0.84, 0.45);
        vec3 col = mix(deep, mid, smoothstep(0.2, 0.6, k));
        col = mix(col, hot, smoothstep(0.55, 0.95, k));
        col = mix(col, vec3(0.45, 0.11, 0.01), spots * 0.6);
        col *= mix(0.45, 1.0, limb);
        col *= 1.6 + uFlare * 1.6 + uHighlight * 0.3;
        gl_FragColor = vec4(col * uFade, 1.0);
        #include <colorspace_fragment>
      }`,
    toneMapped: false,
  })
}

export function createCoronaMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 1 },
      uColor: { value: new Color(1.0, 0.62, 0.25) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      ${SIMPLEX_NOISE}
      uniform float uTime;
      uniform float uIntensity;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        float a = atan(p.y, p.x);
        float edge = 0.25;
        float x = max(r - edge, 0.0) / (1.0 - edge);
        float rays = snoise(vec3(cos(a) * 2.5, sin(a) * 2.5, uTime * 0.06 - r * 1.2)) * 0.5 + 0.5;
        rays = mix(rays, snoise(vec3(cos(a) * 7.0, sin(a) * 7.0, uTime * 0.09)) * 0.5 + 0.5, 0.35);
        float corona = pow(1.0 - x, 4.0) * (0.45 + 0.75 * rays);
        float inner = exp(-x * 9.0);
        float alpha = (corona * 0.55 + inner * 0.9) * smoothstep(1.0, 0.8, r) * uIntensity;
        gl_FragColor = vec4(uColor * alpha * 1.25, alpha);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  })
}

export function createOrbitMaterial(color: string): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(color) },
      uOpacity: { value: 0.22 },
      uPlanetT: { value: 0 },
      uTrail: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aT;
      varying float vT;
      void main() {
        vT = aT;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uPlanetT;
      uniform float uTrail;
      varying float vT;
      void main() {
        float d = fract(uPlanetT - vT);
        float trail = pow(1.0 - d, 12.0) * uTrail;
        gl_FragColor = vec4(uColor * (1.0 + trail), uOpacity + trail * 0.7);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
  })
}

export function createStarMaterial(pixelRatio: number): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uTwinkle: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute vec3 aColor;
      attribute float aPhase;
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uTwinkle;
      varying vec3 vColor;
      varying float vBright;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float tw = 1.0 + sin(uTime * (0.5 + aPhase * 1.8) + aPhase * 40.0) * 0.32 * uTwinkle;
        gl_PointSize = aSize * uPixelRatio * tw;
        vColor = aColor;
        vBright = tw;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vBright;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a *= a;
        gl_FragColor = vec4(vColor * a * vBright, a);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  })
}

export function createNebulaMaterial(map: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { uMap: { value: map }, uOpacity: { value: 0.9 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        vec3 c = texture2D(uMap, vUv).rgb * uOpacity;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
    side: BackSide,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  })
}

/** Tail pointing away from the Sun; geometry is a cone along +Y. */
export function createCometTailMaterial(color: string): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { uColor: { value: new Color(color) }, uTime: { value: 0 }, uStrength: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uStrength;
      varying vec2 vUv;
      void main() {
        float along = vUv.y;
        float flicker = 0.85 + 0.15 * sin(uTime * 3.0 + along * 20.0 + vUv.x * 30.0);
        float a = pow(along, 2.2) * flicker * uStrength * 0.5;
        gl_FragColor = vec4(uColor * a, a);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
  })
}

/** Expanding shell used in the “Sun disappears” simulation. */
export function createWaveMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { uColor: { value: new Color('#9be7ff') }, uOpacity: { value: 0.8 } },
    vertexShader: WORLD_VERTEX,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vec3 V = normalize(cameraPosition - vPosW);
        float f = pow(1.0 - abs(dot(normalize(vNormalW), V)), 4.0);
        float a = f * uOpacity;
        gl_FragColor = vec4(uColor * a, a);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
  })
}

let glowTexture: Texture | null = null

/** Shared soft radial glow used for sprites (engine flames, comet coma, beacons). */
export function getGlowTexture(): Texture {
  if (glowTexture) return glowTexture
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.2, 'rgba(255,255,255,0.6)')
    g.addColorStop(0.5, 'rgba(255,255,255,0.15)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
  }
  glowTexture = new CanvasTexture(canvas)
  glowTexture.colorSpace = SRGBColorSpace
  return glowTexture
}

export function createGlowMaterial(color: string, opacity = 1): SpriteMaterial {
  return new SpriteMaterial({
    map: getGlowTexture(),
    color: new Color(color),
    transparent: true,
    opacity,
    blending: AdditiveBlending,
    depthWrite: false,
  })
}
