import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/simulationStore';
import { getPlanetById } from '../../data/planets';
import { formatDistance, formatNumber } from '../../utils/astronomy';

export function PlanetPanel() {
  const { selectedPlanetId, setSelectedPlanet, planetPanelOpen, scaleMode } = useAppStore();
  const planet = selectedPlanetId ? getPlanetById(selectedPlanetId) : null;

  useEffect(() => {
    if (selectedPlanetId) {
      useAppStore.getState().setPlanetPanelOpen(true);
    }
  }, [selectedPlanetId]);

  if (!planet || !planetPanelOpen) return null;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'star': return '⭐ Star';
      case 'terrestrial': return '🪨 Terrestrial Planet';
      case 'gas-giant': return '☁️ Gas Giant';
      case 'ice-giant': return '🧊 Ice Giant';
      case 'dwarf': return '🌑 Dwarf Planet';
      default: return type;
    }
  };

  const getTemperature = (c: number) => {
    const f = c * 9/5 + 32;
    return `${c}°C / ${f}°F`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-20 right-4 md:top-24 md:right-6 w-full max-w-sm md:max-w-md z-40 pointer-events-auto"
      >
        <div className="glass-strong rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          <div className="flex items-start justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl">
                {planet.id === 'sun' ? '☀️' : planet.id === 'earth' ? '🌍' : planet.id === 'mars' ? '🔴' : planet.id === 'jupiter' ? '🪐' : planet.id === 'saturn' ? '💍' : '🪨'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{planet.name}</h2>
                <span className="badge">{getTypeLabel(planet.type)}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedPlanet(null)}
              className="glass p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Diameter" value={`${formatNumber(planet.diameterKm)} km`} />
              <StatCard label="Distance from Sun" value={formatDistance(planet.distanceFromSunKm)} />
              <StatCard label="Year Length" value={`${planet.orbitalPeriodDays.toFixed(planet.orbitalPeriodDays < 100 ? 1 : 0)} Earth days`} />
              <StatCard label="Day Length" value={`${planet.rotationPeriodHours.toFixed(1)} hours`} />
              <StatCard label="Moons" value={planet.moons.toString()} />
              <StatCard label="Avg Temperature" value={getTemperature(planet.temperatureC)} />
              <StatCard label="Axial Tilt" value={`${planet.axialTiltDeg}°`} />
              <StatCard label="Orbital Speed" value={`${planet.orbitalSpeed.toFixed(1)} km/s`} />
            </div>

            <div className="pt-4 border-t border-white/10">
              <h3 className="text-sm font-medium text-white/80 mb-2">About {planet.name}</h3>
              <p className="text-white/70 text-sm leading-relaxed">{planet.description}</p>
            </div>

            {planet.facts.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-sm font-medium text-white/80 mb-2">Did You Know?</h3>
                <ul className="space-y-2">
                  {planet.facts.map((fact, i) => (
                    <li key={i} className="text-white/70 text-sm leading-relaxed flex items-start gap-2">
                      <span className="text-cyan-400 mt-0.5">✦</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 border-t border-white/10 flex gap-2">
              <button
                onClick={() => useAppStore.getState().setCameraMode('planet')}
                className="btn-primary flex-1 text-center"
              >
                Focus View
              </button>
              <button
                onClick={() => useAppStore.getState().setCameraMode('follow')}
                className="btn-secondary flex-1 text-center"
              >
                Follow
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <p className="text-xs text-white/50 uppercase tracking-wider">{label}</p>
      <p className="text-white font-mono text-sm mt-1">{value}</p>
    </div>
  );
}