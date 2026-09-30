/**
 * Two-body orbital mechanics used by the gravity lesson. Kept free of any
 * Three.js or React dependency so the explanation text and the 3D simulation
 * are guaranteed to agree.
 */

/** Orbital speed needed for a circular orbit at radius `r` around mass `mu`. */
export function circularSpeed(mu: number, r: number): number {
  return Math.sqrt(mu / r)
}

export type GravityOutcome = 'crash' | 'orbit' | 'ellipse' | 'escape'

/**
 * Classifies a launch speed expressed as a multiple of the circular speed.
 * Derived from the standard conic-orbit thresholds, so the label the child reads
 * matches the trajectory they can see.
 */
export function gravityOutcome(speedFactor: number): GravityOutcome {
  if (speedFactor < 0.94) return 'crash'
  if (speedFactor < 1.08) return 'orbit'
  if (speedFactor < 1.42) return 'ellipse'
  return 'escape'
}

export const GRAVITY_EXPLANATIONS: Record<
  GravityOutcome,
  { title: string; body: string; tone: string }
> = {
  crash: {
    title: 'It falls straight in',
    body: 'Too slow. The planet cannot hold on to its sideways speed, so gravity wins and it spirals into the star.',
    tone: 'text-solar',
  },
  orbit: {
    title: 'A perfect circular orbit',
    body: 'This is exactly the speed needed to keep falling around without ever hitting the star or flying away.',
    tone: 'text-cyan-200',
  },
  ellipse: {
    title: 'A stretched oval',
    body: 'A bit too fast, so it swings out far and comes back close. Real planets do exactly this.',
    tone: 'text-cyan-200',
  },
  escape: {
    title: 'It escapes',
    body: 'Far too fast. Nothing bends its path any more, so it sails off into deep space forever.',
    tone: 'text-solar',
  },
}