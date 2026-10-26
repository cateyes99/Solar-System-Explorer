import { AnimatePresence, motion } from 'framer-motion'
import { BODY_VISUALS } from '../../data/visuals'
import { useTranslation } from '../../i18n'
import { useContent } from '../../i18n/content'
import { useSimulationStore } from '../../store/simulationStore'
import type { BodyId } from '../../types'
import { TimeControls } from './TimeControls'
import { ChevronIcon } from './icons'
import { IconButton } from './primitives'
import { audio } from '../../utils/audio'

/** The quick-navigation strip: tap a world and the camera flies there. */
const TIMELINE_ORDER: BodyId[] = [
  'sun',
  'mercury',
  'venus',
  'earth',
  'moon',
  'mars',
  'belt',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
  'comet',
  'halley',
]

/**
 * The bottom console: quick travel to any world, and the time controls.
 *
 * It folds away like the two side panels, on its own flag, so a child who wants
 * an unobstructed view of the sky can tuck it down to a slim handle and pull it
 * back with one tap.
 */
export function BottomBar() {
  const { t } = useTranslation()
  const content = useContent()
  const selectedId = useSimulationStore((state) => state.selectedId)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const focusBody = useSimulationStore((state) => state.focusBody)
  const paused = useSimulationStore((state) => state.paused)
  const cinematicActive = useSimulationStore((state) => state.cinematic.active)
  const collapsed = useSimulationStore((state) => state.ui.bottomBarCollapsed)
  const toggleBottomBar = useSimulationStore((state) => state.toggleBottomBar)

  return (
    <footer
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-void/92 via-void/60 to-transparent px-2 pb-2 transition-opacity duration-300 sm:px-5 sm:pb-4 ${
        collapsed ? 'pt-4' : 'pt-8'
      } ${cinematicActive ? 'opacity-65 hover:opacity-100' : 'opacity-100'}`}
    >
      <div className="pointer-events-auto mx-auto flex max-w-[100rem] flex-col gap-2">
        {/* The console folds away as one block. The `grid-rows` trick animates to
            the content's own height (whatever the chips wrap to), and `invisible`
            — which the transition holds off until the fold finishes — also takes
            the hidden controls out of the tab order. */}
        <div
          aria-hidden={collapsed}
          className={`grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-out ${
            collapsed ? 'invisible grid-rows-[0fr] opacity-0' : 'visible grid-rows-[1fr] opacity-100'
          }`}
        >
          <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
            <nav
              aria-label={t('bottom.quickTravel')}
              className="sse-scroll -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1"
            >
              {TIMELINE_ORDER.map((id) => {
                const body = content.bodyById[id]
                if (!body) return null
                const accent = BODY_VISUALS[id]?.accent ?? '#8ab4ff'
                const active = selectedId === id
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      audio.play('click')
                      selectBody(id)
                      focusBody(id, 'planet', id === 'sun' ? 3.6 : 6)
                    }}
                    className={`flex min-h-[2.75rem] shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'border-white/40 bg-white/16 text-parchment'
                        : 'border-white/12 bg-void/55 text-mist hover:border-white/25 hover:text-parchment'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: accent, boxShadow: `0 0 10px 1px ${accent}` }}
                    />
                    {body.name}
                  </button>
                )
              })}
            </nav>

            <div
              role="group"
              aria-label={t('bottom.timeControls')}
              className="sse-panel flex flex-wrap items-center gap-2 px-3 py-2"
            >
              <TimeControls />
              <div className="ml-auto flex items-center gap-2">
                <span className="sse-numeric hidden text-[0.66rem] text-mist/80 xl:inline">
                  {t(paused ? 'time.pausedNote' : 'time.runningNote')}
                </span>
                <IconButton
                  label={t('bottom.collapse')}
                  icon={<ChevronIcon size={16} direction="down" />}
                  onClick={toggleBottomBar}
                />
              </div>
            </div>
          </div>
        </div>

        {/* The collapsed handle: the same glass, folded to a slim bar. */}
        <AnimatePresence initial={false}>
          {collapsed ? (
            <motion.button
              key="bottom-bar-handle"
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onClick={toggleBottomBar}
              aria-label={t('bottom.expand')}
              title={t('bottom.expand')}
              className="sse-panel mx-auto flex min-h-[2.25rem] items-center gap-2 rounded-full px-4 py-1.5 text-mist transition-colors hover:text-parchment"
            >
              <span aria-hidden="true">
                <ChevronIcon size={16} direction="up" />
              </span>
              <span className="text-[0.66rem] font-medium uppercase tracking-[0.24em]">
                {t('bottom.title')}
              </span>
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </footer>
  )
}
