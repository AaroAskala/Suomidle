import { create } from 'zustand';

interface SettingsState {
  hasInteracted: boolean;
  queue: HTMLAudioElement[];
  markInteracted: () => void;
  enqueueAudio: (audio: HTMLAudioElement) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  hasInteracted: false,
  queue: [],
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
    if (get().hasInteracted) {
      audio.play().catch(() => {});
    } else {
      set((s) => ({ queue: [...s.queue, audio] }));
    }
  },
}));
