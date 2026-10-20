import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/simulationStore';
import { scaleModeOptions } from '../../utils/scale';

export function Header() {
  const {
    viewMode,
    setViewMode,
    scaleMode,
    setScaleMode,
    showLabels,
    setShowLabels,
    showOrbits,
    setShowOrbits,
    reducedMotion,
    setReducedMotion,
    soundEnabled,
    setSoundEnabled,
    cinematicTourActive,
    setCinematicTourActive,
    spacecraftActive,
    setSpacecraftActive,
    settingsPanelOpen,
    setSettingsPanelOpen,
    welcomeMessage,
    setWelcomeMessage,
    setRandomFact,
  } = useAppStore();

  const modes = [
    { id: 'explore', label: 'Explore', icon: '🔭', description: 'Free exploration' },
    { id: 'learn', label: 'Learn', icon: '📚', description: 'Guided lessons' },
    { id: 'cinematic', label: 'Tour', icon: '🎬', description: 'Cinematic tour' },
    { id: 'whatif', label: 'What If?', icon: '🧪', description: 'Simulations' },
    { id: 'spacecraft', label: 'Mission', icon: '🚀', description: 'Spacecraft mode' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="absolute top-4 left-4 right-4 md:left-6 md:right-6 md:top-6 pointer-events-auto z-40"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 glass-strong rounded-xl px-4 py-2">
          <span className="text-2xl">☀️</span>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Solar System Explorer</h1>
            <p className="text-xs text-white/60">An interactive journey through our cosmic neighborhood</p>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-1 glass rounded-lg p-1">
            {modes.map(mode => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                  viewMode === mode.id
                    ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
                title={mode.description}
              >
                <span>{mode.icon}</span>
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 glass rounded-lg p-1 hidden sm:flex">
            {scaleModeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setScaleMode(option.value)}
                className={`px-2.5 py-1 rounded text-xs transition-all duration-200 ${
                  scaleMode === option.value
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 glass rounded-lg p-1">
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`p-2 rounded transition-all duration-200 ${
                showLabels ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              title="Toggle planet labels"
              aria-label="Toggle planet labels"
            >
              🏷️
            </button>
            <button
              onClick={() => setShowOrbits(!showOrbits)}
              className={`p-2 rounded transition-all duration-200 ${
                showOrbits ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              title="Toggle orbit paths"
              aria-label="Toggle orbit paths"
            >
              🔄
            </button>
            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              className={`p-2 rounded transition-all duration-200 ${
                reducedMotion ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              title={reducedMotion ? 'Enable animations' : 'Reduce motion'}
              aria-label={reducedMotion ? 'Enable animations' : 'Reduce motion'}
            >
              {reducedMotion ? '▶️' : '⏸️'}
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded transition-all duration-200 ${
                soundEnabled ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              title={soundEnabled ? 'Mute' : 'Enable sound'}
              aria-label={soundEnabled ? 'Mute' : 'Enable sound'}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
          </div>

          <button
            onClick={() => setSettingsPanelOpen(!settingsPanelOpen)}
            className="glass p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
            title="Settings"
            aria-label="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>
    </motion.div>
  );
}