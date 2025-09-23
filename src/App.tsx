import { useEffect } from 'react';
import { HUD } from './components/HUD';
import { BuildingsGrid } from './components/BuildingsGrid';
import { TechGrid } from './components/TechGrid';
import { Prestige } from './components/Prestige';
import { PrestigeCard } from './components/PrestigeCard';
import { Settings } from './components/Settings';
import { startGameLoop, stopGameLoop } from './app/gameLoop';
import { useGameStore } from './app/store';
import './App.css';
import { playTierMusic } from './audio/music';
import { useSettingsStore } from './app/settingsStore';
import { MaailmaShop } from './ui/MaailmaShop';
import { PoltaMaailmaButton } from './ui/PoltaMaailmaButton';
import { DailyTasksPanel } from './ui/dailyTasksUI';
import { useLocale } from './i18n/useLocale';
import { UpdateNotification } from './components/UpdateNotification';

function App() {
  const { t } = useLocale();
  const tierLevel = useGameStore((s) => s.tierLevel);
  const hasInteracted = useSettingsStore((s) => s.hasInteracted);
  const markInteracted = useSettingsStore((s) => s.markInteracted);
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
    useGameStore.getState().initializeDailyTasks();
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
    void playTierMusic(tierLevel);
  }, [tierLevel]);
  useEffect(() => {
    const handler = () => markInteracted();
    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [markInteracted]);
  return (
    <>
      {!hasInteracted && (
        <div className="tap-overlay" onPointerDown={markInteracted} role="button" aria-label={t('app.tapToStart')}>
          {t('app.tapToStart')}
        </div>
      )}
      <Settings />
      <UpdateNotification />
      <HUD />
      <DailyTasksPanel />
      <PrestigeCard />
      <BuildingsGrid />
      <TechGrid />
      <Prestige />
      <MaailmaShop />
      <PoltaMaailmaButton />
    </>
  );
}

export default App;
