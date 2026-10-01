/**
 * Real orbital and rotational elements, taken from published public sources.
 *
 * `KEPLERIAN_ELEMENTS` are the JPL Solar System Dynamics approximate elements
 * (E.M. Standish & J.G. Williams, "Keplerian Elements for Approximate Positions
 * of the Major Planets", valid 1800 AD – 2050 AD). Each entry gives the element
 * at J2000.0 and its rate per Julian century. Together they reproduce a planet's
 * real position to a few arcminutes, which is far finer than this app can show.
 *
 * `POLE_ELEMENTS` are the IAU Working Group on Cartographic Coordinates and
 * Rotational Elements recommended north-pole directions. Using the true pole
 * means each planet's axial tilt points the way it really does relative to its
 * orbit, instead of being an arbitrary rotation about an arbitrary axis.
 *
 * Sources:
 *   https://ssd.jpl.nasa.gov/planets/approx_pos.html
 *   https://ssd.jpl.nasa.gov/planets/phys_par.html
 *   Seidelmann, P.K. et al., "Report of the IAU Working Group on Cartographic
 *   Coordinates and Rotational Elements: 2009", Celest. Mech. Dyn. 41, 471-510.
 */

/** Obliquity of the ecliptic at J2000.0, radians. Used to rotate poles. */
export const OBLIQUITY_RAD = (23.43928 * Math.PI) / 180

/** Julian date of J2000.0, the epoch the elements are referenced to. */
export const JD_J2000 = 2451545.0
export const DAYS_PER_JULIAN_CENTURY = 36525

export interface KeplerianSet {
  /** Semi-major axis, au, and rate per century. */
  a: number
  aDot: number
  /** Eccentricity (dimensionless), and rate per century. */
  e: number
  eDot: number
  /** Inclination to the ecliptic, degrees, and rate per century. */
  i: number
  iDot: number
  /** Mean longitude, degrees, and rate per century. */
  l: number
  lDot: number
  /** Longitude of perihelion, degrees, and rate per century. */
  peri: number
  periDot: number
  /** Longitude of the ascending node, degrees, and rate per century. */
  node: number
  nodeDot: number
}

/**
 * JPL Table 1. Earth is represented by the Earth/Moon barycentre, which is what
 * the JPL elements are fitted to; over the scale of this app that is identical
 * to Earth's own orbit.
 */
export const KEPLERIAN_ELEMENTS: Record<string, KeplerianSet> = {
  mercury: { a: 0.38709927, aDot: 0.00000037, e: 0.20563593, eDot: 0.00001906, i: 7.00497902, iDot: -0.00594749, l: 252.2503235, lDot: 149472.67411175, peri: 77.45779628, periDot: 0.16047689, node: 48.33076593, nodeDot: -0.12534081 },
  venus: { a: 0.72333566, aDot: 0.0000039, e: 0.00677672, eDot: -0.00004107, i: 3.39467605, iDot: -0.0007889, l: 181.9790995, lDot: 58517.81538729, peri: 131.60246718, periDot: 0.00268329, node: 76.67984255, nodeDot: -0.27769418 },
  earth: { a: 1.00000261, aDot: 0.00000562, e: 0.01671123, eDot: -0.00004392, i: -0.00001531, iDot: -0.01294668, l: 100.46457166, lDot: 35999.37244981, peri: 102.93768193, periDot: 0.32327364, node: 0, nodeDot: 0 },
  mars: { a: 1.52371034, aDot: 0.00001847, e: 0.0933941, eDot: 0.00007882, i: 1.84969142, iDot: -0.00813131, l: -4.55343205, lDot: 19140.30268499, peri: -23.94362959, periDot: 0.44441088, node: 49.55953891, nodeDot: -0.29257343 },
  jupiter: { a: 5.202887, aDot: -0.00011607, e: 0.04838624, eDot: -0.00013253, i: 1.30439695, iDot: -0.00183714, l: 34.39644051, lDot: 3034.74612775, peri: 14.72847983, periDot: 0.21252668, node: 100.47390909, nodeDot: 0.20469106 },
  saturn: { a: 9.53667594, aDot: -0.0012506, e: 0.05386179, eDot: -0.00050991, i: 2.48599187, iDot: 0.00193609, l: 49.95424423, lDot: 1222.49362201, peri: 92.59887831, periDot: -0.41897216, node: 113.66242448, nodeDot: -0.28867794 },
  uranus: { a: 19.18916464, aDot: -0.00196176, e: 0.04725744, eDot: -0.00004397, i: 0.77263783, iDot: -0.00242939, l: 313.23810451, lDot: 428.48202785, peri: 170.9542763, periDot: 0.40805281, node: 74.01692503, nodeDot: 0.04240589 },
  neptune: { a: 30.06992276, aDot: 0.00026291, e: 0.00859048, eDot: 0.00005105, i: 1.77004347, iDot: 0.00035372, l: -55.12002969, lDot: 218.45945325, peri: 44.96476227, periDot: -0.32241464, node: 131.78422574, nodeDot: -0.00508664 },
}

