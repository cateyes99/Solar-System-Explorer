import { PLANETS } from '../../../data/planets'

const AU_KM = 149_600_000

/** A squashed-scale strip so every planet's relative distance from the Sun fits on screen at once. */
export function PlanetDistanceStrip() {
  const maxAu = Math.max(...PLANETS.map((p) => p.distanceFromSunKm)) / AU_KM

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-28 w-full rounded-xl bg-white/5 px-4">
        <div className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-white/15" />
        <div className="absolute left-2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-solar-orange" />
        {PLANETS.map((planet) => {
          const au = planet.distanceFromSunKm / AU_KM
          const percent = Math.pow(au / maxAu, 0.45) * 92 + 4
          return (
            <div
              key={planet.id}
              className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{ left: `${percent}%` }}
            >
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: planet.color }} />
              <span className="text-[9px] text-white/60">{planet.name}</span>
            </div>
          )
        })}
      </div>
      <p className="text-center text-xs leading-relaxed text-white/60">
        This strip uses a squashed scale so every planet fits — real distances are far more extreme. For example:
        if the Sun were the size of a basketball (24 cm), Earth would be about 26 meters away, and Neptune would be
        almost 800 meters away!
      </p>
    </div>
  )
}
