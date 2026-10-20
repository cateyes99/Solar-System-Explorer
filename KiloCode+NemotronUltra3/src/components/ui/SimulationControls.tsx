import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/simulationStore';
import { planetsData } from '../../data/planets';
import { scaleModeOptions } from '../../utils/scale';

export function SimulationControls() {
  const {
    scaleMode,
    setScaleMode,
    showLabels,
    setShowLabels,
    showOrbits,
    setShowOrbits,
    showStars,
    setShowStars,
    reducedMotion,
    setReducedMotion,
    soundEnabled,
    setSoundEnabled,
    viewMode,
    setViewMode,
    cinematicTourActive,
    setCinematicTourActive,
    spacecraftActive,
    setSpacecraftActive,
    welcomeMessage,
    setWelcomeMessage,
    setRandomFact,
  } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="glass-strong rounded-2xl p-4 shadow-2xl border border-white/10 w-64"
    >
      <h3 className="text-sm font-medium text-white/80 mb-4 flex items-center gap-2">
        <span>🎛️</span> Controls
      </h3>

      <div className="space-y-4">
        <ControlGroup title="Visual Scale" icon="📏">
          <div className="space-y-2">
            {scaleModeOptions.map(option => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="scale-mode"
                  value={option.value}
                  checked={scaleMode === option.value}
                  onChange={() => setScaleMode(option.value)}
                  className="w-4 h-4 accent-cyan-400"
                />
                <div>
                  <p className="text-white text-sm">{option.label}</p>
                  <p className="text-xs text-white/50">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </ControlGroup>

        <ControlGroup title="Display Options" icon="👁️">
          <div className="space-y-2">
            <Toggle
              label="Planet Labels"
              description="Show planet names"
              checked={showLabels}
              onChange={setShowLabels}
            />
            <Toggle
              label="Orbit Paths"
              description="Show orbital trajectories"
              checked={showOrbits}
              onChange={setShowOrbits}
            />
            <Toggle
              label="Star Field"
              description="Background stars"
              checked={showStars}
              onChange={setShowStars}
            />
          </div>
        </ControlGroup>

        <ControlGroup title="Accessibility" icon="♿">
          <div className="space-y-2">
            <Toggle
              label="Reduce Motion"
              description="Minimize animations"
              checked={reducedMotion}
              onChange={setReducedMotion}
            />
            <Toggle
              label="Sound Effects"
              description="Ambient & UI sounds"
              checked={soundEnabled}
              onChange={setSoundEnabled}
            />
          </div>
        </ControlGroup>

        <ControlGroup title="Quick Actions" icon="⚡">
          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              label="Tour"
              icon="🎬"
              active={cinematicTourActive}
              onClick={() => setCinematicTourActive(!cinematicTourActive)}
            />
            <ActionButton
              label="Mission"
              icon="🚀"
              active={spacecraftActive}
              onClick={() => setSpacecraftActive(!spacecraftActive)}
            />
            <ActionButton
              label="Learn"
              icon="📚"
              active={viewMode === 'learn'}
              onClick={() => setViewMode('learn')}
            />
            <ActionButton
              label="What If?"
              icon="🧪"
              active={viewMode === 'whatif'}
              onClick={() => setViewMode('whatif')}
            />
          </div>
        </ControlGroup>

        <button
          onClick={() => setRandomFact('Light from the Sun takes 8 minutes 20 seconds to reach Earth!')}
          className="btn-primary w-full justify-center gap-2"
        >
          <span>💡</span>
          <span>Teach Me Something!</span>
        </button>
      </div>
    </motion.div>
  );
}

function ControlGroup({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1">
        <span>{icon}</span> {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-cyan-400 rounded"
      />
      <div className="flex-1">
        <p className="text-white text-sm">{label}</p>
        <p className="text-xs text-white/50">{description}</p>
      </div>
    </label>
  );
}

function ActionButton({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg text-center transition-all duration-200 text-xs ${
        active
          ? 'bg-cyan-400/20 border border-cyan-400/30 text-cyan-300'
          : 'glass text-white/80 hover:text-white hover:bg-white/5'
      }`}
    >
      <p className="text-lg">{icon}</p>
      <p>{label}</p>
    </button>
  );
}