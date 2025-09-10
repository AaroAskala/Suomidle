import { create } from 'zustand';
import {
  persist,
  createJSONStorage,
  type PersistOptions,
} from 'zustand/middleware';
import {
  buildings,
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
  techCounts: Record<string, number>;
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

const initialState = {
  population: 0,
  tierLevel: 1,
  buildings: {} as Record<string, number>,
  techCounts: {} as Record<string, number>,
  multipliers: { population_cps: 1 },
  cps: 0,
  clickPower: 1,
};

export const useGameStore = create<State>()(
  persist(
    (set, get) => ({
      ...initialState,
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
        if (!t) return;
        const s = get();
        const count = s.techCounts[id] || 0;
        const limit = t.limit ?? 1;
        if (count >= limit) return;
        if (t.unlock?.tier && s.tierLevel < t.unlock.tier) return;
        if (s.population < t.cost) return;
        const nextCounts = { ...s.techCounts, [id]: count + 1 };
        const multipliers = { ...s.multipliers };
        for (const eff of t.effects) {
          if (eff.target === 'population_cps') {
            if (eff.type === 'mult') multipliers.population_cps *= eff.value;
            else multipliers.population_cps += eff.value;
          }
        }
        set({
          population: s.population - t.cost,
          techCounts: nextCounts,
          multipliers,
        });
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
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number): Partial<State> => {
        if (version >= 3) return persistedState as Partial<State>;

        const old = persistedState as Record<string, unknown> | undefined;
        const counts: Record<string, number> = {};
        const raw =
          (old?.techCounts as unknown) !== undefined
            ? (old?.techCounts as unknown)
            : old?.techOwned;

        if (raw instanceof Set) {
          for (const id of raw) counts[id] = 1;
        } else if (Array.isArray(raw)) {
          for (const id of raw) counts[id] = 1;
        } else if (raw && typeof raw === 'object') {
          for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
            const n = typeof value === 'number' ? value : 1;
            counts[id] = n;
          }
        }

        if (Object.values(counts).some((n) => n > 1)) {
          return { ...initialState };
        }

        const multipliers: Multipliers = { population_cps: 1 };
        for (const [id, n] of Object.entries(counts)) {
          const t = getTech(id);
          if (!t) continue;
          for (const eff of t.effects) {
            if (eff.target === 'population_cps') {
              if (eff.type === 'mult') multipliers.population_cps *= eff.value ** n;
              else multipliers.population_cps += eff.value * n;
            }
          }
        }

        return {
          population: typeof old?.population === 'number' ? old.population : 0,
          tierLevel: typeof old?.tierLevel === 'number' ? old.tierLevel : 1,
          buildings: (old?.buildings as Record<string, number>) ?? {},
          techCounts: counts,
          multipliers,
          cps: 0,
          clickPower: 1,
        };
      },
      onRehydrateStorage: () => (state: State | undefined) => {
        if (state) {
          state.recompute();
        }
      },
    } as PersistOptions<State, Partial<State>>,
  ),
);

export const saveGame = () => {
  const state = useGameStore.getState();
  const rest = { ...state } as Record<string, unknown>;
  delete rest.addPopulation;
  delete rest.purchaseBuilding;
  delete rest.purchaseTech;
  delete rest.recompute;
  delete rest.tick;
  delete rest.canAdvanceTier;
  delete rest.advanceTier;
  const data = { state: rest, version: 3 };
  localStorage.setItem('suomidle', JSON.stringify(data));
};

