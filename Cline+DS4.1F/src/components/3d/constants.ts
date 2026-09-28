import { Vector3 } from 'three'

/** The Sun sits at the origin of the scene: everything else orbits around it. */
export const SUN_POSITION = new Vector3(0, 0, 0)

/** Outside-in unit vector used when sizing the camera for a focused body. */
export const CAMERA_UP = new Vector3(0, 1, 0)

/** Distance at which the "whole Solar System" shot is framed. */
export const SYSTEM_VIEW_DISTANCE = 118
