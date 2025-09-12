import { useState } from 'react';
import { useSettingsStore } from '../app/settingsStore';

export function Settings() {
  const [open, setOpen] = useState(false);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const volume = useSettingsStore((s) => s.volume);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const setVolume = useSettingsStore((s) => s.setVolume);

  return (
    <div className="settings">
      <button
        aria-label="Settings"
        className="burger-button"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="line" />
        <span className="line" />
        <span className="line" />
      </button>
      {open && (
        <div className="settings-menu">
          <label>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
            />
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
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  );
}
