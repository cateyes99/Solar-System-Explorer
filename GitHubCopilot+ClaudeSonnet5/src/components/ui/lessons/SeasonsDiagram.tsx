const ORBIT_POSITIONS = [-90, 0, 90, 180]

/** Top-down diagram showing Earth's fixed-direction axial tilt at four points in its orbit. */
export function SeasonsDiagram() {
  const radius = 78
  const center = 100

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 200 200" className="h-56 w-56">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeDasharray="4 4"
        />
        <circle cx={center} cy={center} r={11} fill="#ffb347" />
        {ORBIT_POSITIONS.map((angleDeg) => {
          const rad = (angleDeg * Math.PI) / 180
          const x = center + Math.cos(rad) * radius
          const y = center + Math.sin(rad) * radius
          const tiltRad = (23.4 * Math.PI) / 180
          const tiltX = Math.sin(tiltRad) * 13
          const tiltY = -Math.cos(tiltRad) * 13
          return (
            <g key={angleDeg}>
              <circle cx={x} cy={y} r={6} fill="#2f6fb0" />
              <line x1={x - tiltX} y1={y - tiltY} x2={x + tiltX} y2={y + tiltY} stroke="#eef2ff" strokeWidth={2} />
            </g>
          )
        })}
      </svg>
      <p className="max-w-xs text-center text-xs leading-relaxed text-white/60">
        Earth’s axis always points in the same direction in space as it travels around the Sun. That means each
        hemisphere leans toward the Sun for part of the year (summer) and away from it for another part (winter) —
        that’s what creates our seasons.
      </p>
    </div>
  )
}
