import { useState } from 'react';
import { useGameStore } from '../app/store';

export function Settings() {
  const [open, setOpen] = useState(false);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const volume = useGameStore((s) => s.volume);
  const setSoundEnabled = useGameStore((s) => s.setSoundEnabled);
  const setVolume = useGameStore((s) => s.setVolume);
  return (
    <div className="settings">
      <button
        className="settings__button"
        onClick={() => setOpen((o) => !o)}
        aria-label="settings"
      >
        ☰
      </button>
      {open && (
        <div className="settings__panel">
          <label className="settings__row">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
            />
            Sound
          </label>
          <label className="settings__row">
            Volume
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  );
}
