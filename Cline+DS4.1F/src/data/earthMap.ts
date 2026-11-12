/**
 * The look of the optional "World map" overlay — national and regional borders,
 * capitals and major cities — derived from the app's palette rather than chosen
 * by eye in a component.
 *
 * Colours are deliberately cool and low-saturation so the overlay reads as a
 * cartographic annotation on top of the real imagery instead of competing with
 * it: a pale ice-blue for national borders, a fainter grey-blue for the internal
 * regional lines, a warm amber for capitals (echoing the night-lights glow) and
 * a cool white for other cities.
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
   * text piling up.
   */
  regionFade: [number, number]
  labelFade: [number, number]
  labelDetailFade: [number, number]
  /**
   * How strongly the overlay follows the day/night terminator. 1 lets the
   * borders and cities disappear onto the night side (the default, which keeps
   * the globe's lighting honest); 0 would draw a flat political map over both
   * hemispheres.
   */
  dayFade: number
}

export const EARTH_MAP: EarthMapVisuals = {
  border: { color: '#bfe4ff', width: 1.35, opacity: 0.6 },
  region: { color: '#9dbdd8', width: 1, opacity: 0.32 },
  capital: { color: '#ffd98a', size: 5 },
  city: { color: '#d8ecff', size: 3 },
  label: { color: '#eaf5ff', lift: 0.004, limbRadius: 27 / 30 },
  // Regional borders and labels only earn their space once Earth is a decent
  // size on screen; the thresholds are apparent diameters, so they behave the
  // same at every zoom level and in every scale mode.
  regionFade: [0.08, 0.18],
  labelFade: [0.16, 0.22],
  labelDetailFade: [0.4, 0.5],
  dayFade: 1,
}
