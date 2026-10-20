import { BODIES } from '../../data/planets'
import type { BodyId } from '../../data/types'

/** Small CSS-rendered planet used throughout the interface. */
export function PlanetOrb({ id, size = 28, className = '' }: { id: BodyId; size?: number; className?: string }) {
  const color = BODIES[id].color
  const background =
    id === 'sun'
      ? 'radial-gradient(circle at 40% 38%, #fff7d6 0%, #ffc04d 45%, #ff7a1a 100%)'
      : id === 'earth'
        ? 'radial-gradient(circle at 35% 35%, #9fd0ff 0%, #2f6fd1 45%, #0b2a5b 100%)'
        : id === 'jupiter'
          ? 'repeating-linear-gradient(170deg, #efe2c6 0 14%, #c4936a 14% 24%, #e6cba4 24% 36%, #a8754e 36% 44%)'
          : `radial-gradient(circle at 35% 35%, ${color} 0%, ${color} 40%, #05070f 140%)`
  return (
    <span
      aria-hidden="true"
      className={`planet-orb relative inline-block shrink-0 ${className}`}
      style={{ width: size, height: size, background, ['--orb-glow' as string]: `${color}88` }}
    >
      {id === 'saturn' && (
        <span
          className="absolute top-1/2 left-1/2 rounded-[50%] border-2"
          style={{
            width: size * 1.9,
            height: size * 0.55,
            borderColor: '#e3cf98aa',
            transform: 'translate(-50%, -50%) rotate(-18deg)',
          }}
        />
      )}
    </span>
  )
}
