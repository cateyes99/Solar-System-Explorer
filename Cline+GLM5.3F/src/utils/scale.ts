import type { CustomScale, PlanetId, ScaleMode } from '../types'

/**
 * "Educational Scale": the Solar System rendered at friendly, explorable sizes.
 * Nothing here is physically to scale — every mode says so in its `note`.
 */
export interface SceneLayout {
  sunRadius: number
  planetRadius(id: PlanetId): number
  moonRadius(): number
  orbitRadius(id: PlanetId): number
  moonOrbitRadius(earthRadius: number): number
  beltInner: number
  beltOuter: number
  /** One-line human explanation of the current scale, shown in the UI. */
  note: string
}

const DIAMETERS: Record<PlanetId, number> = {
  mercury: 4879,
  venus: 12_104,
  earth: 12_742,
  mars: 6779,
  jupiter: 139_820,
  saturn: 116_460,
  uranus: 50_724,
  neptune: 49_244,
}

const AU: Record<PlanetId, number> = {
  mercury: 0.387,
  venus: 0.723,
  earth: 1,
  mars: 1.524,
  jupiter: 5.203,
  saturn: 9.537,
  uranus: 19.19,
  neptune: 30.07,
}

/** Hand-tuned "museum model" sizes, in scene units. */
const EDU_RADII: Record<PlanetId, number> = {
  mercury: 0.42,
  venus: 0.78,
  earth: 0.82,
  mars: 0.6,
  jupiter: 2.5,
  saturn: 2.1,
  uranus: 1.35,
  neptune: 1.3,
}

const EDU_ORBIT = (au: number): number => 8 + 7.2 * Math.pow(au, 0.62)

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

export function getLayout(mode: ScaleMode, custom: CustomScale): SceneLayout {
  switch (mode) {
    case 'relative': {
      const earthRadius = 0.62
      return {
        sunRadius: 11,
        planetRadius: (id) => (DIAMETERS[id] / 12_742) * earthRadius,
        moonRadius: () => 0.17,
        orbitRadius: (id) => EDU_ORBIT(AU[id]) * 1.12,
        moonOrbitRadius: (r) => r * 2.3 + 0.17,
        beltInner: EDU_ORBIT(2.2) * 1.12,
        beltOuter: EDU_ORBIT(3.3) * 1.12,
        note: 'True relative planet sizes (the Sun is shrunk so everything stays visible). Distances are still compressed.',
      }
    }
    case 'distances': {
      const orbit = (id: PlanetId) => 2.4 + 2.35 * AU[id]
      return {
        sunRadius: 2.2,
        planetRadius: (id) => clamp(0.5 * Math.sqrt(DIAMETERS[id] / 12_742), 0.16, 0.85),
        moonRadius: () => 0.1,
        orbitRadius: orbit,
        moonOrbitRadius: (r) => r * 2.6 + 0.1,
        beltInner: orbit('mars') + 1.4,
        beltOuter: orbit('jupiter') - 2.2,
        note: 'Real-ish relative distances from the Sun. Space is mostly empty — this is why planets look tiny out here!',
      }
    }
    case 'custom': {
      const size = clamp(custom.sizeExaggeration, 0.2, 4)
      const spread = clamp(custom.distanceSpread, 0.5, 2.2)
      return {
        sunRadius: clamp(5 * size, 1, 12),
        planetRadius: (id) => EDU_RADII[id] * size,
        moonRadius: () => 0.25 * Math.min(size, 2),
        orbitRadius: (id) => EDU_ORBIT(AU[id]) * spread,
        moonOrbitRadius: (r) => r * 2.2 + 0.2 * Math.min(size, 2),
        beltInner: EDU_ORBIT(2.2) * spread,
        beltOuter: EDU_ORBIT(3.3) * spread,
        note: 'Your own scale — mix and match planet sizes and orbital distances.',
      }
    }
    case 'educational':
    default: {
      return {
        sunRadius: 5,
        planetRadius: (id) => EDU_RADII[id],
        moonRadius: () => 0.25,
        orbitRadius: (id) => EDU_ORBIT(AU[id]),
        moonOrbitRadius: (r) => r * 2.1 + 0.25,
        beltInner: EDU_ORBIT(2.15),
        beltOuter: EDU_ORBIT(3.35),
        note: 'A friendly "museum model" — sizes and distances are exaggerated so everything is easy to see. Definitely NOT to scale!',
      }
    }
  }
}
