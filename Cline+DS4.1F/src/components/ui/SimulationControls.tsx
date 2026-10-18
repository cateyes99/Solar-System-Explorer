import { SCALE_MODE_ORDER } from '../../utils/scale'
import { useTranslation } from '../../i18n'
import { useContent } from '../../i18n/content'
import { useSimulationStore } from '../../store/simulationStore'
import type { FocusTargetId, ScaleMode } from '../../types'
import { Chip, CollapsibleSidePanel, PanelCollapseButton, SectionTitle, SliderRow, ToggleRow, ToolbarButton } from './primitives'
import { LayersIcon, OrbitIcon, SparkleIcon, TagIcon } from './icons'
import { audio } from '../../utils/audio'

/**
 * Scale, layers and camera modes.
 *
 * The scale picker is deliberately prominent and honest: whichever mode is
 * active, the panel says exactly what has been squeezed and what has not. On
 * phones and tablets this same content appears inside the settings sheet.
 */
export function SimulationControlsContent() {
  const { t } = useTranslation()
  const content = useContent()
  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const setScaleMode = useSimulationStore((state) => state.setScaleMode)
  const orbitModel = useSimulationStore((state) => state.orbitModel)
  const setOrbitModel = useSimulationStore((state) => state.setOrbitModel)
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

  const info = content.scaleInfo[scaleMode]
  const focusId: FocusTargetId = selectedId ?? 'sun'
  /**
   * The educational orbit set is a complete, independent layout, so while it is
   * active the scale presets have nothing to say: the picker shows the
   * educational preset and the others are switched off rather than pretending
   * to reshape orbits they no longer control.
   */
  const educationalOrbits = orbitModel === 'educational'
  const activeScaleMode: ScaleMode = educationalOrbits ? 'educational' : scaleMode
  const following = followTargetId ? content.bodyById[followTargetId]?.name : undefined

  const surpriseMe = (): void => {
    const pick = content.bodies[Math.floor(Math.random() * content.bodies.length)].id
    selectBody(pick)
    focusBody(pick, 'follow', 7)
    audio.play('whoosh')
    showToast(t('controls.surpriseToast'), 'fun')
  }

  return (
    <div className="space-y-4">
      <section>
        <SectionTitle
          hint={
            educationalOrbits ? t('controls.visualScaleHint.edu') : t('controls.visualScaleHint.real')
          }
        >
          {t('controls.visualScale')}
        </SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {SCALE_MODE_ORDER.map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={activeScaleMode === mode}
              disabled={educationalOrbits}
              onClick={() => setScaleMode(mode)}
              className={`min-h-[2.5rem] rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                activeScaleMode === mode
                  ? 'border-ice/60 bg-ice/20 text-parchment'
                  : 'border-white/12 bg-white/4 text-mist hover:text-parchment'
              }`}
            >
              {content.scaleInfo[mode].title}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-mist/90">{info.description}</p>
        <p className="mt-1 text-[0.68rem] leading-relaxed text-solar/90">{info.caveat}</p>

        {educationalOrbits ? (
          <button
            type="button"
            onClick={() => setOrbitModel('realistic')}
            className="mt-2 min-h-[2.5rem] w-full rounded-lg border border-ice/40 bg-ice/12 px-2.5 py-1.5 text-xs font-medium text-parchment transition-colors hover:bg-ice/20"
          >
            {t('controls.switchToReal')}
          </button>
        ) : null}

        {!educationalOrbits && scaleMode === 'custom' ? (
          <div className="mt-2 space-y-1 rounded-xl border border-white/8 bg-white/4 p-1">
            <SliderRow
              label={t('controls.sizeCompression')}
              value={customScale.sizeExponent}
              min={0.15}
              max={1}
              step={0.01}
              onChange={(value) => setCustomScale({ sizeExponent: value })}
              format={(value) =>
                value >= 0.98 ? t('controls.sizeTrue') : `${Math.round(value * 100)}%`
              }
              hint={t('controls.sizeCompressionHint')}
            />
            <SliderRow
              label={t('controls.orbitSpread')}
              value={customScale.orbitSpread}
              min={0.4}
              max={2.6}
              step={0.05}
              onChange={(value) => setCustomScale({ orbitSpread: value })}
              format={(value) => `${value.toFixed(2)}×`}
              hint={t('controls.orbitSpreadHint')}
            />
            <SliderRow
              label={t('controls.sunSize')}
              value={customScale.sunRadius}
              min={1.6}
              max={9}
              step={0.1}
              onChange={(value) => setCustomScale({ sunRadius: value })}
              format={(value) => `${value.toFixed(1)} ${t('controls.sunUnit')}`}
            />
          </div>
        ) : null}
      </section>

      <section>
        <SectionTitle hint={t('controls.layersHint')}>{t('controls.layers')}</SectionTitle>
        <div className="space-y-0.5">
          <ToggleRow
            label={t('controls.orbitPaths')}
            description={t('controls.orbitPathsDesc')}
            checked={showOrbits}
            onChange={toggleOrbits}
          />
          <ToggleRow
            label={t('controls.labels')}
            description={t('controls.labelsDesc')}
            checked={showLabels}
            onChange={toggleLabels}
          />
          <ToggleRow
            label={t('controls.belt')}
            description={t('controls.beltDesc')}
            checked={showAsteroidBelt}
            onChange={toggleAsteroidBelt}
          />
          <ToggleRow
            label={t('controls.nebula')}
            description={t('controls.nebulaDesc')}
            checked={showNebula}
            onChange={toggleNebula}
          />
          <ToggleRow
            label={t('controls.orbitFlow')}
            description={t('controls.orbitFlowDesc')}
            checked={showOrbitFlow}
            onChange={() => setShowOrbitFlow(!showOrbitFlow)}
          />
        </div>
      </section>

      <section>
        <SectionTitle hint={cameraMode === 'follow' ? t('controls.cameraHint.follow') : cameraMode}>
          {t('controls.camera')}
        </SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          <ToolbarButton icon={<OrbitIcon />} compact onClick={resetView}>
            {t('controls.viewSystem')}
          </ToolbarButton>
          <ToolbarButton
            icon={<TagIcon />}
            compact
            onClick={() => {
              selectBody(focusId)
              focusBody(focusId, 'planet', 6)
            }}
          >
            {t('controls.viewPlanet')}
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
            {t('controls.followPlanet')}
          </ToolbarButton>
          <ToolbarButton icon={<SparkleIcon />} compact onClick={surpriseMe} title={t('controls.surpriseTitle')}>
            {t('controls.surprise')}
          </ToolbarButton>
        </div>
        <p className="mt-2 text-[0.68rem] leading-relaxed text-mist/80">
          {following
            ? t('controls.following', { name: following })
            : t('controls.dragHelp')}
        </p>
      </section>
    </div>
  )
}

/** The desktop version: a floating panel on the left. */
export function SimulationControls() {
  const { t } = useTranslation()
  // While the cinematic tour is running the narration card owns the top-left
  // corner, so the panel steps down instead of being tucked underneath it.
  const cinematicActive = useSimulationStore((state) => state.cinematic.active)
  const collapsed = useSimulationStore((state) => state.ui.leftPanelCollapsed)
  const toggleLeftPanel = useSimulationStore((state) => state.toggleLeftPanel)
  const opacity = useSimulationStore((state) => state.ui.leftPanelOpacity)
  const setOpacity = useSimulationStore((state) => state.setLeftPanelOpacity)

  return (
    <CollapsibleSidePanel
      side="left"
      label={t('controls.title')}
      collapsedLabel={t('controls.title')}
      collapsed={collapsed}
      onToggle={toggleLeftPanel}
      opacity={opacity}
      onOpacityChange={setOpacity}
      expandedWidthClass="w-[19rem] lg:w-[20.5rem]"
      collapsedWidthClass="w-12"
      bodyClassName="px-4 pb-4"
      className={`bottom-44 left-4 max-md:hidden ${cinematicActive ? 'top-[20rem]' : 'top-24'}`}
      header={
        <>
          <p className="sse-label-text">{t('controls.title')}</p>
          <p className="mt-0.5 text-xs text-mist/80">{t('controls.subtitle')}</p>
        </>
      }
      headerActions={
        <PanelCollapseButton
          side="left"
          label={t('controls.collapse')}
          onToggle={toggleLeftPanel}
        />
      }
    >
      <SimulationControlsContent />
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip tone="ice">{t('controls.chipWebgl')}</Chip>
        <Chip tone="violet">{t('controls.chipTextures')}</Chip>
      </div>
    </CollapsibleSidePanel>
  )
}
