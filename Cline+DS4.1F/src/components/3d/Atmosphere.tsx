import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BackSide, Color, FrontSide, ShaderMaterial, Vector3 } from 'three'
import type { Mesh } from 'three'
import type { AtmosphereVisuals } from '../../data/visuals'
import { SPHERE_LODS } from './geometry'

/**
 * The atmosphere's own sphere, one rung finer than the shared shell. Its
 * silhouette is where the haze dissolves, so a coarse polygon there reads as a
 * stepped edge once the globe is zoomed in.
 */
const ATMOSPHERE_SPHERE = SPHERE_LODS[4]

/**
 * Atmospheric glow, drawn as a slightly larger additive shell.
 *
 * The haze is a **single-scattering approximation**: for every pixel the shader
 * works out how much air the view ray crosses — the chord of the atmosphere
 * shell, cut short where the ray meets the planet — so the glow is thin over the
 * disc, thickest where the ray grazes the limb, and fades softly to nothing at
 * the shell's edge. It costs no marching: the chord is closed-form.
 *
 * Crucially the shells are drawn **before the opaque surface** (`renderOrder`
 * below the planet's, in the opaque pass, without writing depth). The planet —
 * including its displaced terrain — is then painted straight over them. So the
 * ground itself is what cuts the haze: a mountain standing past the mean
 * silhouette stays fully opaque, and the glow hugs the *real* horizon with no
 * mask to align, no rotation lag and no parallax. Nothing floats above the
 * ground, so nothing can be misaligned with it.
 *
 * The colour is Rayleigh + Mie, each with its own scattering phase: the air
 * keeps its own hue in daylight, warms toward `sunsetColor` where the sunlight
 * rakes through the longest slant of atmosphere, and adds a forward-scattered
 * halo around the Sun (the Mie lobe, from `mieG`). A soft day/night term
 * multiplies the whole thing, and a whisper of airglow keeps the night limb off
 * pure black.
 *
 * A third shell lays a thin veil *over* the ground. It is not the shell's column
 * (which is exaggerated so the mountains fit inside it) but the air straight
 * down, scaled by the view airmass — so the sub-satellite point stays clear and
 * the ground hazes as it recedes toward the limb. That is the aerial
 * perspective, and `aerialStrength` sets how strongly it takes hold.
 */
const vertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vCenter;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    // The planet's centre, so the fragment stage can measure the view ray against
    // the planet without a separate uniform or a per-frame matrix inverse.
    vCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSunsetColor;
  uniform float uIntensity;
  uniform float uPower;
  uniform float uDensity;
  uniform float uMieIntensity;
  uniform float uMieG;
  uniform float uSunsetStrength;
  uniform float uAerialStrength;
  uniform float uShellScale;
  uniform float uOpacity;
  /* 0 = the ring under the planet, 1 = the faint tint over the disc. */
  uniform float uDiscOnly;
  uniform vec3 uSunPosition;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vCenter;

  /*
   * Henyey–Greenstein phase function — the standard stand-in for Mie scattering.
   * It is a strong forward lobe with a faint tail behind, shaped by the
   * asymmetry g (0 = isotropic, toward 1 = all forward). Real aerosol Mie
   * scattering has g around 0.7, which is why the halo is a bright glare around
   * the Sun rather than a wash in every direction. It is normalised so its
   * forward peak is 1, so uMieIntensity keeps meaning "the glare straight at the
   * Sun" rather than an absolute cross-section.
   */
  float miePhase(float cosTheta, float g) {
    float k = 1.0 - g;
    float denom = 1.0 + g * g - 2.0 * g * cosTheta;
    return (k * k * k) / (denom * sqrt(denom));
  }

  void main() {
    // The view ray, measured from the planet's centre.
    vec3 ro = cameraPosition - vCenter;
    vec3 rd = normalize(vWorldPosition - cameraPosition);
    float d = length(ro);
    float b = dot(ro, rd);
    float r0sq = max(d * d - b * b, 0.0);
    float r0 = sqrt(r0sq);

    // This shell and the planet it wraps (their radii are in a fixed ratio).
    float rAtm = length(vWorldPosition - vCenter);
    float rPlanet = rAtm / uShellScale;

    // How much air the ray crosses: from the shell's near face to its far face, or
    // only to the planet where the ray meets it.
    float nearHalf = sqrt(max(rAtm * rAtm - r0sq, 0.0));
    float blocked = r0 < rPlanet ? sqrt(max(rPlanet * rPlanet - r0sq, 0.0)) : 0.0;
    // The far half of the column only appears once the ray clears the planet.
    // Ramping it in over the last sliver of the limb stops the glow from stepping
    // as the ray crosses the edge.
    float clears = smoothstep(rPlanet, rPlanet * 1.01, r0);
    float path = nearHalf - blocked + clears * nearHalf;
    float inScatter = 1.0 - exp(-(path / rAtm) * uDensity);
    float density = pow(inScatter, uPower);

    // The Sun's height above this point of the shell. 1 = overhead, 0 = the
    // horizon, < 0 = night.
    vec3 up = normalize(vWorldNormal);
    vec3 sunDir = normalize(uSunPosition - vWorldPosition);
    float sunHeight = dot(up, sunDir);
    float day = smoothstep(-0.35, 0.3, sunHeight);

    // The scattering angle: +1 looking straight at the Sun (forward scatter),
    // -1 looking away from it. Both phase functions depend on it.
    float cosTheta = clamp(dot(rd, sunDir), -1.0, 1.0);

    // The airmass the sunlight crosses to reach this point: ~1 with the Sun
    // overhead, climbing steeply as it nears the horizon, where the light rakes
    // through the longest slant of air. That slant is what warms the atmosphere
    // at the terminator, so the transition tracks the real geometry rather than
    // the Sun's height alone.
    float airmass = 1.0 / max(sunHeight + 0.16, 0.03);
    float twilight = 1.0 - exp(-uSunsetStrength * max(airmass - 1.0, 0.0));

    // Rayleigh: the air's own hue, warming to the sunset colour through the long
    // slant. Its phase (1 + cos²θ, scaled to average 1) is nearly isotropic, with
    // a gentle brightening toward and away from the Sun.
    float rayleigh = 0.75 * (1.0 + cosTheta * cosTheta);
    vec3 sky = mix(uColor, uSunsetColor, twilight);
    // Mie: the forward-scattered halo that blooms around the Sun through the air.
    float mie = miePhase(cosTheta, uMieG) * uMieIntensity;
    vec3 scatter = sky * rayleigh * day + mix(vec3(1.0), uSunsetColor, twilight) * mie * day;

    // A whisper of airglow keeps the night limb from going fully black.
    float light = 0.12 + 0.88 * day;
    // The **halo** (uDiscOnly = 0). This shell is drawn back-face, so its
    // fragment is the *far* face of the chord — behind whatever surface is
    // there. The opaque surface has already written depth, so the halo is culled
    // exactly where the ground is and only shows past it. That is what makes it
    // hug the real horizon: terrain, seafloor, drained globe, whatever is
    // actually there — with no mask, no radius, and nothing to align. It
    // dissolves before the shell's edge so it blends into space.
    float farColumn = nearHalf / rAtm;
    float halo = pow(1.0 - exp(-farColumn * uDensity), uPower) * (1.0 - smoothstep(0.9, 1.0, r0 / rAtm));
    // The over-ground **veil** (uDiscOnly = 1). It is deliberately *not* the
    // shell's column: the shell is lifted by the terrain's peak so the mountains
    // fit inside it, which makes its column ~16x thicker than real air. A veil
    // that thick over the ground reads as glass, so this is the air straight
    // down instead — a thin optical depth, but scaled by how obliquely the view
    // ray crosses it. Straight down (the nadir) the view airmass is 1 and the
    // veil is the tuned base; toward the limb the ray rakes through more air, so
    // the veil thickens. That is the aerial perspective that hazes the ground as
    // it recedes into the distance, while the sub-satellite point stays clear.
    // It dissolves before the shell's edge, exactly as the halo does, so the
    // airmass cannot run away at the silhouette and the veil blends into space.
    // (The shell is lifted by the terrain's peak, so this fade sits outside even
    // the highest ground — the veil still covers the mountains, rather than
    // clipping them off at the mean radius.) uAerialStrength is the airmass
    // exponent: 1 is the physical optical-depth scaling, 0 restores a uniform
    // veil.
    float viewCos = max(dot(up, -rd), 0.0);
    float veilAirmass = 1.0 / max(viewCos, 0.2);
    float veil = pow(veilAirmass, uAerialStrength) * (1.0 - smoothstep(0.9, 1.0, r0 / rAtm));
    float alpha = mix(halo, veil, uDiscOnly) * light * uIntensity * uOpacity;
    gl_FragColor = vec4(scatter * alpha, alpha);
  }
