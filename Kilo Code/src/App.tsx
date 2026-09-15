import { useEffect, useCallback } from 'react';
import { SolarSystemCanvas } from './components/3d/SolarSystem';
import { Header } from './components/ui/Header';
import { PlanetPanel } from './components/ui/PlanetPanel';
import { TimeControls } from './components/ui/TimeControls';
import { SimulationControls } from './components/ui/SimulationControls';
import { MissionControl } from './components/ui/MissionControl';
import { TourControls } from './components/ui/TourControls';
import { Tooltip } from './components/ui/Tooltip';
import { SettingsPanel } from './components/ui/SettingsPanel';
import { WelcomeMessage } from './components/ui/WelcomeMessage';
import { RandomFactCard } from './components/ui/RandomFactCard';
import { useAppStore } from './store/simulationStore';
import './index.css';

function KeyboardControls() {
  const {
    togglePause,
    setSimulationSpeed,
    simulationSpeed,
    setScaleMode,
    scaleMode,
    setShowLabels,
    showLabels,
    setShowOrbits,
    showOrbits,
    setReducedMotion,
    reducedMotion,
    setSoundEnabled,
    soundEnabled,
    setViewMode,
    viewMode,
    setCinematicTourActive,
    cinematicTourActive,
    setWelcomeMessage,
    welcomeMessage,
    setRandomFact,
    selectedPlanetId,
  } = useAppStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePause();
        break;
      case 'KeyR':
        setSimulationSpeed(simulationSpeed === 0 ? 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSimulationSpeed(Math.min(10000, simulationSpeed * 2));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSimulationSpeed(Math.max(0, simulationSpeed / 2));
        break;
      case 'Digit1':
        setScaleMode('educational');
        break;
      case 'Digit2':
        setScaleMode('relative-size');
        break;
      case 'Digit3':
        setScaleMode('distances');
        break;
      case 'KeyL':
        setShowLabels(!showLabels);
        break;
      case 'KeyO':
        setShowOrbits(!showOrbits);
        break;
      case 'KeyM':
        setReducedMotion(!reducedMotion);
        break;
      case 'KeyS':
        setSoundEnabled(!soundEnabled);
        break;
      case 'KeyE':
        setViewMode('explore');
        break;
      case 'KeyT':
        setViewMode('learn');
        break;
      case 'KeyC':
        setCinematicTourActive(!cinematicTourActive);
        break;
      case 'KeyW':
        setWelcomeMessage(!welcomeMessage);
        break;
      case 'KeyF':
        setRandomFact('A day on Venus is longer than a year on Venus!');
        break;
      case 'Escape':
        if (selectedPlanetId) {
          useAppStore.getState().setSelectedPlanet(null);
        }
        break;
    }
  }, [
    togglePause,
    simulationSpeed,
    setSimulationSpeed,
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
    viewMode,
    setViewMode,
    cinematicTourActive,
    setCinematicTourActive,
    welcomeMessage,
    setWelcomeMessage,
    setRandomFact,
    selectedPlanetId,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return null;
}

export function App() {
  const { loading, loadingProgress, error, welcomeMessage } = useAppStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      useAppStore.getState().setLoading(false);
      useAppStore.getState().setLoadingProgress(100);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-space">
      <KeyboardControls />
      
      <SolarSystemCanvas />
      
      <div className="absolute inset-0 pointer-events-none">
        <Header />
        
        <div className="absolute bottom-4 left-4 right-4 md:left-6 md:right-6 md:bottom-6 pointer-events-auto">
          <TimeControls />
        </div>
        
        <div className="absolute top-20 right-4 md:top-24 md:right-6 pointer-events-auto">
          <SimulationControls />
        </div>
        
        <Tooltip />
      </div>
      
      <PlanetPanel />
      <MissionControl />
      <TourControls />
      <SettingsPanel />
      <WelcomeMessage />
      <RandomFactCard />
    </div>
  );
}

export default App;