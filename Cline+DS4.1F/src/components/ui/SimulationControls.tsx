import { BODIES } from '../../data/planets'
import { SCALE_MODE_INFO, SCALE_MODE_ORDER } from '../../utils/scale'
import { useSimulationStore } from '../../store/simulationStore'
import type { FocusTargetId, ScaleMode } from '../../types'
import { Chip, Panel, SectionTitle, SliderRow, ToggleRow, ToolbarButton } from './primitives'
import { LayersIcon, OrbitIcon, SparkleIcon, TagIcon } from './icons'
import { audio } from '../../utils/audio'

/**
 * Scale, layers and camera modes.
 *
 * The scale picker is deliberately prominent and honest: whichever mode is
 * active, the panel says exactly what has been squeezed and what has not. On
 * phones and tablets this same content appears inside the settings sheet.
 */
const SCALE_LABELS: Record<ScaleMode, string> = {
  distances: 'Real Distances',
  educational: 'Educational Scale',
  relativeSize: 'Relative Size',
  custom: 'Custom',
}

export function SimulationControlsContent() {
  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const setScaleMode = useSimulationStore((state) => state.setScaleMode)
  const customScale = useSimulationStore((state) => state.customScale)
  const setCustomScale = useSimulationStore((state) => state.setCustomScale)
  const showOrbits = useSimulationStore((state) => state.showOrbits)
  const toggleOrbits = useSimulationStore((state) => state.toggleOrbits)
  const showLabels = useSimulationStore((state) => state.showLabels)
  const toggleLabels = useSimulationStore((state) => state.toggleLabels)
  const showAsteroidBelt = useSimulationStore((state) => state.showAsteroidBelt)
  const toggleAsteroidBelt = useSimulationStore((state) => state.toggleAsteroidBelt)
  const showNebula = useSimulationStore((state) => state.showNebula)
  const toggleNebula = useSimulationStore((state) => state.toggleNebula)
  const showOrbitFlow = useSimulationStore((state) => state.showOrbitFlow)
  const setShowOrbitFlow = useSimulationStore((state) => state.setShowOrbitFlow)

  const selectedId = useSimulationStore((state) => state.selectedId)
  const focusBody = useSimulationStore((state) => state.focusBody)
  const followTargetId = useSimulationStore((state) => state.followTargetId)
  const cameraMode = useSimulationStore((state) => state.cameraMode)
  const resetView = useSimulationStore((state) => state.resetView)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const showToast = useSimulationStore((state) => state.showToast)

  const info = SCALE_MODE_INFO[scaleMode]
  const focusId: FocusTargetId = selectedId ?? 'sun'

  const surpriseMe = (): void => {
    const pick = BODIES[Math.floor(Math.random() * BODIES.length)].id
    selectBody(pick)
    focusBody(pick, 'follow', 7)
    audio.play('whoosh')
    showToast('Surprise! The camera is now following a random world.', 'fun')
  }

  return (
    <div className="space-y-4">
      <section>
        <SectionTitle hint="real spacing, compressed sizes">Visual scale</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {SCALE_MODE_ORDER.map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={scaleMode === mode}
              onClick={() => setScaleMode(mode)}
              className={`min-h-[2.5rem] rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                scaleMode === mode
                  ? 'border-ice/60 bg-ice/20 text-parchment'
                  : 'border-white/12 bg-white/4 text-mist hover:text-parchment'
              }`}
            >
              {SCALE_LABELS[mode]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-mist/90">{info.description}</p>
        <p className="mt-1 text-[0.68rem] leading-relaxed text-solar/90">{info.caveat}</p>

        {scaleMode === 'custom' ? (
          <div className="mt-2 space-y-1 rounded-xl border border-white/8 bg-white/4 p-1">
            <SliderRow
              label="Planet size compression"
              value={customScale.sizeExponent}
              min={0.15}
              max={1}
              step={0.01}
              onChange={(value) => setCustomScale({ sizeExponent: value })}
              format={(value) => (value >= 0.98 ? 'True size' : `${Math.round(value * 100)}%`)}
              hint="1.00 shows the planets at their true sizes relative to each other."
            />
            <SliderRow
              label="Orbit spread"
              value={customScale.orbitSpread}
              min={0.4}
              max={2.6}
              step={0.05}
              onChange={(value) => setCustomScale({ orbitSpread: value })}
              format={(value) => `${value.toFixed(2)}×`}
              hint="Higher values push the outer planets much farther out."
            />
            <SliderRow
              label="Sun size"
              value={customScale.sunRadius}
              min={1.6}
              max={9}
              step={0.1}
              onChange={(value) => setCustomScale({ sunRadius: value })}
              format={(value) => `${value.toFixed(1)} units`}
            />
          </div>
        ) : null}
      </section>

      <section>
        <SectionTitle hint="tap to toggle">Layers</SectionTitle>
        <div className="space-y-0.5">
          <ToggleRow
            label="Orbit paths"
            description="Slightly stretched ellipses"
            checked={showOrbits}
            onChange={toggleOrbits}
          />
          <ToggleRow
            label="Planet labels"
            description="Fade out with distance"
            checked={showLabels}
            onChange={toggleLabels}
          />
          <ToggleRow
            label="Asteroid belt"
            description="Over a thousand instanced rocks"
            checked={showAsteroidBelt}
            onChange={toggleAsteroidBelt}
          />
          <ToggleRow
            label="Nebula haze"
            description="A distant galactic band"
            checked={showNebula}
            onChange={toggleNebula}
          />
          <ToggleRow
            label="Orbit direction arrows"
            description="See which way the planets travel"
            checked={showOrbitFlow}
            onChange={() => setShowOrbitFlow(!showOrbitFlow)}
          />
        </div>
      </section>

      <section>
        <SectionTitle hint={cameraMode === 'follow' ? 'following' : cameraMode}>Camera</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          <ToolbarButton icon={<OrbitIcon />} compact onClick={resetView}>
            View Solar System
          </ToolbarButton>
          <ToolbarButton
            icon={<TagIcon />}
            compact
            onClick={() => {
              selectBody(focusId)
              focusBody(focusId, 'planet', 6)
            }}
          >
            View Planet
          </ToolbarButton>
          <ToolbarButton
            icon={<LayersIcon />}
            compact
            active={cameraMode === 'follow'}
            onClick={() => {
              selectBody(focusId)
              focusBody(focusId, 'follow', 6)
            }}
          >
            Follow Planet
          </ToolbarButton>
          <ToolbarButton icon={<SparkleIcon />} compact onClick={surpriseMe} title="Surprise me!">
            Surprise Me
          </ToolbarButton>
        </div>
        <p className="mt-2 text-[0.68rem] leading-relaxed text-mist/80">
          {followTargetId
            ? `Following ${
                BODIES.find((body) => body.id === followTargetId)?.name ?? 'the spacecraft'
              }. Drag to orbit around it.`
            : 'Drag to rotate, scroll or pinch to zoom, right-drag or two fingers to pan. Double-click a planet to follow it.'}
        </p>
      </section>
    </div>
  )
}

/** The desktop version: a floating panel on the left. */
export function SimulationControls() {
  // While the cinematic tour is running the narration card owns the top-left
  // corner, so the panel steps down instead of being tucked underneath it.
  const cinematicActive = useSimulationStore((state) => state.cinematic.active)

  return (
    <Panel
      as="aside"
      label="Scale, layers and camera controls"
      className={`pointer-events-auto fixed bottom-44 left-4 hidden w-[19rem] overflow-y-auto p-4 transition-[top] duration-500 md:block lg:w-[20.5rem] ${
        cinematicActive ? 'top-[20rem]' : 'top-24'
      }`}
    >
      <SimulationControlsContent />
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip tone="ice">WebGL · react-three-fiber</Chip>
        <Chip tone="violet">Procedural textures</Chip>
      </div>
    </Panel>
  )
}