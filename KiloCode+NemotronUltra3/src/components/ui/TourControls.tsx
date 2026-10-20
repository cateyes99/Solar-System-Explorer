import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/simulationStore';

const tourSteps = [
  { id: 'overview', title: 'Solar System Overview', description: 'Welcome to our cosmic neighborhood. Eight planets orbit our Sun.', target: [0, 100, 400], lookAt: [0, 0, 0], duration: 4 },
  { id: 'sun', title: 'The Sun', description: 'Our star contains 99.86% of the Solar System\'s mass. Nuclear fusion in its core powers everything.', target: [0, 10, 25], lookAt: [0, 0, 0], duration: 5 },
  { id: 'mercury', title: 'Mercury', description: 'Closest to the Sun. No atmosphere, extreme temperatures, and a year of just 88 days.', target: [30, 5, 15], lookAt: [25, 0, 10], duration: 3 },
  { id: 'venus', title: 'Venus', description: 'Earth\'s toxic twin. Runaway greenhouse effect makes it the hottest planet.', target: [45, 5, 10], lookAt: [40, 0, 5], duration: 3 },
  { id: 'earth', title: 'Earth', description: 'Our home. The only known world with life, liquid water, and a protective atmosphere.', target: [60, 10, 10], lookAt: [55, 0, 5], duration: 4 },
  { id: 'moon', title: 'The Moon', description: 'Earth\'s companion. Causes tides, stabilizes our axis, and is the only other world humans have visited.', target: [65, 8, 12], lookAt: [60, 0, 5], duration: 3 },
  { id: 'mars', title: 'Mars', description: 'The Red Planet. Once had water, has the tallest volcano, and is our next target for exploration.', target: [85, 10, 10], lookAt: [80, 0, 5], duration: 4 },
  { id: 'jupiter', title: 'Jupiter', description: 'King of planets. A gas giant with a centuries-old storm and 95 moons.', target: [150, 20, 30], lookAt: [140, 0, 10], duration: 5 },
  { id: 'saturn', title: 'Saturn', description: 'The jewel of the Solar System. Magnificent rings made of ice and rock.', target: [280, 30, 50], lookAt: [260, 0, 20], duration: 5 },
  { id: 'uranus', title: 'Uranus', description: 'The sideways planet. Rolls on its side with extreme 42-year seasons.', target: [500, 20, 50], lookAt: [480, 0, 20], duration: 4 },
  { id: 'neptune', title: 'Neptune', description: 'The windiest world. Supersonic winds and a beautiful deep blue color.', target: [750, 15, 50], lookAt: [720, 0, 20], duration: 4 },
  { id: 'finale', title: 'The Complete System', description: 'All planets in their orbital dance. A fragile, beautiful system we call home.', target: [0, 200, 600], lookAt: [0, 0, 0], duration: 5 },
];

export function TourControls() {
  const {
    cinematicTourActive,
    setCinematicTourActive,
    cinematicTourStep,
    setCinematicTourStep,
    cinematicTourProgress,
    setCinematicTourProgress,
    setCameraMode,
    isPaused,
    setPaused,
  } = useAppStore();

  const currentStep = tourSteps[cinematicTourStep];

  if (!cinematicTourActive) return null;

  const handleNext = () => {
    if (cinematicTourStep < tourSteps.length - 1) {
      setCinematicTourStep(cinematicTourStep + 1);
      setCinematicTourProgress(0);
    } else {
      setCinematicTourActive(false);
      setCameraMode('solar-system');
    }
  };

  const handlePrev = () => {
    if (cinematicTourStep > 0) {
      setCinematicTourStep(cinematicTourStep - 1);
      setCinematicTourProgress(0);
    }
  };

  const handleSkip = () => {
    setCinematicTourActive(false);
    setCameraMode('solar-system');
  };

  const handlePauseResume = () => {
    setPaused(!isPaused);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
      >
        <div className="glass-strong rounded-2xl p-4 md:p-6 shadow-2xl border border-white/10 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                <span className="text-lg">🎬</span>
              </div>
              <div>
                <h3 className="font-bold text-white">Cinematic Tour</h3>
                <p className="text-xs text-white/60">Step {cinematicTourStep + 1} of {tourSteps.length}</p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="glass p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              aria-label="Exit tour"
            >
              ✕
            </button>
          </div>

          {currentStep && (
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h4 className="text-lg font-medium text-white mb-1">{currentStep.title}</h4>
              <p className="text-white/70 text-sm mb-4">{currentStep.description}</p>
            </motion.div>
          )}

          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
              animate={{ width: `${((cinematicTourStep + cinematicTourProgress) / tourSteps.length) * 100}%` }}
              transition={{ duration: 1000, ease: 'linear' }}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrev}
              disabled={cinematicTourStep === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              onClick={handlePauseResume}
              className="btn-primary flex-1 justify-center"
            >
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>

            <button
              onClick={handleNext}
              className="btn-primary"
            >
              {cinematicTourStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}