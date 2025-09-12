import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from '../app/settingsStore';

describe('audio interaction gating', () => {
  beforeEach(() => {
    useSettingsStore.setState({ hasInteracted: false, queue: [] });
  });

  it('does not play audio before interaction', () => {
    const audio = { play: vi.fn().mockResolvedValue(undefined) } as unknown as HTMLAudioElement;
    useSettingsStore.getState().enqueueAudio(audio);
    expect(audio.play).not.toHaveBeenCalled();
  });

  it('plays queued audio after interaction', () => {
    const audio = { play: vi.fn().mockResolvedValue(undefined) } as unknown as HTMLAudioElement;
    useSettingsStore.getState().enqueueAudio(audio);
    expect(audio.play).not.toHaveBeenCalled();
    useSettingsStore.getState().markInteracted();
    expect(audio.play).toHaveBeenCalledTimes(1);
  });
});
