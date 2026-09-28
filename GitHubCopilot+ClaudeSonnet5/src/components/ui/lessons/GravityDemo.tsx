import { useState } from 'react'
import { motion } from 'framer-motion'

/** A simplified, clearly-illustrative (not physically simulated) gravity demo. */
export function GravityDemo() {
  const [mass, setMass] = useState(5)
  const orbitRadius = 100 - mass * 6
  const orbitDuration = Math.max(1, 6 - mass * 0.45)
  const centralSize = 24 + mass * 4

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-56 w-56 items-center justify-center">
        <div
          className="absolute rounded-full border border-dashed border-white/15"
          style={{ width: orbitRadius * 2, height: orbitRadius * 2 }}
        />
        <div
          className="rounded-full bg-gradient-to-br from-yellow-200 to-solar-orange"
          style={{ width: centralSize, height: centralSize, boxShadow: '0 0 30px 8px rgba(255,157,77,0.4)' }}
        />
        <motion.div
          className="absolute"
          animate={{ rotate: 360 }}
          transition={{ duration: orbitDuration, repeat: Infinity, ease: 'linear' }}
        >
          <div className="h-3 w-3 rounded-full bg-electric-blue" style={{ transform: `translateX(${orbitRadius}px)` }} />
        </motion.div>
      </div>
      <label className="flex w-full max-w-xs flex-col gap-1 text-xs text-white/70">
        Mass of the central object ({mass}×)
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={mass}
          onChange={(event) => setMass(Number(event.target.value))}
          className="accent-electric-blue"
        />
      </label>
      <p className="max-w-xs text-center text-xs leading-relaxed text-white/60">
        This is a simplified illustration, not a real physics simulation: as you increase the central mass, gravity
        pulls harder, so the orbiting object needs a tighter, faster path to keep from drifting away.
      </p>
    </div>
  )
}
