import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/simulationStore';

const randomFacts = [
  { fact: 'A day on Venus is longer than a year on Venus!', category: 'Venus' },
  { fact: 'Jupiter is so big that more than 1,300 Earths could fit inside it.', category: 'Jupiter' },
  { fact: 'Saturn\'s rings are mostly made of ice and rock, ranging from tiny grains to house-sized chunks.', category: 'Saturn' },
  { fact: 'Light from the Sun takes about 8 minutes 20 seconds to reach Earth.', category: 'Sun' },
  { fact: 'A neutron star is so dense that a teaspoon would weigh about 6 billion tons.', category: 'Stars' },
  { fact: 'There are more stars in the universe than grains of sand on all Earth\'s beaches.', category: 'Universe' },
  { fact: 'The footprints on the Moon will last for millions of years because there\'s no wind to erase them.', category: 'Moon' },
  { fact: 'Olympus Mons on Mars is the tallest volcano in the Solar System — 3 times taller than Mount Everest.', category: 'Mars' },
  { fact: 'Uranus spins on its side, so each pole gets 42 years of sunlight followed by 42 years of darkness.', category: 'Uranus' },
  { fact: 'Neptune has the fastest winds in the Solar System — up to 2,100 km/h!', category: 'Neptune' },
  { fact: 'The Sun accounts for 99.86% of all mass in the Solar System.', category: 'Sun' },
  { fact: 'Mercury has no atmosphere, so its temperature swings from -173°C to 427°C.', category: 'Mercury' },
  { fact: 'Earth is the only planet not named after a Roman god.', category: 'Earth' },
  { fact: 'Jupiter\'s Great Red Spot is a storm that has been raging for at least 350 years.', category: 'Jupiter' },
  { fact: 'Titan, Saturn\'s largest moon, has lakes and rivers of liquid methane.', category: 'Saturn' },
  { fact: 'Pluto was reclassified as a dwarf planet in 2006 because it hasn\'t cleared its orbit.', category: 'Dwarf Planets' },
  { fact: 'The Solar System is about 4.6 billion years old.', category: 'Solar System' },
  { fact: 'Voyager 1 is the most distant human-made object, now in interstellar space.', category: 'Space Exploration' },
  { fact: 'A year on Neptune is 165 Earth years long.', category: 'Neptune' },
  { fact: 'The asteroid belt between Mars and Jupiter contains millions of rocky objects.', category: 'Asteroids' },
];

export function RandomFactCard() {
  const { randomFact, setRandomFact } = useAppStore();

  if (!randomFact) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 pointer-events-auto"
      >
        <div className="glass-strong rounded-2xl p-5 md:p-6 shadow-2xl border border-white/10 max-w-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                <span className="text-lg">💡</span>
              </div>
              <h3 className="font-bold text-white">Did You Know?</h3>
            </div>
            <button
              onClick={() => setRandomFact(null)}
              className="glass p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              aria-label="Dismiss fact"
            >
              ✕
            </button>
          </div>
          
          <p className="text-white/90 text-sm leading-relaxed mb-4">{randomFact}</p>
          
          <button
            onClick={() => setRandomFact(randomFacts[Math.floor(Math.random() * randomFacts.length)].fact)}
            className="btn-primary w-full justify-center gap-2"
          >
            <span>🔄</span>
            <span>Another Fact!</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}