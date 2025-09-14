import { create } from 'zustand';

export interface Sauna {
  id: 'sauna';
  pos: { q: number; r: number };
  spawnCooldown: number;
  timer: number;
  auraRadius: number;
  regenPerSec: number;
  rally: boolean;
}

const defaultSauna: Sauna = {
  id: 'sauna',
  pos: { q: 0, r: 0 },
  spawnCooldown: 30,
  timer: 30,
  auraRadius: 2,
  regenPerSec: 1,
  rally: false,
};

interface SaunaState {
  sauna: Sauna;
  toggleRally: () => void;
  tick: (dt: number) => void;
}

export const useSaunaStore = create<SaunaState>()((set) => ({
  sauna: defaultSauna,
  toggleRally: () =>
    set((s) => ({ sauna: { ...s.sauna, rally: !s.sauna.rally } })),
  tick: (dt) =>
    set((s) => {
      const sauna = { ...s.sauna };
      sauna.timer -= dt;
      if (sauna.timer <= 0) {
        sauna.timer += sauna.spawnCooldown;
        // TODO: integrate with unit spawning logic
        console.log('Spawn Raider near sauna');
      }
      return { sauna };
    }),
}));
