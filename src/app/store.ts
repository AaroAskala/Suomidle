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

export const BigBeautifulBalancePath = 7;
let needsEraPrompt = false;

interface Multipliers {
  population_cps: number;
}

type MaailmaState = {
  tuhka: string;
  purchases: string[];
  totalTuhkaEarned: string;
  totalResets: number;
  era: number;
} & Record<string, unknown>;

interface BaseState {
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
  eraPromptAcknowledged: boolean;
  maailma: MaailmaState;
}

interface Actions {
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

type State = BaseState & Actions;

const STORAGE_KEY = 'suomidle';

const createInitialMaailmaState = (): MaailmaState => ({
  tuhka: '0',
  purchases: [],
  totalTuhkaEarned: '0',
  totalResets: 0,
  era: 0,
});

const createInitialBaseState = (): BaseState => ({
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
  eraPromptAcknowledged: true,
  maailma: createInitialMaailmaState(),
});

const normalizeMaailma = (value: unknown): MaailmaState => {
  const defaults = createInitialMaailmaState();
  if (!value || typeof value !== 'object') {
    return { ...defaults, purchases: [...defaults.purchases] };
  }

  const source = value as Record<string, unknown>;
  const tuhkaRaw = source.tuhka;
  const tuhka =
    typeof tuhkaRaw === 'string'
      ? tuhkaRaw
      : typeof tuhkaRaw === 'number'
        ? tuhkaRaw.toString()
        : defaults.tuhka;

  const purchasesRaw = source.purchases;
  const purchases = Array.isArray(purchasesRaw)
    ? purchasesRaw.filter((item): item is string => typeof item === 'string')
    : defaults.purchases;

  const totalTuhkaEarnedRaw = source.totalTuhkaEarned;
  const totalTuhkaEarned =
    typeof totalTuhkaEarnedRaw === 'string'
      ? totalTuhkaEarnedRaw
      : typeof totalTuhkaEarnedRaw === 'number'
        ? totalTuhkaEarnedRaw.toString()
        : defaults.totalTuhkaEarned;

  const totalResetsRaw = source.totalResets;
  const totalResets =
    typeof totalResetsRaw === 'number' && Number.isFinite(totalResetsRaw)
      ? Math.max(0, Math.floor(totalResetsRaw))
      : defaults.totalResets;

  const eraRaw = source.era;
  const eraValue =
    typeof eraRaw === 'number' && Number.isFinite(eraRaw)
      ? Math.floor(eraRaw)
      : defaults.era;
  const era = eraValue > 0 ? 0 : eraValue;

  const normalized: MaailmaState = {
    ...source,
    tuhka,
    purchases: [...purchases],
    totalTuhkaEarned,
    totalResets,
    era,
  } as MaailmaState;

  return normalized;
};

const areMaailmaFieldsEqual = (a: MaailmaState, b: MaailmaState) =>
  a.tuhka === b.tuhka &&
  a.totalTuhkaEarned === b.totalTuhkaEarned &&
  a.totalResets === b.totalResets &&
  a.era === b.era &&
  a.purchases.length === b.purchases.length &&
  a.purchases.every((id, index) => id === b.purchases[index]);

interface PersistedStorageValue {
  version?: number;
  state?: Record<string, unknown>;
  save?: Record<string, unknown>;
}

const readPersistedStorage = (): PersistedStorageValue | null => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as PersistedStorageValue;
    }
  } catch {
    // Ignore malformed saves.
  }
  return null;
};

const writePersistedStorage = (value: PersistedStorageValue) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

const sanitizeState = (state: State): BaseState => {
  const {
    addPopulation: _addPopulation,
    purchaseBuilding: _purchaseBuilding,
    purchaseTech: _purchaseTech,
    recompute: _recompute,
    tick: _tick,
    canAdvanceTier: _canAdvanceTier,
    advanceTier: _advanceTier,
    canPrestige: _canPrestige,
    projectPrestigeGain: _projectPrestigeGain,
    prestige: _prestige,
    changeEra: _changeEra,
    ...rest
  } = state;
  const base = rest as BaseState;
  const maailma = normalizeMaailma(base.maailma);
  return { ...base, maailma };
};

const buildPersistedData = (
  state: BaseState,
  previousSave?: Record<string, unknown>,
) => {
  const maailma = normalizeMaailma(state.maailma);
  return {
    version: BigBeautifulBalancePath,
    state: { ...state, maailma },
    save: { ...(previousSave ?? {}), maailma },
  } satisfies PersistedStorageValue & {
    version: number;
    state: BaseState;
    save: Record<string, unknown>;
  };
};