export interface PoleElement {
  /** Right ascension of the north pole, degrees, J2000.0. */
  alpha: number
  /** Declination of the north pole, degrees, J2000.0. */
  delta: number
  /** Rate of change per Julian century, where the IAU gives one. */
  alphaDot?: number
  deltaDot?: number
  /**
   * Set when the pole oscillates instead of drifting steadily. Neptune's pole
   * swings on a ~52 year cycle, which is worth carrying because it changes the
   * planet's obliquity by more than a degree and a half.
   */
  oscillation?: { amplitudeDeg: number; periodCenturies: number; phaseDeg: number }
}

/**
 * IAU recommended north poles. Venus and Uranus rotate retrograde, so their
 * published obliquities exceed 90 degrees and their poles sit on the opposite
 * side from the direction of travel.
 */
export const POLE_ELEMENTS: Record<string, PoleElement> = {
  mercury: { alpha: 281.0097, delta: 61.4143, alphaDot: -0.0328, deltaDot: -0.0049 },
  venus: { alpha: 272.76, delta: 67.16 },
  earth: { alpha: 0, delta: 90, alphaDot: -0.641, deltaDot: -0.557 },
  mars: { alpha: 317.68143, delta: 52.8865, alphaDot: -0.1061, deltaDot: -0.0609 },
  jupiter: { alpha: 268.056595, delta: 64.495303, alphaDot: -0.006499, deltaDot: 0.002413 },
  saturn: { alpha: 40.589, delta: 83.537, alphaDot: -0.036, deltaDot: -0.004 },
  uranus: { alpha: 257.311, delta: -15.175 },
  neptune: {
    alpha: 299.36,
    delta: 43.46,
    oscillation: { amplitudeDeg: 0.7, periodCenturies: 1 / 52.316, phaseDeg: 357.85 },
  },
}

/**
 * Rotational flattening, (equatorial − polar) / equatorial, from JPL physical
 * parameters. Saturn really is this squashed — it is one of the few planetary
 * features a naked eye could pick out on a photograph.
 */
export const FLATTENING: Record<string, number> = {
  mercury: 0.0009,
  venus: 0,
  earth: 1 / 298.257,
  mars: 1 / 169.8,
  jupiter: 1 / 15.415,
  saturn: 1 / 10.208,
  uranus: 1 / 43.6,
  neptune: 1 / 58.54,
}

/**
 * Geometric albedo — the fraction of incoming light a body reflects back.
 * These are the real published values and they explain why the Moon looks like
 * a bright mirror next to coal-dark Chariklo, even though both are similar sizes.
 */
export const GEOMETRIC_ALBEDO: Record<string, number> = {
  mercury: 0.106,
  venus: 0.65,
  earth: 0.367,
  mars: 0.15,
  jupiter: 0.52,
  saturn: 0.47,
  uranus: 0.51,
  neptune: 0.41,
}
