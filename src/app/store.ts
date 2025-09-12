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
  prestige as prestigeData,
} from '../content';

export const BigBeautifulBalancePath = 6;
let needsEraPrompt = false;

interface Multipliers {
  population_cps: number;
}

interface State {
  population: number;
  totalPopulation: number;
  tierLevel: number;
  buildings: Record<string, number>;
  techCounts: Record<string, number>;
  multipliers: Multipliers;
  cps: number;
  clickPower: number;
  prestigePoints: number;
  prestigeMult: number;
  eraMult: number;
  lastSave: number;
  lastMajorVersion: number;
  addPopulation: (amount: number) => void;
  purchaseBuilding: (id: string) => void;
  purchaseTech: (id: string) => void;
  recompute: () => void;
  tick: (delta: number) => void;
  canAdvanceTier: () => boolean;
  advanceTier: () => void;
  canPrestige: () => boolean;
  projectPrestigeGain: () => {
    pointsNow: number;
    multNow: number;
    pointsAfter: number;
    multAfter: number;
    deltaMult: number;
  };
  prestige: () => boolean;
  changeEra: () => void;
}

const initialState = {
  population: 0,
  totalPopulation: 0,
  tierLevel: 1,
  buildings: {} as Record<string, number>,
  techCounts: {} as Record<string, number>,
  multipliers: { population_cps: 1 },
  cps: 0,
  clickPower: 1,
  prestigePoints: 0,
  prestigeMult: 1,
  eraMult: 1,
  lastSave: Date.now(),
  lastMajorVersion: BigBeautifulBalancePath,
};

export const computePrestigePoints = (totalPop: number) => {
  if (prestigeData.formula.type === 'sqrt') {
    return Math.floor(Math.sqrt(totalPop / prestigeData.formula.k));
  }
  return 0;
};

export const computePrestigeMult = (points: number) => {
  if (prestigeData.formula.stacking === 'add') {
    return prestigeData.formula.base + points * prestigeData.formula.multPerPoint;
  }
  return 1;
};

