import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../app/settingsStore';

describe('settings persistence', () => {
  beforeEach(() => {
    useSettingsStore.persist.clearStorage();
    useSettingsStore.setState({
      hasInteracted: false,
      queue: [],
      audios: [],
      soundEnabled: true,
      volume: 1,
    });
  });

  it('persists sound settings to localStorage', () => {
    useSettingsStore.getState().setSoundEnabled(false);
    useSettingsStore.getState().setVolume(0.5);
    const raw = localStorage.getItem('settings');
    expect(raw).not.toBeNull();
    const data = JSON.parse(raw!);
    expect(data.state.soundEnabled).toBe(false);
    expect(data.state.volume).toBeCloseTo(0.5);
  });

  it('rehydrates sound settings from localStorage', async () => {
    const payload = { state: { soundEnabled: false, volume: 0.5 }, version: 1 };
    localStorage.setItem('settings', JSON.stringify(payload));
    await useSettingsStore.persist.rehydrate();
    const state = useSettingsStore.getState();
    expect(state.soundEnabled).toBe(false);
    expect(state.volume).toBeCloseTo(0.5);
  });
});
