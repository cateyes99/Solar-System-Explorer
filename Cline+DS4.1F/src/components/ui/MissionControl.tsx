import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { localeFor, useTranslation } from '../../i18n'
import { useContent } from '../../i18n/content'
import { useSimulationStore } from '../../store/simulationStore'
import { useMissionReadout } from '../../hooks/useMissionReadout'
import { useFormatters } from '../../utils/format'
import { kmPerUnit } from '../../utils/scale'
import { Chip, DraggableSheet, IconButton, SectionTitle, Stat, ToggleRow, ToolbarButton } from './primitives'
import { QuestionIcon, RocketIcon } from './icons'

/**
 * Mission Control.
 *
 * Choose a destination and the autopilot flies the ship there; or switch the
 * autopilot off and fly it by hand — A/D turn left and right, R/F pitch the nose
 * up and down, W/S thrust forward and back along the nose, and Shift boosts.
 * Live telemetry comes from the flight model at 5 Hz.
 */
export function MissionControl() {
  const { t, language } = useTranslation()
  const content = useContent()
  const f = useFormatters()
  const missionActive = useSimulationStore((state) => state.missionActive)
  const endMission = useSimulationStore((state) => state.endMission)
  const destinationId = useSimulationStore((state) => state.destinationId)
  const setDestination = useSimulationStore((state) => state.setDestination)
  const autopilot = useSimulationStore((state) => state.autopilot)
  const setAutopilot = useSimulationStore((state) => state.setAutopilot)
  const chaseCamera = useSimulationStore((state) => state.chaseCamera)
  const setChaseCamera = useSimulationStore((state) => state.setChaseCamera)
  const chaseAutoFrame = useSimulationStore((state) => state.chaseAutoFrame)
  const setChaseAutoFrame = useSimulationStore((state) => state.setChaseAutoFrame)
  const toggleSpacecraftHelp = useSimulationStore((state) => state.toggleSpacecraftHelp)
  const showToast = useSimulationStore((state) => state.showToast)
  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const customScale = useSimulationStore((state) => state.customScale)
  const orbitModel = useSimulationStore((state) => state.orbitModel)
  const readout = useMissionReadout()

  // Opacity is per-panel: fading Mission Control leaves every other popup alone.
  const [opacity, setOpacity] = useState(1)

  const destinations = content.destinations
  const destination = destinations.find((entry) => entry.id === destinationId)
  const statusLabel =
    readout.status === 'arrived'
      ? t('mission.status.arrived')
      : readout.status === 'cruising'
        ? t('mission.status.cruising')
        : t('mission.status.idle')
  const kilometresPerUnit = kmPerUnit(scaleMode, customScale, orbitModel)

  return (
    <AnimatePresence>
      {missionActive ? (
        <DraggableSheet
          position="bottom"
          label={t('mission.label')}
          opacity={opacity}
          onOpacityChange={setOpacity}
          header={
            <div className="flex items-center gap-2 text-ice">
              <RocketIcon size={20} />
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em]">{t('mission.title')}</h2>
            </div>
          }
          headerActions={
            <>
              <Chip tone={readout.status === 'arrived' ? 'ice' : 'neutral'}>{statusLabel}</Chip>
              <IconButton
                label={t('mission.controlsHelp')}
                icon={<QuestionIcon />}
                onClick={() => toggleSpacecraftHelp(true)}
              />
            </>
          }
        >
          <div className="mt-1 grid grid-cols-2 gap-2">
            <Stat
              label={t('mission.speed')}
              value={`${f.distanceUnits(readout.speed)}/s`}
              hint={t('mission.speedHint', {
                value: Math.round(readout.speedKmPerSecond).toLocaleString(localeFor(language)),
              })}
            />
            <Stat
              label={t('mission.distanceFromSun')}
              value={f.km(readout.distanceFromSun * kilometresPerUnit)}
              hint={t('mission.distanceHint')}
            />
            <Stat
              label={t('mission.destination')}
              value={destination ? destination.name : '—'}
              hint={
                readout.distanceToDestinationKm > 0
                  ? t('mission.toGo', { value: f.km(readout.distanceToDestinationKm) })
                  : t('mission.arrived')
              }
            />
            <Stat
              label={t('mission.pilot')}
              value={autopilot ? t('mission.autopilot') : t('mission.you')}
              hint={autopilot ? t('mission.handsOff') : t('mission.useKeys')}
            />
          </div>

          <div className="mt-3">
            <SectionTitle hint={t('mission.chooseHint')}>{t('mission.chooseDestination')}</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {destinations.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={destinationId === entry.id}
                  onClick={() => {
                    setDestination(entry.id)
                    setAutopilot(true)
                    showToast(t('mission.courseSet', { name: entry.name, fact: entry.funFact }), 'info')
                  }}
                  className={`min-h-[2.5rem] rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    destinationId === entry.id
                      ? 'border-ice/60 bg-ice/20 text-parchment'
                      : 'border-white/12 bg-white/4 text-mist hover:text-parchment'
                  }`}
                >
                  {entry.name}
                </button>
              ))}
            </div>
            {destination ? (
              <p className="mt-2 text-xs leading-relaxed text-mist/90">
                {destination.description}
                {destination.lightMinutesFromEarth > 0
                  ? t('mission.radioDelay', { minutes: destination.lightMinutesFromEarth })
                  : ''}
              </p>
            ) : null}
          </div>

          <div className="mt-2">
            <ToggleRow
              label={t('mission.autopilotLabel')}
              description={t('mission.autopilotDesc')}
              checked={autopilot}
              onChange={() => setAutopilot(!autopilot)}
            />
            <ToggleRow
              label={t('mission.chaseCamera')}
              description={t('mission.chaseCameraDesc')}
              checked={chaseCamera}
              onChange={() => setChaseCamera(!chaseCamera)}
            />
            {/* Only meaningful while the chase camera is on, so it appears with it. */}
            {chaseCamera ? (
              <ToggleRow
                label={t('mission.chaseAutoFrame')}
                description={t('mission.chaseAutoFrameDesc')}
                checked={chaseAutoFrame}
                onChange={() => setChaseAutoFrame(!chaseAutoFrame)}
              />
            ) : null}
          </div>

          <p className="mt-2 text-[0.68rem] leading-relaxed text-mist/80">{t('mission.manual')}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <ToolbarButton
              compact
              variant="ghost"
              onClick={() => {
                setDestination('earth')
                setAutopilot(true)
              }}
            >
              {t('mission.headHome')}
            </ToolbarButton>
            <ToolbarButton compact variant="danger" onClick={endMission}>
              {t('mission.end')}
            </ToolbarButton>
          </div>
        </DraggableSheet>
      ) : null}
    </AnimatePresence>
  )
}
