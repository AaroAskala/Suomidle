import { create } from 'zustand';
import {
  persist,
  createJSONStorage,
  type PersistOptions,
  type StorageValue,
} from 'zustand/middleware';
import {
  buildings,
  tech,
  getBuilding,
  getTech,
  getTier,
  getBuildingCost,
} from '../content';

interface Multipliers {
  population_cps: number;
}

interface State {
  population: number;
  tierLevel: number;
  buildings: Record<string, number>;
  techOwned: Set<string>;
  multipliers: Multipliers;
  cps: number;
  clickPower: number;
  addPopulation: (amount: number) => void;
  purchaseBuilding: (id: string) => void;
  purchaseTech: (id: string) => void;
  recompute: () => void;
  tick: (delta: number) => void;
  canAdvanceTier: () => boolean;
  advanceTier: () => void;
}

interface PersistOptionsWithSerialization
  extends PersistOptions<State, Partial<State>> {
  serialize: (state: StorageValue<Partial<State>>) => string;
  deserialize: (str: string) => StorageValue<Partial<State>>;
  migrate?: (persistedState: unknown, version: number) => Partial<State>;
}

export const useGameStore = create<State>()(
  persist(
    (set, get) => ({
      population: 0,
      tierLevel: 1,
      buildings: {},
      techOwned: new Set<string>(),
      multipliers: { population_cps: 1 },
      cps: 0,
      clickPower: 1,
      addPopulation: (amount) =>
        set((s) => ({ population: s.population + amount })),
      purchaseBuilding: (id) => {
        const b = getBuilding(id);
        if (!b) return;
        const s = get();
        if (b.unlock?.tier && s.tierLevel < b.unlock.tier) return;
        const count = s.buildings[id] || 0;
        const price = getBuildingCost(b, count);
        if (s.population < price) return;
        set({
          population: s.population - price,
          buildings: { ...s.buildings, [id]: count + 1 },
        });
        get().recompute();
      },
      purchaseTech: (id) => {
        const t = getTech(id);
        const s = get();
        if (!t || s.techOwned.has(id)) return;
        if (t.unlock?.tier && s.tierLevel < t.unlock.tier) return;
        if (s.population < t.cost) return;
        const owned = new Set(s.techOwned);
        owned.add(id);
        const multipliers = { ...s.multipliers };
        for (const eff of t.effects) {
          if (eff.target === 'population_cps') {
            if (eff.type === 'mult') multipliers.population_cps *= eff.value;
            else multipliers.population_cps += eff.value;
          }
        }
        set({ population: s.population - t.cost, techOwned: owned, multipliers });
        get().recompute();
      },
      recompute: () => {
        const s = get();
        let cps = 0;
        for (const b of buildings) {
          const count = s.buildings[b.id] || 0;
          cps += b.baseProd * count;
        }
        cps *= s.multipliers.population_cps;
        set({ cps });
      },
      tick: (delta) => {
        const gain = get().cps * delta;
        if (gain > 0) set((s) => ({ population: s.population + gain }));
      },
      canAdvanceTier: () => {
        const s = get();
        const next = getTier(s.tierLevel + 1);
        return !!next && s.population >= next.population;
      },
      advanceTier: () => {
        if (get().canAdvanceTier())
          set((s) => ({ tierLevel: s.tierLevel + 1 }));
      },
    }),
    {
      name: 'suomidle',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      serialize: (state: StorageValue<Partial<State>>): string =>
        JSON.stringify({
          ...state,
          state: {
            ...state.state,
            techOwned: Array.from(state.state.techOwned ?? []),
          },
        }),
      deserialize: (str: string): StorageValue<Partial<State>> => {
        const data = JSON.parse(str);
        const raw = data.state?.techOwned;
        const owned =
          raw instanceof Set
            ? raw
            : Array.isArray(raw)
              ? new Set<string>(raw)
              : raw && typeof raw === 'object'
                ? new Set<string>(Object.keys(raw))
                : new Set<string>();
        return {
          ...data,
          state: {
            ...data.state,
            techOwned: owned,
          },
        } as StorageValue<Partial<State>>;
      },
      migrate: (persistedState: unknown, version: number): Partial<State> => {
        if (version >= 2) return persistedState as Partial<State>;
        const old = persistedState as {
          population?: number;
          generators?: Record<string, number>;
          upgrades?: string[];
        };
        const mapped: Record<string, number> = {};
        if (old.generators) {
          for (const [id, count] of Object.entries(old.generators)) {
            if (buildings.find((b) => b.id === id)) mapped[id] = count;
          }
        }
        const owned = new Set<string>();
        if (old.upgrades) {
          for (const id of old.upgrades) {
            if (tech.find((t) => t.id === id)) owned.add(id);
          }
        }
        return {
          population: old.population ?? 0,
          tierLevel: 1,
          buildings: mapped,
          techOwned: owned,
          multipliers: { population_cps: 1 },
          cps: 0,
          clickPower: 1,
        };
      },
      onRehydrateStorage: () => (state: State | undefined) => {
        if (state) {
          if (!(state.techOwned instanceof Set)) {
            const current = state.techOwned as unknown;
            state.techOwned = Array.isArray(current)
              ? new Set(current)
              : current && typeof current === 'object'
                ? new Set(Object.keys(current as Record<string, unknown>))
                : new Set<string>();
          }
          state.recompute();
        }
      },
    } as PersistOptionsWithSerialization,
  ),
);

export const saveGame = () => {
  const state = useGameStore.getState();
  const payload = {
    ...state,
    techOwned: Array.from(state.techOwned),
  };
  const data = { state: payload, version: 2 };
  localStorage.setItem('suomidle', JSON.stringify(data));
};
