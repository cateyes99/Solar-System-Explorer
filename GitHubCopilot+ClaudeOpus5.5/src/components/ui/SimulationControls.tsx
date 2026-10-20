import { BODIES, BODY_IDS } from '../../data/planets'
import { usePlanetFocus } from '../../hooks/usePlanetFocus'
import { useSimulationStore } from '../../store/simulationStore'
import { Icon } from './Icon'
import { PlanetOrb } from './PlanetOrb'

function ViewButtons({ compact = false }: { compact?: boolean }) {
  const { selectedId, cameraMode, focus, follow, isActive } = usePlanetFocus()
  const viewSystem = useSimulationStore((s) => s.viewSystem)
  const surpriseMe = useSimulationStore((s) => s.surpriseMe)
  const target = selectedId ?? 'earth'
  const targetName = BODIES[target].name.replace(/^The /, '')
  const cls = compact ? 'btn glass-soft shrink-0' : 'btn w-full justify-start rounded-2xl'
  return (
    <>
      <button type="button" className={cls} aria-pressed={cameraMode === 'system'} onClick={viewSystem}>
        <Icon name="home" size={18} /> {compact ? 'Solar System' : 'View Solar System'}
      </button>
      <button type="button" className={cls} aria-pressed={isActive('planet', target)} onClick={() => focus(target)}>
        <Icon name="target" size={18} /> View {targetName}
      </button>
      <button
        type="button"
        className={cls}
        aria-pressed={isActive('follow', target)}
        disabled={target === 'sun'}
        onClick={() => follow(target)}
      >
        <Icon name="follow" size={18} /> Follow {targetName}
      </button>
      <button type="button" className={cls} onClick={surpriseMe}>
        <Icon name="shuffle" size={18} /> Surprise Me!
      </button>
    </>
  )
}

function BodyButton({ id, compact }: { id: (typeof BODY_IDS)[number]; compact: boolean }) {
  const { selectedId, focus } = usePlanetFocus()
  const hover = useSimulationStore((s) => s.hover)
  const active = selectedId === id
  const name = BODIES[id].name.replace(/^The /, '')
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`Fly to ${BODIES[id].name}`}
      onClick={() => focus(id)}
      onPointerEnter={() => hover(id)}
      onPointerLeave={() => hover(null)}
      onFocus={() => hover(id)}
      onBlur={() => hover(null)}
      className={
        compact
          ? `btn glass-soft shrink-0 gap-2 pl-2 ${active ? 'btn-active' : ''}`
          : `group flex min-h-11 w-full items-center gap-3 rounded-2xl px-2.5 py-1.5 text-left text-sm font-semibold transition ${
              active ? 'bg-sky-500/20 text-white ring-1 ring-sky-300/50' : 'text-slate-300 hover:bg-white/8 hover:text-white'
            }`
      }
    >
      <PlanetOrb id={id} size={compact ? 22 : 24} />
      <span>{name}</span>
      {!compact && id !== 'sun' && (
        <span className="ml-auto text-[11px] font-medium text-slate-500 group-hover:text-slate-400">{BODY_IDS.indexOf(id)}</span>
      )}
    </button>
  )
}

/** Camera views and the list of bodies; a column on desktop, a scrolling strip on smaller screens. */
export function SimulationControls() {
  const appMode = useSimulationStore((s) => s.appMode)
  const is2D = useSimulationStore((s) => s.renderMode === '2d')
  if (appMode === 'mission' || appMode === 'tour' || is2D) return null
  return (
    <>
      <nav
        aria-label="Camera and planets"
        className="glass pointer-events-auto fixed top-[5.25rem] left-4 z-20 hidden max-h-[calc(100vh-13rem)] w-[228px] flex-col gap-1 overflow-y-auto rounded-3xl p-3 scroll-thin lg:flex"
      >
        <div className="px-1 pb-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">Camera</div>
        <ViewButtons />
        <div className="mt-3 px-1 pb-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">Go to</div>
        {BODY_IDS.map((id) => (
          <BodyButton key={id} id={id} compact={false} />
        ))}
      </nav>
      <nav
        aria-label="Camera and planets"
        className="no-scrollbar pointer-events-auto fixed inset-x-0 bottom-[calc(7rem+env(safe-area-inset-bottom))] z-20 flex gap-2 overflow-x-auto px-3 pb-1 lg:hidden"
      >
        <ViewButtons compact />
        <span className="mx-1 w-px shrink-0 bg-white/15" aria-hidden="true" />
        {BODY_IDS.map((id) => (
          <BodyButton key={id} id={id} compact />
        ))}
      </nav>
    </>
  )
}
