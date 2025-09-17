import { useId, useState } from 'react';
import { useSettingsStore } from '../app/settingsStore';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLocale } from '../i18n/useLocale';

export function Settings() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const volume = useSettingsStore((s) => s.volume);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const setVolume = useSettingsStore((s) => s.setVolume);
  const menuId = useId();

  return (
    <div className="settings">
      <button
        aria-label={t('settings.openMenu')}
        className="burger-button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={menuId}
      >
        <span className="line" />
        <span className="line" />
        <span className="line" />
      </button>
      {open && (
        <div className="settings-menu" id={menuId}>
          <label className="settings-menu__option">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              aria-label={t('settings.sound')}
            />
            {t('settings.sound')}
          </label>
          <label className="settings-menu__option">
            <span>{t('settings.volume')}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label={t('settings.volume')}
            />
          </label>
          <LanguageSwitcher className="settings-menu__option" />
        </div>
      )}
    </div>
  );
}
