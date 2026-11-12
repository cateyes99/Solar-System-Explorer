import { AnimatePresence } from 'framer-motion'
import { BODY_VISUALS } from '../../data/visuals'
import { SEAWATER_MODES, seawaterModeFor } from '../../data/seawaterModes'
import { WAVE_STYLES, waveStyleFor } from '../../data/waveStyles'
import { OCEAN_COLOURS, oceanColourFor } from '../../data/oceanColours'
import { useTranslation } from '../../i18n'
import { useContent } from '../../i18n/content'
import { useSimulationStore } from '../../store/simulationStore'
import { useFormatters } from '../../utils/format'
import { getDistanceFromSun } from '../../utils/bodyRegistry'
import { Chip, CollapsibleSidePanel, PanelCollapseButton, SectionTitle, SliderRow, Stat, ToggleRow, ToolbarButton } from './primitives'
import { CloseIcon, OrbitIcon, RocketIcon } from './icons'

/**
 * The planet information panel.
 *
 * Every number here is real astronomy (rounded, and labelled as approximate).
 * The panel also makes the visualisation's compromises explicit, so a child
 * learns the science without being misled by the picture.
 */
export function PlanetPanel() {
  const { t } = useTranslation()
  const content = useContent()
  const f = useFormatters()
  const selectedId = useSimulationStore((state) => state.selectedId)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const focusBody = useSimulationStore((state) => state.focusBody)
  const resetView = useSimulationStore((state) => state.resetView)
  const openEducation = useSimulationStore((state) => state.openEducation)
  const registerDiscovery = useSimulationStore((state) => state.registerDiscovery)
  const discoveries = useSimulationStore((state) => state.discoveries)
  const earthAtmosphereOpacity = useSimulationStore((state) => state.earthAtmosphereOpacity)
  const setEarthAtmosphereOpacity = useSimulationStore((state) => state.setEarthAtmosphereOpacity)
  const earthCloudOpacity = useSimulationStore((state) => state.earthCloudOpacity)
  const setEarthCloudOpacity = useSimulationStore((state) => state.setEarthCloudOpacity)
  const earthCloudDynamics = useSimulationStore((state) => state.earthCloudDynamics)
  const setEarthCloudDynamics = useSimulationStore((state) => state.setEarthCloudDynamics)
  const earthCloudCoverage = useSimulationStore((state) => state.earthCloudCoverage)
  const setEarthCloudCoverage = useSimulationStore((state) => state.setEarthCloudCoverage)
  const earthTerrainRelief = useSimulationStore((state) => state.earthTerrainRelief)
  const setEarthTerrainRelief = useSimulationStore((state) => state.setEarthTerrainRelief)
  const earthSeafloorRelief = useSimulationStore((state) => state.earthSeafloorRelief)
  const setEarthSeafloorRelief = useSimulationStore((state) => state.setEarthSeafloorRelief)
  const earthSeawaterOpacity = useSimulationStore((state) => state.earthSeawaterOpacity)
  const setEarthSeawaterOpacity = useSimulationStore((state) => state.setEarthSeawaterOpacity)
  const earthSeaLevel = useSimulationStore((state) => state.earthSeaLevel)
  const setEarthSeaLevel = useSimulationStore((state) => state.setEarthSeaLevel)
  const earthWaveIntensity = useSimulationStore((state) => state.earthWaveIntensity)
  const setEarthWaveIntensity = useSimulationStore((state) => state.setEarthWaveIntensity)
  const earthSwellDetail = useSimulationStore((state) => state.earthSwellDetail)
  const setEarthSwellDetail = useSimulationStore((state) => state.setEarthSwellDetail)
  const earthSkyReflection = useSimulationStore((state) => state.earthSkyReflection)
  const setEarthSkyReflection = useSimulationStore((state) => state.setEarthSkyReflection)
  const earthOceanColour = useSimulationStore((state) => state.earthOceanColour)
  const setEarthOceanColour = useSimulationStore((state) => state.setEarthOceanColour)
  const earthWaveStyle = useSimulationStore((state) => state.earthWaveStyle)
  const setEarthWaveStyle = useSimulationStore((state) => state.setEarthWaveStyle)
  const earthSeawaterMode = useSimulationStore((state) => state.earthSeawaterMode)
  const setEarthSeawaterMode = useSimulationStore((state) => state.setEarthSeawaterMode)
  const showEarthMap = useSimulationStore((state) => state.showEarthMap)
  const toggleEarthMap = useSimulationStore((state) => state.toggleEarthMap)
  const rightCollapsed = useSimulationStore((state) => state.ui.rightPanelCollapsed)
  const toggleRightPanel = useSimulationStore((state) => state.toggleRightPanel)
  const rightOpacity = useSimulationStore((state) => state.ui.rightPanelOpacity)
  const setRightOpacity = useSimulationStore((state) => state.setRightPanelOpacity)

  const body = selectedId ? content.bodyById[selectedId] : undefined
  const open = Boolean(body)
  const accent = body ? (BODY_VISUALS[body.id]?.accent ?? body.color) : '#8ab4ff'
  const liveDistanceUnits = body ? getDistanceFromSun(body.id) : 0
  const moons = body ? content.satellitesOf(body.id) : []
  const isWorld = body?.kind === 'planet' || body?.kind === 'moon' || body?.kind === 'dwarf'
  // The active ocean implementation. Its registry entry carries the labels and
  // hints both the switcher and the shared slider show, so relabelling the
  // slider per mode needs no special-casing here.
  const seawaterMode = seawaterModeFor(earthSeawaterMode)
  // The active wave model under Volumetric mode. Its registry entry carries the
  // labels and hints the switcher shows, so a third model needs no change here.
  const waveStyle = waveStyleFor(earthWaveStyle)
  // The active body colour under Volumetric mode. Its registry entry carries the
  // label and hint the switcher shows, so a new colour needs no change here.
  const oceanColour = oceanColourFor(earthOceanColour)

  return (
    <AnimatePresence>
      {open && body ? (
        <CollapsibleSidePanel
          key={body.id}
          role="dialog"
          side="right"
          label={body.name}
          collapsedLabel={body.name}
          collapsed={rightCollapsed}
          onToggle={toggleRightPanel}
          opacity={rightOpacity}
          onOpacityChange={setRightOpacity}
          expandedWidthClass="sm:w-[24rem]"
          collapsedWidthClass="sm:w-12"
          bodyClassName="px-4 pb-4"
          className="inset-x-2 bottom-48 max-h-[52vh] sm:inset-x-auto sm:right-4 sm:top-20 sm:bottom-44 sm:max-h-none"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          header={
            <>
              <p className="sse-label-text" style={{ color: accent }}>
                {body.type}
              </p>
              <h2 className="sse-text-shadow mt-1 text-xl font-semibold text-parchment">{body.name}</h2>
              <p className="mt-0.5 text-sm italic text-mist/90">{body.tagline}</p>
            </>
          }
          headerActions={
            <>
              {/* Collapsing only makes sense for the desktop right-hand drawer;
                  on phones this panel is a full-width bottom sheet. */}
              <span className="hidden sm:inline-flex">
                <PanelCollapseButton
                  side="right"
                  label={t('planet.collapse')}
                  onToggle={toggleRightPanel}
                />
              </span>
              <button
                type="button"
                aria-label={t('planet.close', { name: body.name })}
                onClick={() => selectBody(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-mist transition-colors hover:text-parchment"
              >
                <span aria-hidden="true">
                  <CloseIcon />
                </span>
              </button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-parchment/95">{body.description}</p>

          {body.id === 'earth' ? (
            <div className="mt-4">
              <SectionTitle hint={t('planet.worldMapHint')}>{t('planet.worldMap')}</SectionTitle>
              <div className="rounded-xl border border-white/8 bg-white/4 p-1">
                <ToggleRow
                  label={t('planet.worldMapToggle')}
                  description={t('planet.worldMapToggleDesc')}
                  checked={showEarthMap}
                  onChange={toggleEarthMap}
                />
              </div>
            </div>
          ) : null}

          {body.id === 'earth' ? (
            <div className="mt-4">
              <SectionTitle hint={t('planet.atmosphereHint')}>{t('planet.earthAtmosphere')}</SectionTitle>
              <div className="rounded-xl border border-white/8 bg-white/4 p-1">
                <SliderRow
                  label={t('planet.atmosphereHaze')}
                  value={earthAtmosphereOpacity}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setEarthAtmosphereOpacity}
                  format={(value) => `${Math.round(value * 100)}%`}
                  hint={t('planet.atmosphereHazeHint')}
                />
              </div>
            </div>
          ) : null}

          {body.id === 'earth' ? (
            <div className="mt-4">
              <SectionTitle hint={t('planet.terrainHint')}>{t('planet.earthTerrain')}</SectionTitle>
              <div className="rounded-xl border border-white/8 bg-white/4 p-1">
                <SliderRow
                  label={t('planet.terrainRelief')}
                  value={earthTerrainRelief}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setEarthTerrainRelief}
                  format={(value) => `${Math.round(value * 100)}%`}
                  hint={t('planet.terrainReliefHint')}
                />
              </div>
            </div>
          ) : null}

          {body.id === 'earth' ? (
            <div className="mt-4">
              <SectionTitle hint={t('planet.seafloorHint')}>{t('planet.earthSeafloor')}</SectionTitle>

              {/* Which ocean implementation draws the sea. The options come from
                  the mode registry, so a future "Option C" shows up here with no
                  change to this panel. */}
              <div
                role="group"
                aria-label={t('planet.seawaterMode')}
                className="flex gap-1 rounded-xl border border-white/8 bg-white/4 p-1"
              >
                {SEAWATER_MODES.map((mode) => {
                  const active = mode.id === earthSeawaterMode
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setEarthSeawaterMode(mode.id)}
                      className={`min-h-[2.25rem] flex-1 rounded-lg border px-2 text-xs font-medium transition-colors ${
                        active
                          ? 'border-ice/60 bg-ice/20 text-parchment'
                          : 'border-transparent bg-transparent text-mist hover:text-parchment'
                      }`}
                    >
                      {t(mode.labelKey)}
                    </button>
                  )
                })}
              </div>
              <p className="mt-1 px-1 text-[0.68rem] leading-relaxed text-mist/80">
                {t(seawaterMode.hintKey)}
              </p>

              {/* One slider for both implementations; only its label and hint
                  follow the active mode (see `data/seawaterModes.ts`). */}
              <div className="mt-2 rounded-xl border border-white/8 bg-white/4 p-1">
                <SliderRow
                  label={t(seawaterMode.sliderLabelKey)}
                  value={earthSeawaterOpacity}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setEarthSeawaterOpacity}
                  format={(value) => `${Math.round(value * 100)}%`}
                  hint={t(seawaterMode.sliderHintKey)}
                />
                {/* The fill level is a property of a layered ocean only, so the
                    registry shows this slider for the volumetric mode alone. */}
                {seawaterMode.seaLevel ? (
                  <SliderRow
                    label={t('planet.seaLevel')}
                    value={earthSeaLevel}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={setEarthSeaLevel}
                    format={(value) => `${Math.round(value * 100)}%`}
                    hint={t('planet.seaLevelHint')}
                  />
                ) : null}
                {/* The body colour belongs to the layered water body, so the
                    switcher is shown for the volumetric mode alone. Its options
                    come from the colour registry, so a new deep blue needs no
                    change here. */}
                {seawaterMode.layeredWater ? (
                  <>
                    <div
                      role="group"
                      aria-label={t('planet.oceanColour')}
                      className="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-white/8 bg-white/4 p-1"
                    >
                      {OCEAN_COLOURS.map((colour) => {
                        const active = colour.id === earthOceanColour
                        return (
                          <button
                            key={colour.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setEarthOceanColour(colour.id)}
                            className={`min-h-[2.25rem] rounded-lg border px-2 text-xs font-medium transition-colors ${
                              active
                                ? 'border-ice/60 bg-ice/20 text-parchment'
                                : 'border-transparent bg-transparent text-mist hover:text-parchment'
                            }`}
                          >
                            {t(colour.labelKey)}
                          </button>
                        )
                      })}
                    </div>
                    <p className="mb-1 px-1 text-[0.68rem] leading-relaxed text-mist/80">
                      {t(oceanColour.hintKey)}
                    </p>
                  </>
                ) : null}
                {/* Waves are a property of the layered water body only, so the
                    registry shows these controls for the volumetric mode alone.
                    The switcher picks the wave model — the living spectral sea or
                    the tiling ripples — and the slider scales whichever is
                    active. */}
                {seawaterMode.wave ? (
                  <>
                    <div
                      role="group"
                      aria-label={t('planet.waveStyle')}
                      className="mb-1 flex gap-1 rounded-xl border border-white/8 bg-white/4 p-1"
                    >
                      {WAVE_STYLES.map((style) => {
                        const active = style.id === earthWaveStyle
                        return (
                          <button
                            key={style.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setEarthWaveStyle(style.id)}
                            className={`min-h-[2.25rem] flex-1 rounded-lg border px-2 text-xs font-medium transition-colors ${
                              active
                                ? 'border-ice/60 bg-ice/20 text-parchment'
                                : 'border-transparent bg-transparent text-mist hover:text-parchment'
                            }`}
                          >
                            {t(style.labelKey)}
                          </button>
                        )
                      })}
                    </div>
                    <p className="mb-1 px-1 text-[0.68rem] leading-relaxed text-mist/80">
                      {t(waveStyle.hintKey)}
                    </p>
                    <SliderRow
                      label={t('planet.waveIntensity')}
                      value={earthWaveIntensity}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={setEarthWaveIntensity}
                      format={(value) => `${Math.round(value * 100)}%`}
                      hint={t('planet.waveIntensityHint')}
                    />
                    {/* Only the spectral sea has rings/arcs to scrunch, so this
                        slider is shown for that wave model alone. */}
                    {earthWaveStyle === 'spectral' ? (
                      <SliderRow
                        label={t('planet.swellDetail')}
                        value={earthSwellDetail}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={setEarthSwellDetail}
                        format={(value) => `${Math.round(value * 100)}%`}
                        hint={t('planet.swellDetailHint')}
                      />
                    ) : null}
                    {/* The sky reflection belongs to the water surface itself,
                        so it is shown for both wave models. */}
                    <SliderRow
                      label={t('planet.skyReflection')}
                      value={earthSkyReflection}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={setEarthSkyReflection}
                      format={(value) => `${Math.round(value * 100)}%`}
                      hint={t('planet.skyReflectionHint')}
                    />
                  </>
                ) : null}
                <SliderRow
                  label={t('planet.seafloorRelief')}
                  value={earthSeafloorRelief}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setEarthSeafloorRelief}
                  format={(value) => `${Math.round(value * 100)}%`}
                  hint={t('planet.seafloorReliefHint')}
                />
              </div>
            </div>
          ) : null}

          {body.id === 'earth' ? (
            <div className="mt-4">
              <SectionTitle hint={t('planet.cloudsHint')}>{t('planet.earthClouds')}</SectionTitle>
              <div className="rounded-xl border border-white/8 bg-white/4 p-1">
                <SliderRow
                  label={t('planet.cloudCoverage')}
                  value={earthCloudCoverage}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setEarthCloudCoverage}
                  format={(value) => `${Math.round(value * 100)}%`}
                  hint={t('planet.cloudCoverageHint')}
                />
                <SliderRow
                  label={t('planet.cloudOpacity')}
                  value={earthCloudOpacity}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setEarthCloudOpacity}
                  format={(value) => `${Math.round(value * 100)}%`}
                  hint={t('planet.cloudOpacityHint')}
                />
                <SliderRow
                  label={t('planet.cloudDynamics')}
                  value={earthCloudDynamics}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setEarthCloudDynamics}
                  format={(value) => `${Math.round(value * 100)}%`}
                  hint={t('planet.cloudDynamicsHint')}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-2">
            {body.diameterKm > 0 ? (
              <Stat label={t('planet.diameter')} value={f.kmExact(body.diameterKm)} />
            ) : null}
            {body.kind === 'belt' ? (
              <Stat
                label={t('planet.distanceFromSun')}
                value={t('planet.beltDistance')}
                hint={t('planet.beltDistanceHint')}
              />
            ) : (
              <Stat
                label={t('planet.distanceFromSun')}
                value={f.km(body.distanceFromSunKm)}
                hint={t('planet.average')}
              />
            )}
            {body.kind !== 'belt' ? (
              <Stat
                label={t('planet.lengthOfYear')}
                value={
                  body.kind === 'moon'
                    ? t('planet.moonYear')
                    : body.orbitalPeriodDays > 0
                      ? f.days(body.orbitalPeriodDays)
                      : '—'
                }
              />
            ) : (
              <Stat
                label={t('planet.orbitalPeriod')}
                value={t('planet.beltPeriod')}
                hint={t('planet.beltPeriodHint')}
              />
            )}
            {body.rotationPeriodHours !== 0 ? (
              <Stat label={t('planet.lengthOfDay')} value={f.rotation(body.rotationPeriodHours)} />
            ) : null}
            {body.kind === 'star' ? (
              <Stat
                label={t('planet.planets')}
                value={t('planet.planetsValue')}
                hint={t('planet.planetsHint')}
              />
            ) : null}
            {isWorld ? (
              <Stat
                label={t('planet.moons')}
                value={String(body.moons)}
                hint={t('planet.moonsHint')}
              />
            ) : null}
            {body.surfaceGravity > 0 ? (
              <Stat
                label={t('planet.surfaceGravity')}
                value={`${body.surfaceGravity.toFixed(2)} m/s²`}
                hint={t('planet.surfaceGravityHint')}
              />
            ) : null}
            <Stat label={t('planet.avgTemp')} value={f.temperature(body.temperatureC)} />
            {isWorld ? (
              <Stat
                label={t('planet.comparedEarth')}
                value={
                  body.massEarths >= 1
                    ? t('planet.massMore', { value: body.massEarths.toFixed(1) })
                    : t('planet.massLess', { value: (body.massEarths * 100).toFixed(1) })
                }
              />
            ) : null}
            {isWorld ? (
              <Stat
                label={t('planet.tilt')}
                value={`${body.axialTiltDeg.toFixed(1)}°`}
                hint={t('planet.tiltHint')}
              />
            ) : null}
          </div>

          {liveDistanceUnits > 0 ? (
            <p className="sse-numeric mt-2 text-[0.68rem] text-mist/80">
              {t('planet.liveDistance', { value: f.distanceUnits(liveDistanceUnits) })}
            </p>
          ) : null}

          <div className="mt-4">
            <SectionTitle hint={t('planet.coolFactsHint')}>{t('planet.coolFacts')}</SectionTitle>
            <ul className="space-y-1.5">
              {body.facts.map((fact) => (
                <li key={fact} className="flex gap-2 text-sm leading-relaxed text-parchment/90">
                  <span aria-hidden="true" style={{ color: accent }}>
                    ●
                  </span>
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="mt-4 rounded-xl border px-3 py-3"
            style={{ borderColor: `${accent}55`, background: `${accent}12` }}
          >
            <p className="sse-label-text" style={{ color: accent }}>
              {t('planet.didYouKnow')}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-parchment">{body.didYouKnow}</p>
          </div>

          {moons.length > 0 ? (
            <div className="mt-4">
              <SectionTitle hint={t('planet.moonsRendered')}>{t('planet.moonsYouCanSpot')}</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {moons.map((moon) => (
                  <Chip key={moon.id} tone="neutral">
                    {moon.name}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-1.5">
            <ToolbarButton icon={<RocketIcon />} compact onClick={() => focusBody(body.id, 'follow', 6)}>
              {t('planet.follow', { name: body.name })}
            </ToolbarButton>
            <ToolbarButton icon={<OrbitIcon />} compact onClick={resetView}>
              {t('planet.fullView')}
            </ToolbarButton>
            {body.id === 'earth' ? (
              <ToolbarButton compact variant="ghost" onClick={() => openEducation('moon-phases')}>
                {t('planet.moonPhases')}
              </ToolbarButton>
            ) : null}
            {body.id === 'sun' ? (
              <ToolbarButton
                compact
                variant="ghost"
                onClick={() => {
                  registerDiscovery('sun-student')
                  openEducation('sun')
                }}
              >
                {t('planet.howSunShines')}
              </ToolbarButton>
            ) : null}
          </div>

          <p className="mt-3 text-[0.66rem] leading-relaxed text-mist/75">
            {t('planet.footer')}
            {discoveries.length > 0 ? t('planet.discoveries', { count: discoveries.length }) : ''}
          </p>
        </CollapsibleSidePanel>
      ) : null}
    </AnimatePresence>
  )
}
