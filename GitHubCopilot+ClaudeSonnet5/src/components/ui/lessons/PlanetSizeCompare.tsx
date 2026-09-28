import { useState } from 'react'
import { PLANETS, getPlanet, type PlanetId } from '../../../data/planets'
import { formatDiameter } from '../../../utils/format'

/** Side-by-side, true-to-ratio size comparison between any two planets. */
export function PlanetSizeCompare() {
  const [aId, setAId] = useState<PlanetId>('earth')
  const [bId, setBId] = useState<PlanetId>('jupiter')
  const a = getPlanet(aId)
  const b = getPlanet(bId)
  const maxDiameter = Math.max(a.diameterKm, b.diameterKm)
  const pxPerKm = 150 / maxDiameter

  const bigger = a.diameterKm >= b.diameterKm ? a : b
  const smaller = bigger === a ? b : a
  const ratio = bigger.diameterKm / smaller.diameterKm

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full items-end justify-center gap-8 py-2">
        {[a, b].map((planet) => (
          <div key={planet.id} className="flex flex-col items-center gap-2">
            <div
              className="rounded-full transition-all duration-300"
              style={{
                width: Math.max(8, planet.diameterKm * pxPerKm),
                height: Math.max(8, planet.diameterKm * pxPerKm),
                backgroundColor: planet.color,
              }}
            />
            <p className="text-sm font-medium text-white">{planet.name}</p>
            <p className="text-xs text-white/60">{formatDiameter(planet.diameterKm)}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <select
          value={aId}
          onChange={(event) => setAId(event.target.value as PlanetId)}
          aria-label="First planet"
          className="rounded-lg bg-white/10 px-2 py-1.5 text-sm text-white"
        >
          {PLANETS.map((p) => (
            <option key={p.id} value={p.id} className="text-black">
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={bId}
          onChange={(event) => setBId(event.target.value as PlanetId)}
          aria-label="Second planet"
          className="rounded-lg bg-white/10 px-2 py-1.5 text-sm text-white"
        >
          {PLANETS.map((p) => (
            <option key={p.id} value={p.id} className="text-black">
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <p className="max-w-xs text-center text-xs leading-relaxed text-white/60">
        {bigger.name} is about {ratio.toFixed(1)}× as wide as {smaller.name} — roughly{' '}
        {Math.round(Math.pow(ratio, 3)).toLocaleString()} {smaller.name}s could fit inside {bigger.name} by volume!
      </p>
    </div>
  )
}
