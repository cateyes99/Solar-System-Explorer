import { motion } from 'framer-motion'
import { PLANETS, SUN } from '../../data/planets'
import { useAppStore } from '../../store/useAppStore'
import { Icon } from './Icon'
import { useLayout } from '../../hooks/useMediaQuery'
import { spaceAudio } from '../../utils/audio'

/**
 * Quick access to every world. Doubles as a keyboard-navigable list, which is
 * why each entry is a real button inside a labelled group.
 */
export function PlanetNav() {
  const selectedId = useAppStore((s) => s.selectedId)
  const hoveredId = useAppStore((s) => s.hoveredId)
  const select = useAppStore((s) => s.select)
  const focus = useAppStore((s) => s.focus)
  const setHovered = useAppStore((s) => s.setHovered)
  const viewSystem = useAppStore((s) => s.viewSystem)
  const focusedId = useAppStore((s) => s.focusedId)
  const sceneMode = useAppStore((s) => s.sceneMode)
  const panelOpen = useAppStore((s) => s.panel !== null)
  const tourActive = useAppStore((s) => s.tourActive)
  const { isCompact } = useLayout()

  // The rail shares the bottom half of a phone with the timeline, and a bottom
  // sheet covers both, so it steps aside whenever a panel is open.
  if (sceneMode !== 'system' || tourActive || (panelOpen && isCompact)) return null

  const items = [
    { id: 'sun', name: SUN.name, color: '#ffb347' },
    ...PLANETS.map((p) => ({ id: p.id, name: p.name, color: p.accentColor })),
  ]

  return (
    <motion.nav
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1], delay: 0.2 }}
      aria-label="Jump to a world"
      className={[
        'pointer-events-auto absolute z-20 flex gap-1.5',
        isCompact
          ? 'safe-bottom inset-x-0 bottom-[12.5rem] overflow-x-auto px-3'
          : 'left-5 top-1/2 max-h-[70dvh] -translate-y-1/2 flex-col overflow-y-auto',
      ].join(' ')}
    >
      <div
        className={[
          isCompact
            ? 'mx-auto flex w-max gap-0.5 rounded-2xl border border-edge bg-white/4 p-1 backdrop-blur-xl'
            : 'flex flex-col gap-1 rounded-2xl border border-edge bg-white/4 p-1.5 backdrop-blur-xl',
        ].join(' ')}
      >
        <NavChip
          label="All"
          active={!selectedId && !focusedId}
          onClick={() => {
            viewSystem()
            spaceAudio.play('whoosh')
          }}
          title="View the whole Solar System"
          compact={isCompact}
        >
          <Icon name="home" size={15} />
        </NavChip>
        {items.map((item) => (
          <NavChip
            key={item.id}
            label={item.name}
            color={item.color}
            active={selectedId === item.id}
            hovered={hoveredId === item.id}
            title={`${item.name} — click to open, double-click to follow`}
            onClick={() => {
              select(item.id)
              focus(item.id, 'view-planet')
              spaceAudio.play('focus')
            }}
            onDoubleClick={() => {
              focus(item.id, 'follow')
              spaceAudio.play('focus')
            }}
            onHover={(on) => setHovered(on ? item.id : null)}
          compact={isCompact}
          >
            <span
              className="block h-2.5 w-2.5 rounded-full"
              style={{
                background: item.color,
                boxShadow: selectedId === item.id ? `0 0 10px ${item.color}` : 'none',
              }}
            />
          </NavChip>
        ))}
      </div>
    </motion.nav>
  )
}

function NavChip({
  children,
  label,
  color,
  active,
  hovered,
  onClick,
  onDoubleClick,
  onHover,
  title,
  compact,
}: {
  children: React.ReactNode
  label: string
  color?: string
  active?: boolean
  hovered?: boolean
  onClick: () => void
  onDoubleClick?: () => void
  onHover?: (hovering: boolean) => void
  title: string
  compact?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      aria-current={active ? 'true' : undefined}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onPointerEnter={() => onHover?.(true)}
      onPointerLeave={() => onHover?.(false)}
      onFocus={() => onHover?.(true)}
      onBlur={() => onHover?.(false)}
      className={[
        'group relative flex items-center gap-2.5 rounded-xl transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
        compact ? 'px-2 py-2' : 'px-2.5 py-2',
        active ? 'bg-white/12 text-ice-50' : 'text-ice-400 hover:bg-white/7 hover:text-ice-200',
      ].join(' ')}
    >
      {children}
      {!compact && <span className="hidden text-[12px] font-medium tracking-wide whitespace-nowrap xl:block">{label}</span>}
      <span className="sr-only">{label}</span>
      {hovered && (
        <span
          className="pointer-events-none absolute inset-0 rounded-xl border"
          style={{ borderColor: color ?? 'var(--color-edge-strong)' }}
        />
      )}
    </button>
  )
}