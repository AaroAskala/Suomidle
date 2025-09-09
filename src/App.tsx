import { useEffect } from 'react';
import { HUD } from './components/HUD';
import { Store } from './components/Store';
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
    </>
  );
}

export default App;