const buildLocalSavePayload = (state: State, timestamp: number) => {
  const sanitized = sanitizeState(state);
  const baseState: BaseState = { ...sanitized, lastSave: timestamp };
  const previousSave = readPersistedStorage()?.save as Record<string, unknown> | undefined;
  return buildPersistedData(baseState, previousSave);
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
      ...createInitialBaseState(),
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
          ...createInitialBaseState(),
          eraMult: s.eraMult,
          totalPopulation: s.totalPopulation,
          prestigePoints: pointsAfter,
          prestigeMult: multAfter,
          maailma: normalizeMaailma(s.maailma),
        });
        get().recompute();
        saveGame();
        return true;
      },
      changeEra: () => {
        const s = get();
        set({
          ...createInitialBaseState(),
          eraMult: s.eraMult + 1,
          maailma: normalizeMaailma(s.maailma),
        });
        get().recompute();
        saveGame();
      },
    }),
    {
      name: STORAGE_KEY,
      version: BigBeautifulBalancePath,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number): Partial<State> => {
        const old = persistedState as Record<string, unknown> | undefined;
        const acknowledged = old?.eraPromptAcknowledged === true;
        let lastMajorVersion =
          typeof old?.lastMajorVersion === 'number' ? (old.lastMajorVersion as number) : 0;
        if (!acknowledged) lastMajorVersion = BigBeautifulBalancePath - 1;
        if (lastMajorVersion < BigBeautifulBalancePath) needsEraPrompt = true;
        const storedPersisted = readPersistedStorage();
        const storedState = storedPersisted?.state as Record<string, unknown> | undefined;
        const storedSave = storedPersisted?.save as Record<string, unknown> | undefined;
        const maailma = normalizeMaailma(
          (old as { maailma?: unknown })?.maailma ??
            storedSave?.maailma ??
            storedState?.maailma,
        );
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
            eraPromptAcknowledged: acknowledged,
            maailma,
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
            eraPromptAcknowledged: acknowledged,
            maailma,
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
          return { ...createInitialBaseState(), maailma };
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
          eraPromptAcknowledged: acknowledged,
          maailma,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const now = Date.now();
        const last = state.lastSave ?? now;
        const normalizedMaailma = normalizeMaailma(state.maailma);
        state.maailma = normalizedMaailma;
        state.recompute();
        const delta = Math.max(0, Math.floor((now - last) / 1000));
        state.tick(delta);
        useGameStore.setState({ lastSave: now, maailma: normalizedMaailma });
        let acknowledged = state.eraPromptAcknowledged;
        try {
          if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw) as PersistedStorageValue;
              const parsedState = parsed.state as Record<string, unknown> | undefined;
              const parsedSave = parsed.save as Record<string, unknown> | undefined;
              if (!('eraPromptAcknowledged' in (parsedState ?? {}))) acknowledged = false;
              const parsedStateMaailma = parsedState?.maailma;
              const parsedSaveMaailma = parsedSave?.maailma;
              const storedMaailma = normalizeMaailma(
                parsedSaveMaailma ?? parsedStateMaailma ?? normalizedMaailma,
              );
              if (!areMaailmaFieldsEqual(storedMaailma, state.maailma)) {
                state.maailma = storedMaailma;
                useGameStore.setState({ maailma: storedMaailma });
              }
              const hasStateMaailma =
                parsedState !== undefined &&
                Object.prototype.hasOwnProperty.call(parsedState, 'maailma');
              const hasSaveMaailma =
                parsedSave !== undefined &&
                Object.prototype.hasOwnProperty.call(parsedSave, 'maailma');
              const stateDiffers =
                parsedStateMaailma !== undefined &&
                !areMaailmaFieldsEqual(
                  normalizeMaailma(parsedStateMaailma),
                  state.maailma,
                );
              const saveDiffers =
                parsedSaveMaailma !== undefined &&
                !areMaailmaFieldsEqual(normalizeMaailma(parsedSaveMaailma), state.maailma);
              if (!hasStateMaailma || !hasSaveMaailma || stateDiffers || saveDiffers) {
                writePersistedStorage({
                  ...parsed,
                  version: parsed.version ?? BigBeautifulBalancePath,
                  state: { ...(parsedState ?? {}), maailma: state.maailma },
                  save: { ...(parsedSave ?? {}), maailma: state.maailma },
                });
              }
            }
          }
        } catch {
          acknowledged = false;
        }
        if (state.lastMajorVersion < BigBeautifulBalancePath || !acknowledged)
          needsEraPrompt = true;
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
          useGameStore.setState({
            lastMajorVersion: BigBeautifulBalancePath,
            eraPromptAcknowledged: true,
          });
          needsEraPrompt = false;
        }
        saveGame();
      },
    } as PersistOptions<State, Partial<State>>,
  ),
);

export const saveGame = () => {
  const now = Date.now();
  const state = useGameStore.getState();
  const payload = buildLocalSavePayload(state, now);
  useGameStore.setState({ lastSave: now, maailma: payload.state.maailma });
  writePersistedStorage(payload);
};

export const getCloudSavePayload = () => {
  const state = useGameStore.getState();
  const sanitized = sanitizeState(state);
  return buildPersistedData(sanitized);
};

