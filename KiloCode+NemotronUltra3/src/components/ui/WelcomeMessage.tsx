import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/simulationStore';

export function WelcomeMessage() {
  const { welcomeMessage, setWelcomeMessage } = useAppStore();

  if (!welcomeMessage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/80" onClick={() => setWelcomeMessage(false)} />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative z-10 glass-strong rounded-2xl p-8 md:p-12 shadow-2xl border border-white/10 max-w-2xl mx-4 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-4xl animate-pulse">
            ☀️
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Welcome to the Solar System</h1>
          
          <p className="text-white/80 text-lg mb-6 leading-relaxed">
            Explore our cosmic neighborhood in an interactive 3D experience. 
            Visit planets, learn amazing facts, and fly through space!
          </p>

          <div className="space-y-3 mb-8 p-4 glass rounded-xl">
            <p className="text-white/70 text-sm"><kbd className="px-2 py-0.5 bg-white/10 rounded text-xs">Drag</kbd> to rotate the view</p>
            <p className="text-white/70 text-sm"><kbd className="px-2 py-0.5 bg-white/10 rounded text-xs">Scroll</kbd> to zoom in/out</p>
            <p className="text-white/70 text-sm"><kbd className="px-2 py-0.5 bg-white/10 rounded text-xs">Click</kbd> a planet to learn about it</p>
            <p className="text-white/70 text-sm"><kbd className="px-2 py-0.5 bg-white/10 rounded text-xs">Space</kbd> to pause/resume time</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => { setWelcomeMessage(false); useAppStore.getState().setViewMode('learn'); }}
              className="btn-primary px-6 py-3 text-base"
            >
              📚 Start Learning
            </button>
            <button
              onClick={() => { setWelcomeMessage(false); useAppStore.getState().setCinematicTourActive(true); }}
              className="btn-secondary px-6 py-3 text-base"
            >
              🎬 Take a Tour
            </button>
            <button
              onClick={() => setWelcomeMessage(false)}
              className="btn-secondary px-6 py-3 text-base"
            >
              🔭 Explore Freely
            </button>
          </div>

          <button
            onClick={() => setWelcomeMessage(false)}
            className="mt-6 text-white/50 hover:text-white/70 text-sm transition-colors"
          >
            Don't show this again
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}