`

interface AtmosphereProps {
  radius: number
  visuals: AtmosphereVisuals
  /** Multiplier allows fades for focus changes and the "What If?" experiments. */
  opacity?: number
  sunPosition: Vector3
  /**
   * How far above the planet's mean radius the haze has to start, in planet
   * radii. A displaced surface is taller than a sphere, so Earth's haze is
   * lifted by the height of its highest ground — otherwise the mountains would
   * stand outside the atmosphere they are supposed to be inside.
   */
  shellLift?: number
}

/** The radii of the two shells, as multiples of the planet's own radius. */
const RIM_SHELL = 1.045
const HAZE_SHELL = 1.14

/** The shell density when a body does not name one (see `AtmosphereVisuals`). */
const DEFAULT_DENSITY = 2.6
/** The wide haze is thinner than the rim, so it reads as a faint halo. */
const HAZE_DENSITY_RATIO = 0.85
/**
 * The Mie asymmetry when a body does not name one (see `AtmosphereVisuals`).
 * ~0.7 is the measured aerosol value: a clear forward glare with almost nothing
 * behind.
 */
const DEFAULT_MIE_G = 0.7
/** How fast the air reddens as the Sun sinks, when a body does not name one. */
const DEFAULT_SUNSET_STRENGTH = 0.3
/**
 * The over-ground veil's airmass exponent when a body does not name one (see
 * `AtmosphereVisuals.aerialStrength`). 1 is the physical optical-depth scaling.
 */
const DEFAULT_AERIAL_STRENGTH = 1

/**
 * After the planet's own order, so its depth is in the buffer: the back-face
 * halo is then culled exactly where the ground is, and the front-face veil lies
 * over it. See the module comment.
 */
const ATMOSPHERE_RENDER_ORDER = 4

/** After the halo, so the veil lies over both the ground and the ring. */
const DISC_RENDER_ORDER = 5

export function Atmosphere({
  radius,
  visuals,
  opacity = 1,
  sunPosition,
  shellLift = 0,
}: AtmosphereProps) {
  const meshRef = useRef<Mesh>(null)
  const density = visuals.density ?? DEFAULT_DENSITY
  const mieG = visuals.mieG ?? DEFAULT_MIE_G
  const sunsetStrength = visuals.sunsetStrength ?? DEFAULT_SUNSET_STRENGTH
  const aerialStrength = visuals.aerialStrength ?? DEFAULT_AERIAL_STRENGTH

  const material = useMemo(() => {
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: new Color(visuals.color) },
        uSunsetColor: { value: new Color(visuals.sunsetColor ?? visuals.color) },
        uIntensity: { value: visuals.intensity },
        uPower: { value: visuals.power },
        uDensity: { value: density },
        uMieIntensity: { value: visuals.mieIntensity ?? 0.5 },
        uMieG: { value: mieG },
        uSunsetStrength: { value: sunsetStrength },
        uAerialStrength: { value: aerialStrength },
        uShellScale: { value: RIM_SHELL + shellLift },
        uOpacity: { value: opacity },
        uDiscOnly: { value: 0 },
        uSunPosition: { value: sunPosition.clone() },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: BackSide,
    })
    // `opacity` and `shellLift` are intentionally not dependencies: the per-frame
    // update below writes them into the uniforms, so dragging the Earth slider or
    // the terrain-relief dial retunes the haze without rebuilding the material.
  }, [visuals.color, visuals.sunsetColor, visuals.intensity, visuals.power, visuals.mieIntensity, density, mieG, sunsetStrength, aerialStrength, sunPosition])

  const hazeMaterial = useMemo(() => {
    if (!visuals.hazeColor) return null
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: new Color(visuals.hazeColor) },
        uSunsetColor: { value: new Color(visuals.sunsetColor ?? visuals.hazeColor) },
        uIntensity: { value: visuals.hazeIntensity ?? 0.3 },
        uPower: { value: Math.max(1.1, visuals.power - 1.6) },
        uDensity: { value: density * HAZE_DENSITY_RATIO },
        uMieIntensity: { value: 0 },
        uMieG: { value: mieG },
        uSunsetStrength: { value: sunsetStrength },
        uAerialStrength: { value: aerialStrength },
        uShellScale: { value: HAZE_SHELL + shellLift },
        uOpacity: { value: opacity },
        uDiscOnly: { value: 0 },
        uSunPosition: { value: sunPosition.clone() },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: BackSide,
    })
  }, [visuals.hazeColor, visuals.sunsetColor, visuals.hazeIntensity, visuals.power, density, mieG, sunsetStrength, aerialStrength, sunPosition])

  // The thin veil over the ground, drawn *after* the surface so the terrain
  // stays solid underneath it. It spans the whole haze area, so the protruding
  // terrain is veiled exactly like the disc.
  const discMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: new Color(visuals.color) },
        uSunsetColor: { value: new Color(visuals.sunsetColor ?? visuals.color) },
        uIntensity: { value: visuals.discIntensity ?? 0.06 },
        uPower: { value: visuals.power },
        uDensity: { value: 0 },
        uMieIntensity: { value: 0 },
        uMieG: { value: mieG },
        uSunsetStrength: { value: sunsetStrength },
        uAerialStrength: { value: aerialStrength },
        uShellScale: { value: HAZE_SHELL + shellLift },
        uOpacity: { value: opacity },
        uDiscOnly: { value: 1 },
        uSunPosition: { value: sunPosition.clone() },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: FrontSide,
    })
  }, [visuals.color, visuals.sunsetColor, visuals.power, visuals.discIntensity, mieG, sunsetStrength, aerialStrength, sunPosition])

  // The Sun barely moves, but keeping the uniform fresh costs nothing and keeps
  // the terminator correct in every scale mode.
  useFrame(() => {
    material.uniforms.uSunPosition.value.copy(sunPosition)
    material.uniforms.uOpacity.value = opacity
    material.uniforms.uShellScale.value = RIM_SHELL + shellLift
    if (hazeMaterial) {
      hazeMaterial.uniforms.uSunPosition.value.copy(sunPosition)
      hazeMaterial.uniforms.uOpacity.value = opacity
      hazeMaterial.uniforms.uShellScale.value = HAZE_SHELL + shellLift
    }
    discMaterial.uniforms.uSunPosition.value.copy(sunPosition)
    discMaterial.uniforms.uOpacity.value = opacity
    // The veil's own shell scale, matching its mesh (see the render below): it
    // is what `rPlanet` is derived from, so it has to agree with the geometry.
    discMaterial.uniforms.uShellScale.value = HAZE_SHELL + shellLift
  })

  return (
    <group ref={meshRef}>
      <mesh
        geometry={ATMOSPHERE_SPHERE}
        material={material}
        scale={radius * (RIM_SHELL + shellLift)}
        renderOrder={ATMOSPHERE_RENDER_ORDER}
      />
      {hazeMaterial ? (
        <mesh
          geometry={ATMOSPHERE_SPHERE}
          material={hazeMaterial}
          scale={radius * (HAZE_SHELL + shellLift)}
          renderOrder={ATMOSPHERE_RENDER_ORDER}
        />
      ) : null}
      {/* Drawn last, over the surface: the thin veil the air lays on the ground. */}
      <mesh
        geometry={ATMOSPHERE_SPHERE}
        material={discMaterial}
        scale={radius * (HAZE_SHELL + shellLift)}
        renderOrder={DISC_RENDER_ORDER}
      />
    </group>
  )
}
