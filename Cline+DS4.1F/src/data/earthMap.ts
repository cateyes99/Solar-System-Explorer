/**
 * The look of the optional "World map" overlay — national and regional borders,
 * country names, national and state/provincial capitals, and major cities —
 * derived from the app's palette rather than chosen by eye in a component.
 *
 * Colours are deliberately cool and low-saturation so the overlay reads as a
 * cartographic annotation on top of the real imagery instead of competing with
 * it: a pale ice-blue for national borders, a fainter grey-blue for the internal
 * regional lines, a warm amber for capitals (echoing the night-lights glow) and
 * a cool white for other cities. The three label kinds are told apart by colour
 * and weight: an amber ringed badge for a capital, a soft wide-tracked parchment
 * for a country, and a cool white with a dot for a city.
 */
export interface EarthMapVisuals {
  /** National borders. */
  border: {
    color: string
    /** Line width in CSS pixels (see `LineMaterial.linewidth`). */
    width: number
    /** Peak opacity on the lit side of the globe. */
    opacity: number
  }
  /** Internal (state/province) borders. */
  region: {
    color: string
    width: number
    opacity: number
  }
  /** Capital-city markers. */
  capital: {
    color: string
    /** Marker diameter in CSS pixels. */
    size: number
  }
  /** Every other city marker. */
  city: {
    color: string
    size: number
  }
  /** Text labels for the most important places. */
  label: {
    color: string
    /** How far the label sits above the marker, in planet radii. */
    lift: number
    /**
     * How far out toward the limb a label may sit, as a fraction of the globe's
     * projected radius. A name beyond it is dropped, together with the whole
     * back face: near the edge the surface is so foreshortened that the names
     * pile up on top of one another and their pills overhang the planet, which
     * is exactly the clutter worth losing.
     *
     * `27/30` is the tuned value: the names clear the horizon well before the
     * edge, where they crowd and their pills start to overhang. Loosening it to
     * `29/30` barely differs from drawing the whole face, and `49/50` keeps more
     * of the rim still. `utils/geo.ts` turns the fraction into the cosine the
     * per-frame cull actually compares against.
     */
    limbRadius: number
  }
  /**
   * Capital-city names. They are set apart from the other names by their colour
   * and a ringed badge — a warm amber, echoing the capital markers and the night
   * lights — so a country's seat reads as the most important name on the globe
   * however the label switch is set. Capitals are always named whenever labels
   * are on (see `EarthMap.tsx`).
   */
  capitalLabel: {
    color: string
    /** The badge behind the text. */
    background: string
    /** The badge's hairline ring. */
    border: string
  }
  /**
   * State/provincial capital names. A cool mint against the national capitals'
   * warm amber, on its own dark badge, so a regional seat is distinguishable at
   * a glance without ever outranking a country's own capital.
   */
  stateCapitalLabel: {
    color: string
    background: string
    border: string
  }
  /**
   * Country names. Quiet and wide-tracked, with no marker dot: they sit between
   * the capitals and the cities in weight, reading as a soft parchment rather
   * than the cool white of a city.
   */
  countryLabel: {
    color: string
    background: string
  }
  /**
   * How large Earth has to appear (its diameter as a fraction of the viewport's
   * shorter side) before the internal regional borders fade in, and before city
   * labels appear. Both keep the whole-system and mid-distance views legible:
   * from far away only the national outlines and the dots are drawn, and the
   * busy detail arrives as the viewer comes in for a closer look.
   *
   * A focused Earth (the "View Planet" flight) sits at about 0.25, so the
   * borders and the most important city names are all there by the time the
   * viewer is looking at the planet, and nothing shows at the wide system view,
   * where Earth is barely a dot. The rest of the names arrive at
   * `labelDetailFade`, once the globe is large enough to carry them without the
   * text piling up. State/provincial capitals wait for `labelStateFade`, and
   * cities of a million people or more for `labelMillionFade`, the closest tier
   * of all, because there are several hundred regional seats and a hundred more
   * million-plus cities, and they would otherwise swamp the mid-distance globe.
   */
  regionFade: [number, number]
  labelFade: [number, number]
  labelDetailFade: [number, number]
  /**
   * When the state/provincial capitals are named, with the same hysteresis as
   * the other thresholds. They are the first of the two dense sets, so they
   * arrive once Earth is a large regional view and leave again as the viewer
   * pulls back out.
   */
  labelStateFade: [number, number]
  /**
   * When cities of at least a million people are named, with the same hysteresis
   * as the other thresholds. They are the last set, after the provincial seats,
   * and arrive only when the globe overfills the viewport.
   */
  labelMillionFade: [number, number]
  /**
   * How strongly the overlay follows the day/night terminator. 1 lets the
   * borders and cities disappear onto the night side (the default, which keeps
   * the globe's lighting honest); 0 would draw a flat political map over both
   * hemispheres.
   */
  dayFade: number
  /**
   * How far the overlay is pulled toward the camera, as a fraction of the
   * planet's drawn radius — the depth bias that keeps a line from stippling
   * against the ground it lies on.
   *
   * The overlay now reproduces the surface mesh's own interpolation (see
   * `earthMapShader.ts`), so a border lies exactly *on* the ground rather than
   * a hair above or below it. Exactly on is coplanar, and coplanar surfaces
   * flicker as the depth buffer rounds the two the same or not, so the overlay
   * is nudged forward by a hair. It has to be small: a line pulled too far is a
   * line that wins the depth test against terrain genuinely in front of it, and
   * the far side of the globe starts leaking around the limb. A couple of
   * thousandths of the radius is several times the depth buffer's resolution
   * here and a fraction of a pixel on screen.
   */
  cameraLift: number
}

export const EARTH_MAP: EarthMapVisuals = {
  border: { color: '#bfe4ff', width: 1.35, opacity: 0.6 },
  region: { color: '#9dbdd8', width: 1, opacity: 0.32 },
  capital: { color: '#ffd98a', size: 5 },
  city: { color: '#d8ecff', size: 3 },
  label: { color: '#eaf5ff', lift: 0.004, limbRadius: 27 / 30 },
  // Capitals take the marker amber on a dark, ringed badge; state capitals a
  // cool mint on their own dark badge; countries a soft parchment, wide-tracked,
  // so the four label kinds read apart at a glance.
  capitalLabel: { color: '#ffd98a', background: 'rgba(42, 31, 12, 0.82)', border: 'rgba(255, 217, 138, 0.45)' },
  stateCapitalLabel: { color: '#a9e9d2', background: 'rgba(9, 32, 28, 0.78)', border: 'rgba(169, 233, 210, 0.42)' },
  countryLabel: { color: '#ece3d2', background: 'rgba(8, 11, 22, 0.42)' },
  // Regional borders and labels only earn their space once Earth is a decent
  // size on screen; the thresholds are apparent diameters, so they behave the
  // same at every zoom level and in every scale mode.
  regionFade: [0.08, 0.18],
  labelFade: [0.16, 0.22],
  labelDetailFade: [0.4, 0.5],
  // State/provincial capitals arrive first of the two dense sets: there are
  // several hundred of them, and they need the room before the million-plus
  // cities join in.
  labelStateFade: [0.7, 0.8],
  // Million-plus cities are the last names, once the globe overfills the
  // viewport.
  labelMillionFade: [0.8, 0.9],
  dayFade: 1,
  cameraLift: 0.0025,
}
