import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/simulationStore';
import { getPlanetById } from '../../data/planets';

export function Tooltip() {
  const { hoveredPlanetId } = useAppStore();
  const planet = hoveredPlanetId ? getPlanetById(hoveredPlanetId) : null;

  if (!planet) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed z-50 pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -120%)',
        }}
      >
        <div className="glass-strong rounded-xl px-3 py-2 shadow-xl border border-white/10 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {planet.id === 'sun' ? '☀️' : planet.id === 'earth' ? '🌍' : planet.id === 'mars' ? '🔴' : planet.id === 'jupiter' ? '🪐' : planet.id === 'saturn' ? '💍' : '🪨'}
            </span>
            <span className="font-medium text-white">{planet.name}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}