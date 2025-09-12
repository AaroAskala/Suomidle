import { useEffect } from 'react';
import { HUD } from './components/HUD';
import { BuildingsGrid } from './components/BuildingsGrid';
import { TechGrid } from './components/TechGrid';
import { Prestige } from './components/Prestige';
import { PrestigeCard } from './components/PrestigeCard';
import { startGameLoop, stopGameLoop } from './app/gameLoop';
import { useGameStore } from './app/store';
import './App.css';
import { playTierMusic } from './audio/music';

function App() {
  const tierLevel = useGameStore((s) => s.tierLevel);
  useEffect(() => {
    startGameLoop();
    return () => {
      stopGameLoop();
    };
  }, []);
  useEffect(() => {
    useGameStore.getState().recompute();
  }, []);
  useEffect(() => {
    const body = document.body;
    body.style.backgroundImage = `url(${import.meta.env.BASE_URL}assets/backgrounds/tier${tierLevel}.svg)`;
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = 'center';
    body.style.backgroundRepeat = 'no-repeat';
    return () => {
      body.style.backgroundImage = '';
    };
  }, [tierLevel]);
  useEffect(() => {
    playTierMusic(tierLevel);
  }, [tierLevel]);
  return (
    <>
      <HUD />
      <PrestigeCard />
      <BuildingsGrid />
      <TechGrid />
      <Prestige />
    </>
  );
}

export default App;
