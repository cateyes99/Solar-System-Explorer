import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/simulationStore';
import { scaleModeOptions } from '../../utils/scale';

export function SettingsPanel() {
  const {
    settingsPanelOpen,
    setSettingsPanelOpen,
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
    welcomeMessage,
    setWelcomeMessage,
    setRandomFact,
  } = useAppStore();

  if (!settingsPanelOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-strong rounded-2xl p-6 md:p-8 shadow-2xl border border-white/10 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>⚙️</span> Settings
            </h2>
            <button
              onClick={() => setSettingsPanelOpen(false)}
              className="glass p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              aria-label="Close settings"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            <SettingsSection title="Visual Scale" icon="📏">
              <p className="text-white/60 text-sm mb-3">Choose how planets and distances are displayed</p>
              <div className="space-y-2">
                {scaleModeOptions.map(option => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all ${
                    scaleMode === option.value
                      ? 'bg-cyan-400/10 border border-cyan-400/20'
                      : 'glass hover:bg-white/5'
                  }">
                    <input
                      type="radio"
                      name="scale-mode"
                      value={option.value}
                      checked={scaleMode === option.value}
                      onChange={() => setScaleMode(option.value)}
                      className="w-4 h-4 accent-cyan-400"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">{option.label}</p>
                      <p className="text-xs text-white/50">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </SettingsSection>

            <SettingsSection title="Display Options" icon="👁️">
              <div className="space-y-3">
                <SettingToggle
                  label="Planet Labels"
                  description="Show planet names above planets"
                  checked={showLabels}
                  onChange={setShowLabels}
                />
                <SettingToggle
                  label="Orbit Paths"
                  description="Display orbital trajectories"
                  checked={showOrbits}
                  onChange={setShowOrbits}
                />
                <SettingToggle
                  label="Star Field"
                  description="Show background stars and nebulae"
                  checked={showStars}
                  onChange={setShowStars}
                />
              </div>
            </SettingsSection>

            <SettingsSection title="Accessibility" icon="♿">
              <div className="space-y-3">
                <SettingToggle
                  label="Reduce Motion"
                  description="Minimize camera animations and automatic movement"
                  checked={reducedMotion}
                  onChange={setReducedMotion}
                />
                <SettingToggle
                  label="Sound Effects"
                  description="Enable ambient space audio and UI sounds"
                  checked={soundEnabled}
                  onChange={setSoundEnabled}
                />
                <SettingToggle
                  label="Welcome Message"
                  description="Show introduction on first visit"
                  checked={welcomeMessage}
                  onChange={setWelcomeMessage}
                />
              </div>
            </SettingsSection>

            <SettingsSection title="About" icon="ℹ️">
              <div className="space-y-3 text-white/70 text-sm">
                <p>Solar System Explorer - An interactive educational experience</p>
                <p>Built with React, Three.js, React Three Fiber, and TypeScript</p>
                <p className="text-xs text-white/50">Not to scale - Educational visualization</p>
              </div>
            </SettingsSection>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SettingsSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}

function SettingToggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer p-3 rounded-xl glass hover:bg-white/5 transition-all">
      <div>
        <p className="text-white text-sm">{label}</p>
        <p className="text-xs text-white/50">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-all ${
          checked ? 'bg-cyan-400' : 'bg-white/10'
        }`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-full' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}