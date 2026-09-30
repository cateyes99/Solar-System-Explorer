import { Vector3 } from 'three'

/** The Sun sits at the origin of the scene: everything else orbits around it. */
export const SUN_POSITION = new Vector3(0, 0, 0)

/** Outside-in unit vector used when sizing the camera for a focused body. */
export const CAMERA_UP = new Vector3(0, 1, 0)

/** Distance at which the "whole Solar System" shot is framed. */
export const SYSTEM_VIEW_DISTANCE = 118

/**
 * Distances, in planet radii, over which the wide-view cues fade out.
 *
 * Orbit paths and the flat selection marker are only useful while a world is a
 * distant disc: up close both of them are drawn *between* the camera and the
 * planet, and because a planet's orbit passes exactly through the planet, the
 * near arc of a marker or a path cuts a thin bright line straight across its
 * face. Both are gone by `WIDE_VIEW_FADE_OUT_RADII` and fully drawn beyond
 * `WIDE_VIEW_FADE_IN_RADII`; a camera arriving on a focused world sits about
 * eight radii away, and the whole-system view is far beyond both.
 */
export const WIDE_VIEW_FADE_OUT_RADII = 11
export const WIDE_VIEW_FADE_IN_RADII = 22
