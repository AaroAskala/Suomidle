import { useState } from 'react';
import { useGameStore } from '../app/store';
import { updateMusicSettings } from '../audio/music';

export function Settings() {
  const [open, setOpen] = useState(false);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const volume = useGameStore((s) => s.volume);
  const setSoundEnabled = useGameStore((s) => s.setSoundEnabled);
  const setVolume = useGameStore((s) => s.setVolume);

  const toggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    updateMusicSettings();
  };

  const changeVolume = (v: number) => {
    setVolume(v);
    updateMusicSettings();
  };

  return (
    <div className="settings">
      <button className="settings__btn" onClick={() => setOpen(!open)}>
        ☰
      </button>
      {open && (
        <div className="settings__panel hud">
          <label>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => toggleSound(e.target.checked)}
            />{' '}
            Sound
          </label>
          <label>
            Volume
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  );
}
