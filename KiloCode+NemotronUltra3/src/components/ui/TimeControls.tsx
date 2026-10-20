import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/simulationStore';
import { getSpeedLabel } from '../../utils/astronomy';

export function TimeControls() {
  const {
    simulationSpeed,
    setSimulationSpeed,
    isPaused,
    setPaused,
    togglePause,
    simulationDate,
    scaleMode,
  } = useAppStore();

  const speeds = [
    { value: 0, label: 'Paused' },
    { value: 0.5, label: '½×' },
    { value: 1, label: '1×' },
    { value: 2, label: '2×' },
    { value: 10, label: '10×' },
    { value: 50, label: '50×' },
    { value: 100, label: '100×' },
    { value: 365, label: '1 Year/s' },
    { value: 3650, label: '10 Years/s' },
    { value: 36500, label: '100 Years/s' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-strong rounded-2xl p-4 md:p-6 shadow-2xl border border-white/10"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={togglePause}
            className={`btn-primary flex items-center gap-2 px-4 py-2 ${
              isPaused ? 'bg-green-500/20 border-green-500/30' : ''
            }`}
            aria-label={isPaused ? 'Play simulation' : 'Pause simulation'}
          >
            <span className="text-lg">{isPaused ? '▶️' : '⏸️'}</span>
            <span className="hidden sm:inline">{isPaused ? 'Play' : 'Pause'}</span>
          </button>

          <div className="flex items-center gap-2 glass rounded-lg px-3 py-1.5">
            <span className="text-xs text-white/60">Speed:</span>
            <select
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(Number(e.target.value))}
              className="bg-transparent border-none text-white text-sm focus:outline-none appearance-none cursor-pointer"
              aria-label="Simulation speed"
            >
              {speeds.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 glass rounded-lg px-3 py-1.5">
            <span className="text-xs text-white/60">{getSpeedLabel(simulationSpeed)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="glass rounded-lg px-3 py-2">
            <p className="text-xs text-white/50 uppercase tracking-wider">Simulated Date</p>
            <p className="text-white font-mono text-sm">
              {simulationDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 glass rounded-lg px-3 py-2">
            <span className="text-xs text-white/50 uppercase tracking-wider">Scale:</span>
            <span className="text-white text-sm capitalize">{scaleMode.replace('-', ' ')}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <label htmlFor="time-slider" className="text-xs text-white/60">Time Scale</label>
          <span className="text-xs text-white/70 ml-auto">
            {simulationSpeed === 0 ? 'Paused' : `${simulationSpeed.toFixed(1)}×`}
          </span>
        </div>
        <input
          id="time-slider"
          type="range"
          min="0"
          max="10000"
          step="1"
          value={simulationSpeed}
          onChange={(e) => setSimulationSpeed(Number(e.target.value))}
          className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400"
          aria-label="Simulation time speed"
        />
      </div>
    </motion.div>
  );
}