export const useGameStore = create<State>()(
  persist(
    (set, get) => ({
      ...initialState,
      addPopulation: (amount) =>
        set((s) => ({
          population: s.population + amount,
          totalPopulation: s.totalPopulation + amount,
        })),
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
        cps *= s.prestigeMult * s.multipliers.population_cps * s.eraMult;
        const clickPower = Math.max(1, Math.round(cps / 100));
        set({ cps, clickPower });
      },
      tick: (delta) => {
        const gain = get().cps * delta;
        if (gain > 0)
          set((s) => ({
            population: s.population + gain,
            totalPopulation: s.totalPopulation + gain,
          }));
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
      canPrestige: () => get().totalPopulation >= prestigeData.minPopulation,
      projectPrestigeGain: () => {
        const s = get();
        const pointsAfter = computePrestigePoints(s.totalPopulation);
        const multAfter = computePrestigeMult(pointsAfter);
        return {
          pointsNow: s.prestigePoints,
          multNow: s.prestigeMult,
          pointsAfter,
          multAfter,
          deltaMult: multAfter - s.prestigeMult,
        };
      },
      prestige: () => {
        if (!get().canPrestige()) return false;
        const s = get();
        const pointsAfter = computePrestigePoints(s.totalPopulation);
        const multAfter = computePrestigeMult(pointsAfter);
        set({
          ...initialState,
          eraMult: s.eraMult,
          totalPopulation: s.totalPopulation,
          prestigePoints: pointsAfter,
          prestigeMult: multAfter,
        });
        get().recompute();
        saveGame();
        return true;
      },
      changeEra: () => {
        const s = get();
        set({
          ...initialState,
          eraMult: s.eraMult + 1,
        });
        get().recompute();
        saveGame();
      },
    }),
    {
      name: 'suomidle',
      version: BigBeautifulBalancePath,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number): Partial<State> => {
        const old = persistedState as Record<string, unknown> | undefined;
        const lastMajorVersion =
          typeof old?.lastMajorVersion === 'number' ? (old.lastMajorVersion as number) : 0;
        if (lastMajorVersion < BigBeautifulBalancePath) needsEraPrompt = true;
        if (version >= BigBeautifulBalancePath) {
          return {
            ...(old as Partial<State>),
            totalPopulation:
              typeof old?.totalPopulation === 'number'
                ? (old.totalPopulation as number)
                : Math.max(
                    typeof old?.population === 'number' ? (old.population as number) : 0,
                    0,
                  ),
            prestigePoints:
              typeof old?.prestigePoints === 'number' ? (old.prestigePoints as number) : 0,
            prestigeMult:
              typeof old?.prestigeMult === 'number' ? (old.prestigeMult as number) : 1,
            eraMult: typeof old?.eraMult === 'number' ? (old.eraMult as number) : 1,
            lastSave:
              typeof old?.lastSave === 'number' ? (old.lastSave as number) : Date.now(),
            lastMajorVersion,
          };
        }

        needsEraPrompt = true;
        if (version >= 3) {
          return {
            ...(old as Partial<State>),
            totalPopulation:
              typeof old?.totalPopulation === 'number'
                ? (old.totalPopulation as number)
                : Math.max(
                    typeof old?.population === 'number' ? (old.population as number) : 0,
                    0,
                  ),
            prestigePoints:
              typeof old?.prestigePoints === 'number' ? (old.prestigePoints as number) : 0,
            prestigeMult:
              typeof old?.prestigeMult === 'number' ? (old.prestigeMult as number) : 1,
            eraMult:
              typeof old?.eraMult === 'number' ? (old.eraMult as number) : 1,
            lastSave:
              typeof old?.lastSave === 'number' ? (old.lastSave as number) : Date.now(),
            lastMajorVersion,
          };
        }

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
          population: typeof old?.population === 'number' ? (old.population as number) : 0,
          totalPopulation: Math.max(
            typeof old?.population === 'number' ? (old.population as number) : 0,
            0,
          ),
          tierLevel: typeof old?.tierLevel === 'number' ? (old.tierLevel as number) : 1,
          buildings: (old?.buildings as Record<string, number>) ?? {},
          techCounts: counts,
          multipliers,
          cps: 0,
          clickPower: 1,
          prestigePoints: 0,
          prestigeMult: 1,
          eraMult: 1,
          lastSave: Date.now(),
          lastMajorVersion,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const now = Date.now();
        const last = state.lastSave ?? now;
        state.recompute();
        const delta = Math.max(0, Math.floor((now - last) / 1000));
        state.tick(delta);
        useGameStore.setState({ lastSave: now });
        if (state.lastMajorVersion < BigBeautifulBalancePath) needsEraPrompt = true;
        if (needsEraPrompt) {
          const next = state.eraMult + 1;
          const isJsDom =
            typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom');
          if (!isJsDom) {
            if (
              confirm(
                [
                  'Suomen sauna maailma on muuttunut täysin, haluatko polttaa koko maailman, ja aloittaa alusta?',
                  `Uudessa maailmassa saat ${next}× bonuksen lämpötilaan!`,
                  '',
                  'OK: Haluan nähdä kun maailma palaa',
                  'Cancel: Haluan jatkaa nykyisillä',
                ].join('\n'),
              )
            ) {
              state.changeEra();
            }
          }
          useGameStore.setState({ lastMajorVersion: BigBeautifulBalancePath });
          needsEraPrompt = false;
        }
        saveGame();
      },
    } as PersistOptions<State, Partial<State>>,
  ),
);

export const saveGame = () => {
  const now = Date.now();
  useGameStore.setState({ lastSave: now });
  const state = useGameStore.getState();
  const rest = { ...state } as Record<string, unknown>;
  delete rest.addPopulation;
  delete rest.purchaseBuilding;
  delete rest.purchaseTech;
  delete rest.recompute;
  delete rest.tick;
  delete rest.canAdvanceTier;
  delete rest.advanceTier;
  delete rest.canPrestige;
  delete rest.projectPrestigeGain;
  delete rest.prestige;
  delete rest.changeEra;
  const data = { state: rest, version: BigBeautifulBalancePath };
  localStorage.setItem('suomidle', JSON.stringify(data));
};

