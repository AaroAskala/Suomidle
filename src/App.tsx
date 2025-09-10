import { useEffect } from 'react';
import { HUD } from './components/HUD';
import { BuildingsGrid } from './components/BuildingsGrid';
import { TechGrid } from './components/TechGrid';
import { Prestige } from './components/Prestige';
import { PrestigeCard } from './components/PrestigeCard';
import { startGameLoop } from './app/gameLoop';
import './App.css';

function App() {
  useEffect(() => {
    startGameLoop();
  }, []);
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
