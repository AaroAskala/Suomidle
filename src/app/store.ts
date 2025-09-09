import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import balance from '../lib/balance';
import upgrades from '../lib/upgrades';

const baseMultiplier = 2;

interface State {
  population: number;
  generators: Record<string, number>;
  upgrades: Set<string>;
  clickPower: number;
  cpsMultiplier: number;
  prestigeLevel: number;
  multiplier: number;
  lastSaved: number;
  addPopulation: (amount: number) => void;
  buyGenerator: (id: string) => void;
  purchaseUpgrade: (id: string) => void;
  recompute: () => void;
  tick: (delta: number) => void;
  prestige: () => void;
}

export const useGameStore = create<State>()(
  persist(
    (set, get) => ({
      population: 0,
      generators: {},
      upgrades: new Set<string>(),
      clickPower: 1,
      cpsMultiplier: 1,
      prestigeLevel: 0,
      multiplier: 1,
      lastSaved: Date.now(),
      addPopulation: (amount) =>
        set((s) => ({ population: s.population + amount * s.multiplier })),
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
      purchaseUpgrade: (id) => {
        const upg = upgrades.find((u) => u.id === id);
        const s = get();
        if (!upg || s.upgrades.has(id) || s.population < upg.cost) return;
        const owned = new Set(s.upgrades);
        owned.add(id);
        set({ population: s.population - upg.cost, upgrades: owned });
        get().recompute();
      },
      recompute: () => {
        const owned = get().upgrades;
        let click = 1;
        let cps = 1;
        for (const id of owned) {
          const upg = upgrades.find((u) => u.id === id);
          if (!upg) continue;
          const { type, target, value } = upg.apply;
          if (target === 'click') {
            if (type === 'add') click += value;
            else click *= value;
          } else if (target === 'cps') {
            if (type === 'add') cps += value;
            else cps *= value;
          }
        }
        set({ clickPower: click, cpsMultiplier: cps });
      },
      tick: (delta) => {
        const s = get();
        let gain = 0;
        for (const gen of balance.generators) {
          const count = s.generators[gen.id] || 0;
          gain += gen.rate * count * delta * s.cpsMultiplier;
        }
        gain *= s.multiplier;
        if (gain > 0) set({ population: s.population + gain });
      },
      prestige: () => {
        set((s) => {
          const level = s.prestigeLevel + 1;
          const mult = baseMultiplier ** level;
          return {
            population: 0,
            generators: {},
            prestigeLevel: level,
            multiplier: mult,
          };
        });
      },
    }),
    {
      name: 'suomidle',
      serialize: (state) =>
        JSON.stringify({
          ...state,
          state: {
            ...state.state,
            upgrades: Array.from(state.state.upgrades as Set<string>),
          },
        }),
      deserialize: (str) => {
        const data = JSON.parse(str);
        return {
          ...data,
          state: {
            ...data.state,
            upgrades: new Set<string>(data.state.upgrades),
          },
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.prestigeLevel ??= 0;
          state.multiplier = baseMultiplier ** state.prestigeLevel;
          const now = Date.now();
          const delta = (now - state.lastSaved) / 1000;
          let gain = 0;
          for (const gen of balance.generators) {
            const count = state.generators[gen.id] || 0;
            gain += gen.rate * count * delta * state.cpsMultiplier;
          }
          gain *= state.multiplier;
          state.population += gain;
          state.lastSaved = now;
          state.recompute();
        }
      },
    }
  )
);

export const saveGame = () => {
  const state = useGameStore.getState();
  const payload = {
    ...state,
    upgrades: Array.from(state.upgrades),
    lastSaved: Date.now(),
  };
  const data = { state: payload, version: 0 };
  localStorage.setItem('suomidle', JSON.stringify(data));
  useGameStore.setState({ lastSaved: payload.lastSaved });
};
