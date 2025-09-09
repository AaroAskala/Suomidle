import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import balance from '../lib/balance';

interface State {
  population: number;
  generators: Record<string, number>;
  lastSaved: number;
  addPopulation: (amount: number) => void;
  buyGenerator: (id: string) => void;
  tick: (delta: number) => void;
}

export const useGameStore = create<State>()(
  persist(
    (set, get) => ({
      population: 0,
      generators: {},
      lastSaved: Date.now(),
      addPopulation: (amount) =>
        set((s) => ({ population: s.population + amount })),
      buyGenerator: (id) => {
        const gen = balance.generators.find((g) => g.id === id);
        if (!gen) return;
        const count = get().generators[id] || 0;
        const price = balance.getPrice(gen, count);
        if (get().population >= price) {
          set((s) => ({
            population: s.population - price,
            generators: { ...s.generators, [id]: count + 1 },
          }));
        }
      },
      tick: (delta) => {
        const s = get();
        let gain = 0;
        for (const gen of balance.generators) {
          const count = s.generators[gen.id] || 0;
          gain += gen.rate * count * delta;
        }
        if (gain > 0) set({ population: s.population + gain });
      },
    }),
    {
      name: 'suomidle',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const now = Date.now();
          const delta = (now - state.lastSaved) / 1000;
          let gain = 0;
          for (const gen of balance.generators) {
            const count = state.generators[gen.id] || 0;
            gain += gen.rate * count * delta;
          }
          state.population += gain;
          state.lastSaved = now;
        }
      },
    }
  )
);

export const saveGame = () => {
  const state = useGameStore.getState();
  const payload = { ...state, lastSaved: Date.now() };
  localStorage.setItem('suomidle', JSON.stringify(payload));
  useGameStore.setState({ lastSaved: payload.lastSaved });
};
