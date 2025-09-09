import { useEffect } from 'react';
import { HUD } from './components/HUD';
import { Store } from './components/Store';
import { Prestige } from './components/Prestige';
import { Upgrades } from './components/Upgrades';
import { startGameLoop } from './app/gameLoop';
import './App.css';

function App() {
  useEffect(() => {
    startGameLoop();
  }, []);
  return (
    <>
      <HUD />
      <Store />
      <Prestige />
      <Upgrades />
    </>
  );
}

export default App;
