import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/simulationStore';
import { planetsData } from '../../data/planets';
import { formatDistance, formatNumber } from '../../utils/astronomy';

export function MissionControl() {
  const {
    spacecraftActive,
    setSpacecraftActive,
    spacecraftPosition,
    spacecraftVelocity,
    setSpacecraftTarget,
    spacecraftTarget,
    simulationSpeed,
    scaleMode,
  } = useAppStore();

  const targetPlanet = spacecraftTarget ? planetsData.find(p => p.id === spacecraftTarget) : null;
  const distanceFromSun = spacecraftPosition.length();
  
  const getSpeed = () => {
    return Math.sqrt(
      spacecraftVelocity.x ** 2 + 
      spacecraftVelocity.y ** 2 + 
      spacecraftVelocity.z ** 2
    );
  };

  if (!spacecraftActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300, y: -20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: 300, y: -20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-20 left-4 md:top-24 md:left-6 w-full max-w-sm z-40 pointer-events-auto"
      >
        <div className="glass-strong rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚀</span>
              <h3 className="font-bold text-white">Mission Control</h3>
            </div>
            <button
              onClick={() => setSpacecraftActive(false)}
              className="glass p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              aria-label="Exit mission"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <MissionStat label="Speed" value={`${getSpeed().toFixed(1)} km/s`} icon="⚡" />
              <MissionStat label="Distance" value={formatDistance(distanceFromSun * 1e6)} icon="📍" />
              <MissionStat label="Sim Speed" value={`${simulationSpeed.toFixed(0)}×`} icon="⏱️" />
            </div>

            <div className="pt-4 border-t border-white/10">
              <h4 className="text-sm font-medium text-white/80 mb-3">Select Destination</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {planetsData.filter(p => p.id !== 'sun').map(planet => (
                  <button
                    key={planet.id}
                    onClick={() => setSpacecraftTarget(planet.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                      spacecraftTarget === planet.id
                        ? 'bg-cyan-400/20 border border-cyan-400/30'
                        : 'glass hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xl">
                      {planet.id === 'earth' ? '🌍' : planet.id === 'mars' ? '🔴' : planet.id === 'jupiter' ? '🪐' : planet.id === 'saturn' ? '💍' : '🪨'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{planet.name}</p>
                      <p className="text-xs text-white/50">{formatDistance(planet.distanceFromSunKm)} from Sun</p>
                    </div>
                    {spacecraftTarget === planet.id && (
                      <span className="text-cyan-400 text-sm">→</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {targetPlanet && (
              <div className="pt-4 border-t border-white/10 glass rounded-xl p-3">
                <p className="text-white/70 text-sm">
                  Navigating to <strong className="text-white">{targetPlanet.name}</strong>...
                </p>
                <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: '65%' }}
                  />
                </div>
                <p className="text-xs text-white/50 mt-1">Approach trajectory calculated</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSpacecraftTarget(null)}
                className="btn-secondary flex-1"
                disabled={!spacecraftTarget}
              >
                Clear Target
              </button>
              <button className="btn-primary flex-1">
                Engage Warp
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function MissionStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <p className="text-lg">{icon}</p>
      <p className="text-white font-mono text-sm">{value}</p>
      <p className="text-xs text-white/50">{label}</p>
    </div>
  );
}