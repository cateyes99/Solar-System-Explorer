import type { Camera } from 'three'

/**
 * Tiny bridge that hands the 3D camera (and its canvas size) to the DOM-side
 * label overlay.
 *
 * Body labels deliberately live outside the React Three Fiber reconciler:
 * drei's <Html> mounts its own react-dom root per label, and unmounting those
 * roots during the scene's commit phase makes React 19 warn about
 * "synchronously unmount a root". One shared DOM overlay avoids that, costs
 * zero extra React roots, and is cheaper to update.
 */
export interface LabelBridge {
  camera: Camera | null
  /** Canvas size in CSS pixels */
  width: number
  height: number
}

export const labelBridge: LabelBridge = {
  camera: null,
  width: 0,
  height: 0,
}
