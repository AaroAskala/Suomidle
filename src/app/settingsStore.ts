import { create } from 'zustand';
import {
  persist,
  createJSONStorage,
  type PersistOptions,
} from 'zustand/middleware';

interface SettingsState {
  hasInteracted: boolean;
  queue: HTMLAudioElement[];
  audios: HTMLAudioElement[];
  soundEnabled: boolean;
  volume: number;
  markInteracted: () => void;
  enqueueAudio: (audio: HTMLAudioElement) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
}

type PersistedSettings = { soundEnabled: boolean; volume: number };

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      hasInteracted: false,
      queue: [],
      audios: [],
      soundEnabled: true,
      volume: 1,
      markInteracted: () => {
        if (get().hasInteracted) return;
        const queued = get().queue;
        set({ hasInteracted: true, queue: [] });
        for (const audio of queued) {
          // Attempt to play; ignore errors (e.g. autoplay restrictions)
          audio.play().catch(() => {});
        }
      },
      enqueueAudio: (audio: HTMLAudioElement) => {
        audio.volume = get().volume;
        audio.muted = !get().soundEnabled;
        set((s) => ({ audios: [...s.audios, audio] }));
        if (get().hasInteracted) {
          audio.play().catch(() => {});
        } else {
          set((s) => ({ queue: [...s.queue, audio] }));
        }
      },
      setSoundEnabled: (enabled: boolean) => {
        set({ soundEnabled: enabled });
        const audios = get().audios;
        for (const audio of audios) {
          audio.muted = !enabled;
        }
      },
      setVolume: (volume: number) => {
        set({ volume });
        const audios = get().audios;
        for (const audio of audios) {
          audio.volume = volume;
        }
      },
    }),
    {
      name: 'settings',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        volume: state.volume,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        for (const audio of state.audios) {
          audio.muted = !state.soundEnabled;
          audio.volume = state.volume;
        }
      },
    } as PersistOptions<SettingsState, PersistedSettings>,
  ),
);
