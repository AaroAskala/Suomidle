import Decimal from 'decimal.js';
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
  prestige as prestigeData,
} from '../content';
import {
  applyPermanentBonuses,
  type PermanentBonuses,
} from '../effects/applyPermanentBonuses';
import {
  BUILDING_PURCHASE_EPSILON,
  createBuildingPurchaseState,
  getMaxAffordablePurchases,
  getTotalCostForPurchases,
} from './buildingPurchase';
import maailmaShop from '../data/maailma_shop.json' assert { type: 'json' };
import {
  createInitialDailyTasksState,
  syncDailyTasksState,
  handleDailyTaskEvent,
  applyUptimeProgress,
  getEffectiveTemperatureMultiplier,
  claimDailyTaskReward as claimDailyTaskRewardEffect,
  type DailyTasksState,
  type DailyTaskPlayerContext,
  updateDailyTaskMetrics,
} from '../systems/dailyTasks';

export const BigBeautifulBalancePath = 7;
let needsEraPrompt = false;

interface Multipliers {
  population_cps: number;
}

interface ModifiersState {
  permanent: PermanentBonuses;
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
  modifiers: ModifiersState;
  cps: number;
  clickPower: number;
  prestigePoints: number;
  prestigeMult: number;
  eraMult: number;
  lampotilaRate: number;
  lastSave: number;
  lastMajorVersion: number;
  eraPromptAcknowledged: boolean;
  maailma: MaailmaState;
  dailyTasks: DailyTasksState;
}

interface Actions {
  addPopulation: (amount: number) => void;
  purchaseBuilding: (id: string) => void;
  purchaseBuildingMax: (id: string) => void;
  purchaseTech: (id: string) => void;
  purchaseMaailmaUpgrade: (id: string) => boolean;
  recompute: () => void;
  tick: (delta: number, options?: { offline?: boolean }) => void;
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
  initializeDailyTasks: () => void;
  claimDailyTaskReward: (taskId: string) => void;
}

type State = BaseState & Actions;

const STORAGE_KEY_BASE = 'suomidle';

type ImportMetaEnvLike = {
  VITE_STORAGE_NAMESPACE?: string;
  BASE_URL?: string;
  MODE?: string;
  VITE_ENABLE_DEV_TIER_CPS_MULTIPLIER?: string;
};

const parseEnvBoolean = (value: string | undefined): boolean => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized === '1' ||
    normalized === 'true' ||
    normalized === 'yes' ||
    normalized === 'on' ||
    normalized === 'enable' ||
    normalized === 'enabled'
  );
};

const DEV_TIER_CPS_MULTIPLIER_ENABLED = (() => {
  if (typeof import.meta === 'undefined') return false;
  const env = ((import.meta.env as ImportMetaEnvLike | undefined) ?? {}) as ImportMetaEnvLike;
  const mode = env.MODE?.trim().toLowerCase();
  if (mode === 'production') return false;
  return parseEnvBoolean(env.VITE_ENABLE_DEV_TIER_CPS_MULTIPLIER);
})();

const computeDevTierPopulationMultiplier = (tierLevel: number): number => {
  if (!DEV_TIER_CPS_MULTIPLIER_ENABLED) return 1;
  if (!Number.isFinite(tierLevel)) return 1;
  const normalizedTier = Math.max(1, Math.trunc(tierLevel));
  return normalizedTier * 100;
};

const normalizeStorageNamespace = (value: string | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return normalized.length > 0 ? normalized : null;
};

const resolveStorageNamespace = (): string | null => {
  const env =
    (typeof import.meta !== 'undefined'
      ? ((import.meta.env as ImportMetaEnvLike | undefined) ?? {})
      : {});
  const explicit = normalizeStorageNamespace(env.VITE_STORAGE_NAMESPACE);
  if (explicit) return explicit;

  const fromBaseUrl = normalizeStorageNamespace(env.BASE_URL);
  if (fromBaseUrl) return fromBaseUrl;

  const mode = env.MODE === 'production' ? null : normalizeStorageNamespace(env.MODE);
  if (mode) return mode;

  return null;
};

const STORAGE_NAMESPACE = resolveStorageNamespace();

/**
 * Derived local storage key for persisted saves.
 *
 * The production build keeps the original `suomidle` namespace to preserve
 * existing player data. Development, test, and preview deployments can supply a
 * custom namespace via `VITE_STORAGE_NAMESPACE`, or fall back to the build
 * `BASE_URL`/mode so their saves land in an isolated slot (e.g.
 * `suomidle:dev-preview`).
 */
export const STORAGE_KEY = STORAGE_NAMESPACE
  ? `${STORAGE_KEY_BASE}:${STORAGE_NAMESPACE}`
  : STORAGE_KEY_BASE;
const decimalZero = new Decimal(0);

type RawMaailmaShopItem = {
  id?: unknown;
  cost_tuhka?: unknown;
  max_level?: unknown;
};

const rawShopItems = Array.isArray((maailmaShop as { shop?: unknown }).shop)
  ? ((maailmaShop as { shop: RawMaailmaShopItem[] }).shop ?? [])
  : [];

const maailmaShopItemsById = new Map<
  string,
  { costs: number[]; maxLevel: number }
>();

for (const item of rawShopItems) {
  if (!item || typeof item.id !== 'string') continue;
  const costsSource = Array.isArray(item.cost_tuhka) ? item.cost_tuhka : [];
  const costs = costsSource
    .map((value) => (typeof value === 'number' && Number.isFinite(value) ? value : null))
    .filter((value): value is number => value !== null);
  const maxLevelRaw = item.max_level;
  const maxLevel =
    typeof maxLevelRaw === 'number' && Number.isFinite(maxLevelRaw)
      ? Math.max(0, Math.floor(maxLevelRaw))
      : costs.length;
  maailmaShopItemsById.set(item.id, { costs, maxLevel });
}

const countMaailmaPurchases = (purchases: string[], id: string) =>
  purchases.reduce((count, entry) => (entry === id ? count + 1 : count), 0);

const getMaailmaNextCost = (id: string, level: number) => {
  const item = maailmaShopItemsById.get(id);
  if (!item) return undefined;
  if (item.costs.length === 0 || level >= item.maxLevel) return undefined;
  const index = Math.min(level, item.costs.length - 1);
  return item.costs[index];
};

const formatDecimalString = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  const safe = Math.max(0, value);
  const fixed = safe.toFixed(6);
  const trimmed = fixed.replace(/\.0+$/, '').replace(/\.([0-9]*?)0+$/, '.$1');
  const cleaned = trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed;
  return cleaned.length > 0 ? cleaned : '0';
};

const cloneMaailmaForBonuses = (maailma: MaailmaState): MaailmaState => ({
  ...maailma,
  purchases: [...maailma.purchases],
});

const computePermanentBonusesFromMaailma = (maailma: MaailmaState): PermanentBonuses => {
  const payload = {
    maailma: cloneMaailmaForBonuses(maailma),
  } as Parameters<typeof applyPermanentBonuses>[0];
  return applyPermanentBonuses(payload);
};

const computeTierBonusMultiplier = (
  tierLevel: number,
  perTierBonuses: Record<string, number>,
) => {
  let multiplier = 1;
  for (const [key, value] of Object.entries(perTierBonuses)) {
    const fromTier = Number(key);
    if (!Number.isFinite(fromTier)) continue;
    const unlockedTiers = Math.max(0, tierLevel - fromTier + 1);
    if (unlockedTiers <= 0) continue;
    if (value >= 1) {
      multiplier *= Math.pow(value, unlockedTiers);
    } else {
      const addition = Math.max(0, 1 + value * unlockedTiers);
      multiplier *= addition;
    }
  }
  return multiplier;
};

const createInitialMaailmaState = (): MaailmaState => ({
  tuhka: '0',
  purchases: [],
  totalTuhkaEarned: '0',
  totalResets: 0,
  era: 0,
});

const buildDailyTaskContext = (state: BaseState): DailyTaskPlayerContext => ({
  tierLevel: state.tierLevel,
  population: state.population,
  totalPopulation: state.totalPopulation,
  prestigeMult: state.prestigeMult,
  prestigeUnlocked:
    state.prestigePoints > 0 ||
    state.prestigeMult > 1 ||
    state.totalPopulation >= prestigeData.minPopulation,
});

const createInitialBaseState = (): BaseState => {
  const maailma = createInitialMaailmaState();
  const permanent = computePermanentBonusesFromMaailma(maailma);
  const prestigeMult = Math.max(1, permanent.saunaPrestigeBaseMultiplierMin);
  return {
    population: 0,
    totalPopulation: 0,
    tierLevel: 1,
    buildings: {} as Record<string, number>,
    techCounts: {} as Record<string, number>,
    multipliers: { population_cps: 1 },
    modifiers: { permanent },
    cps: 0,
    clickPower: 1,
    prestigePoints: 0,
    prestigeMult,
    eraMult: 1,
    lampotilaRate: permanent.lampotilaRateMult,
    lastSave: Date.now(),
    lastMajorVersion: BigBeautifulBalancePath,
    eraPromptAcknowledged: true,
    maailma,
    dailyTasks: createInitialDailyTasksState(),
  };
};

const createProgressResetState = (state: State, maailmaOverride?: MaailmaState): BaseState => {
  const base = createInitialBaseState();
  const maailma = normalizeMaailma(maailmaOverride ?? state.maailma);
  const permanent = computePermanentBonusesFromMaailma(maailma);
  const prestigeMult = Math.max(base.prestigeMult, permanent.saunaPrestigeBaseMultiplierMin);
  const lampotilaRate = Math.max(0, permanent.lampotilaRateMult);
  const resetBase: BaseState = {
    ...base,
    eraMult: state.eraMult,
    maailma,
    modifiers: { ...(base.modifiers ?? { permanent }), permanent },
    prestigeMult,
    lampotilaRate,
    dailyTasks: state.dailyTasks,
  };
  const context = buildDailyTaskContext(resetBase);
  const dailyTasks = syncDailyTasksState(state.dailyTasks, context, Date.now());
  return { ...resetBase, dailyTasks };
};

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
    addPopulation,
    purchaseBuilding,
    purchaseBuildingMax,
    purchaseTech,
    recompute,
    tick,
    canAdvanceTier,
    advanceTier,
    canPrestige,
    projectPrestigeGain,
    prestige,
    changeEra,
    ...rest
  } = state;
  void addPopulation;
  void purchaseBuilding;
  void purchaseBuildingMax;
  void purchaseTech;
  void recompute;
  void tick;
  void canAdvanceTier;
  void advanceTier;
  void canPrestige;
  void projectPrestigeGain;
  void prestige;
  void changeEra;
  const base = rest as BaseState;
  const maailma = normalizeMaailma(base.maailma);
  const permanent = computePermanentBonusesFromMaailma(maailma);
  const prestigeMult = Math.max(base.prestigeMult, permanent.saunaPrestigeBaseMultiplierMin);
  const previousModifiers = base.modifiers ?? { permanent };
  const sanitized: BaseState = {
    ...base,
    prestigeMult,
    lampotilaRate: permanent.lampotilaRateMult,
    modifiers: { ...previousModifiers, permanent },
    maailma,
  };
  const now = Date.now();
  const context = buildDailyTaskContext(sanitized);
  const dailyTasks = syncDailyTasksState(
    base.dailyTasks ?? createInitialDailyTasksState(),
    context,
    now,
  );
  return { ...sanitized, dailyTasks };
};

const buildPersistedData = (
  state: BaseState,
  previousSave?: Record<string, unknown>,
) => {
  const maailma = normalizeMaailma(state.maailma);
  const save = { ...(previousSave ?? {}), maailma } as Record<string, unknown>;
  const permanent = applyPermanentBonuses(
    save as Parameters<typeof applyPermanentBonuses>[0],
  );
  return {
    version: BigBeautifulBalancePath,
    state: {
      ...state,
      maailma,
      modifiers: { ...(state.modifiers ?? { permanent }), permanent },
      prestigeMult: Math.max(state.prestigeMult, permanent.saunaPrestigeBaseMultiplierMin),
      lampotilaRate: Math.max(0, permanent.lampotilaRateMult),
    },
    save,
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

const toBigInt = (value: unknown): bigint => {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const truncated = value < 0 ? Math.ceil(value) : Math.floor(value);
    return BigInt(truncated);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return 0n;
    try {
      return BigInt(trimmed);
    } catch {
      return 0n;
    }
  }
  return 0n;
};

const getSafeCount = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;

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
        set((s) => {
          const now = Date.now();
          const contextBefore = buildDailyTaskContext(s);
          let dailyTasks = syncDailyTasksState(s.dailyTasks, contextBefore, now);
          const { state: buffedTasks, multiplier } = getEffectiveTemperatureMultiplier(
            dailyTasks,
            now,
          );
          dailyTasks = buffedTasks;
          const gain = amount * multiplier;
          const nextPopulation = s.population + gain;
          const nextTotalPopulation = s.totalPopulation + gain;
          const contextAfter: DailyTaskPlayerContext = {
            ...contextBefore,
            population: nextPopulation,
            totalPopulation: nextTotalPopulation,
          };
          dailyTasks = handleDailyTaskEvent(dailyTasks, { type: 'loyly_throw' }, contextAfter, now);
          dailyTasks = handleDailyTaskEvent(dailyTasks, { type: 'click' }, contextAfter, now);
          return {
            population: nextPopulation,
            totalPopulation: nextTotalPopulation,
            dailyTasks,
          };
        }),
      purchaseBuilding: (id) => {
        const b = getBuilding(id);
        if (!b) return;
        let didPurchase = false;
        set((s) => {
          const permanent = s.modifiers.permanent;
          const tierOffset = Math.trunc(permanent.tierUnlockOffset);
          const effectiveTierLevel = s.tierLevel - tierOffset;
          if (b.unlock?.tier && effectiveTierLevel < b.unlock.tier) return {};
          const count = s.buildings[id] || 0;
          const purchaseState = createBuildingPurchaseState(b, count, permanent);
          const price = purchaseState.nextPrice;
          if (!Number.isFinite(price) || price <= 0 || s.population < price) return {};
          const now = Date.now();
          const contextBefore = buildDailyTaskContext(s);
          let dailyTasks = syncDailyTasksState(s.dailyTasks, contextBefore, now);
          const nextPopulation = s.population - price;
          const buildings = { ...s.buildings, [id]: count + 1 };
          const contextAfter: DailyTaskPlayerContext = {
            ...contextBefore,
            population: nextPopulation,
          };
          dailyTasks = updateDailyTaskMetrics(dailyTasks, contextAfter, now);
          dailyTasks = handleDailyTaskEvent(
            dailyTasks,
            { type: 'building_bought', buildingId: id },
            contextAfter,
            now,
          );
          dailyTasks = handleDailyTaskEvent(
            dailyTasks,
            { type: 'building_bought_same_type', buildingId: id },
            contextAfter,
            now,
          );
          didPurchase = true;
          return {
            population: nextPopulation,
            buildings,
            dailyTasks,
          };
        });
        if (didPurchase) {
          get().recompute();
        }
      },
      purchaseBuildingMax: (id) => {
        const b = getBuilding(id);
        if (!b) return;
        let didPurchase = false;
        set((s) => {
          const permanent = s.modifiers.permanent;
          const tierOffset = Math.trunc(permanent.tierUnlockOffset);
          const effectiveTierLevel = s.tierLevel - tierOffset;
          if (b.unlock?.tier && effectiveTierLevel < b.unlock.tier) return {};
          const count = s.buildings[id] || 0;
          const purchaseState = createBuildingPurchaseState(b, count, permanent);
          const maxPurchases = getMaxAffordablePurchases(purchaseState, s.population);
          if (maxPurchases <= 0) return {};
          const totalCost = getTotalCostForPurchases(purchaseState, maxPurchases);
          if (!Number.isFinite(totalCost) || totalCost <= 0) return {};
          const nextPopulationRaw = s.population - totalCost;
          const nextPopulation =
            nextPopulationRaw <= 0 && Math.abs(nextPopulationRaw) <= BUILDING_PURCHASE_EPSILON
              ? 0
              : nextPopulationRaw;
          const buildings = { ...s.buildings, [id]: count + maxPurchases };
          const now = Date.now();
          const contextBefore = buildDailyTaskContext(s);
          let dailyTasks = syncDailyTasksState(s.dailyTasks, contextBefore, now);
          const contextAfter: DailyTaskPlayerContext = {
            ...contextBefore,
            population: nextPopulation,
          };
          dailyTasks = updateDailyTaskMetrics(dailyTasks, contextAfter, now);
          for (let i = 0; i < maxPurchases; i += 1) {
            dailyTasks = handleDailyTaskEvent(
              dailyTasks,
              { type: 'building_bought', buildingId: id },
              contextAfter,
              now,
            );
            dailyTasks = handleDailyTaskEvent(
              dailyTasks,
              { type: 'building_bought_same_type', buildingId: id },
              contextAfter,
              now,
            );
          }
          didPurchase = true;
          return {
            population: nextPopulation,
            buildings,
            dailyTasks,
          };
        });
        if (didPurchase) {
          get().recompute();
        }
      },
      purchaseTech: (id) => {
        const t = getTech(id);
        if (!t) return;
        let didPurchase = false;
        set((s) => {
          const count = s.techCounts[id] || 0;
          const limit = t.limit ?? 1;
          if (count >= limit) return {};
          const tierOffset = Math.trunc(s.modifiers.permanent.tierUnlockOffset);
          const effectiveTierLevel = s.tierLevel - tierOffset;
          if (t.unlock?.tier && effectiveTierLevel < t.unlock.tier) return {};
          if (s.population < t.cost) return {};
          const nextCounts = { ...s.techCounts, [id]: count + 1 };
          const multipliers = { ...s.multipliers };
          for (const eff of t.effects) {
            if (eff.target === 'population_cps') {
              if (eff.type === 'mult') multipliers.population_cps *= eff.value;
              else multipliers.population_cps += eff.value;
            }
          }
          const now = Date.now();
          const contextBefore = buildDailyTaskContext(s);
          let dailyTasks = syncDailyTasksState(s.dailyTasks, contextBefore, now);
          const nextPopulation = s.population - t.cost;
          const contextAfter: DailyTaskPlayerContext = {
            ...contextBefore,
            population: nextPopulation,
          };
          dailyTasks = updateDailyTaskMetrics(dailyTasks, contextAfter, now);
          dailyTasks = handleDailyTaskEvent(
            dailyTasks,
            { type: 'technology_bought', technologyId: id },
            contextAfter,
            now,
          );
          didPurchase = true;
          return {
            population: nextPopulation,
            techCounts: nextCounts,
            multipliers,
            dailyTasks,
          };
        });
        if (didPurchase) {
          get().recompute();
        }
      },
      purchaseMaailmaUpgrade: (id) => {
        let didPurchase = false;
        set((state) => {
          const currentMaailma = normalizeMaailma(state.maailma);
          const numericTuhka = Number.parseFloat(currentMaailma.tuhka);
          if (!Number.isFinite(numericTuhka)) return {};
          const level = countMaailmaPurchases(currentMaailma.purchases, id);
          const cost = getMaailmaNextCost(id, level);
          if (cost === undefined) return {};
          if (numericTuhka < cost) return {};
          const remaining = formatDecimalString(numericTuhka - cost);
          const nextPurchases = [...currentMaailma.purchases, id];
          const nextMaailma: MaailmaState = {
            ...currentMaailma,
            tuhka: remaining,
            purchases: nextPurchases,
          };
          const permanent = computePermanentBonusesFromMaailma(nextMaailma);
          const previousModifiers = state.modifiers ?? { permanent };
          didPurchase = true;
          return {
            maailma: nextMaailma,
            modifiers: { ...previousModifiers, permanent },
            prestigeMult: Math.max(
              state.prestigeMult,
              permanent.saunaPrestigeBaseMultiplierMin,
            ),
            lampotilaRate: Math.max(0, permanent.lampotilaRateMult),
          };
        });
        if (didPurchase) {
          get().recompute();
        }
        return didPurchase;
      },
      recompute: () => {
        const s = get();
        const permanent = s.modifiers.permanent;
        let cpsBase = 0;
        for (const b of buildings) {
          const count = s.buildings[b.id] || 0;
          if (count <= 0) continue;
          cpsBase += b.baseProd * count;
        }
        const baseProdMult = Math.max(0, permanent.baseProdMult);
        const techBonusMultiplier = Math.max(0, 1 + permanent.techMultiplierBonusAdd);
        const spentBonusMultiplier = Math.max(0, 1 + permanent.globalCpsAddFromTuhkaSpent);
        const tierBonusMultiplier = computeTierBonusMultiplier(
          s.tierLevel,
          permanent.perTierGlobalCpsAdd,
        );
        const devTierMultiplier = computeDevTierPopulationMultiplier(s.tierLevel);
        const prestigeMult = Math.max(s.prestigeMult, permanent.saunaPrestigeBaseMultiplierMin);
        const globalMultiplier =
          prestigeMult *
          s.eraMult *
          Math.max(0, s.multipliers.population_cps) *
          techBonusMultiplier *
          spentBonusMultiplier *
          tierBonusMultiplier *
          devTierMultiplier;
        const cps = cpsBase * baseProdMult * globalMultiplier;
        const clickPower = Math.max(1, Math.round(cps / 100));
        set({ cps, clickPower, lampotilaRate: Math.max(0, permanent.lampotilaRateMult) });
      },
      tick: (delta, options) => {
        set((s) => {
          const now = Date.now();
          const contextBefore = buildDailyTaskContext(s);
          let dailyTasks = syncDailyTasksState(s.dailyTasks, contextBefore, now);
          const { state: buffedTasks, multiplier } = getEffectiveTemperatureMultiplier(
            dailyTasks,
            now,
          );
          dailyTasks = buffedTasks;
          const offlineMult = options?.offline ? s.modifiers.permanent.offlineProdMult : 1;
          const gain = s.cps * delta * offlineMult * multiplier;
          let nextPopulation = s.population;
          let nextTotalPopulation = s.totalPopulation;
          if (gain > 0) {
            nextPopulation += gain;
            nextTotalPopulation += gain;
          }
          const contextAfter: DailyTaskPlayerContext = {
            ...contextBefore,
            population: nextPopulation,
            totalPopulation: nextTotalPopulation,
          };
          dailyTasks = updateDailyTaskMetrics(dailyTasks, contextAfter, now);
          dailyTasks = applyUptimeProgress(dailyTasks, contextAfter, delta, now, options);
          return {
            population: nextPopulation,
            totalPopulation: nextTotalPopulation,
            dailyTasks,
          };
        });
      },
      canAdvanceTier: () => {
        const s = get();
        const offset = Math.trunc(s.modifiers.permanent.tierUnlockOffset);
        const targetTier = Math.max(1, s.tierLevel + 1 + offset);
        const next = getTier(targetTier);
        return !!next && s.population >= next.population;
      },
      advanceTier: () => {
        if (!get().canAdvanceTier()) return;
        const now = Date.now();
        set((s) => {
          const nextTier = s.tierLevel + 1;
          const contextBefore = buildDailyTaskContext(s);
          let dailyTasks = syncDailyTasksState(s.dailyTasks, contextBefore, now);
          const contextAfter: DailyTaskPlayerContext = { ...contextBefore, tierLevel: nextTier };
          dailyTasks = handleDailyTaskEvent(
            dailyTasks,
            { type: 'tier_unlocked', tierLevel: nextTier },
            contextAfter,
            now,
          );
          return { tierLevel: nextTier, dailyTasks };
        });
        get().recompute();
      },
      canPrestige: () => get().totalPopulation >= prestigeData.minPopulation,
      projectPrestigeGain: () => {
        const s = get();
        const pointsAfter = computePrestigePoints(s.totalPopulation);
        const currentMult = Math.max(
          s.prestigeMult,
          s.modifiers.permanent.saunaPrestigeBaseMultiplierMin,
        );
        const multAfterRaw = computePrestigeMult(pointsAfter);
        const multAfter = Math.max(
          multAfterRaw,
          s.modifiers.permanent.saunaPrestigeBaseMultiplierMin,
        );
        return {
          pointsNow: s.prestigePoints,
          multNow: currentMult,
          pointsAfter,
          multAfter,
          deltaMult: multAfter - currentMult,
        };
      },
      prestige: () => {
        if (!get().canPrestige()) return false;
        const s = get();
        const now = Date.now();
        const contextBefore = buildDailyTaskContext(s);
        let dailyTasks = syncDailyTasksState(s.dailyTasks, contextBefore, now);
        const pointsAfter = computePrestigePoints(s.totalPopulation);
        const normalizedMaailma = normalizeMaailma(s.maailma);
        const permanent = computePermanentBonusesFromMaailma(normalizedMaailma);
        const baseState = createInitialBaseState();
        const keepTech = permanent.keepTechOnSaunaReset;
        const preservedTechCounts = keepTech ? { ...s.techCounts } : baseState.techCounts;
        const preservedMultipliers = keepTech ? { ...s.multipliers } : baseState.multipliers;
        const multAfterRaw = computePrestigeMult(pointsAfter);
        const multAfter = Math.max(multAfterRaw, permanent.saunaPrestigeBaseMultiplierMin);
        const resetState: BaseState = {
          ...baseState,
          multipliers: preservedMultipliers,
          techCounts: preservedTechCounts,
          eraMult: s.eraMult,
          totalPopulation: s.totalPopulation,
          prestigePoints: pointsAfter,
          prestigeMult: multAfter,
          maailma: normalizedMaailma,
          modifiers: { ...baseState.modifiers, permanent },
          lampotilaRate: Math.max(0, permanent.lampotilaRateMult),
          dailyTasks,
        };
        const contextAfter = buildDailyTaskContext(resetState);
        dailyTasks = syncDailyTasksState(dailyTasks, contextAfter, now);
        dailyTasks = handleDailyTaskEvent(dailyTasks, { type: 'prestige' }, contextAfter, now);
        set({
          ...resetState,
          dailyTasks,
        });
        get().recompute();
        saveGame();
        return true;
      },
      changeEra: () => {
        const s = get();
        const now = Date.now();
        const contextBefore = buildDailyTaskContext(s);
        let dailyTasks = syncDailyTasksState(s.dailyTasks, contextBefore, now);
        const normalizedMaailma = normalizeMaailma(s.maailma);
        const permanent = computePermanentBonusesFromMaailma(normalizedMaailma);
        const baseState = createInitialBaseState();
        const nextEraMult = s.eraMult + 1;
        const resetState: BaseState = {
          ...baseState,
          eraMult: nextEraMult,
          maailma: normalizedMaailma,
          modifiers: { ...baseState.modifiers, permanent },
          prestigeMult: Math.max(
            baseState.prestigeMult,
            permanent.saunaPrestigeBaseMultiplierMin,
          ),
          lampotilaRate: Math.max(0, permanent.lampotilaRateMult),
          dailyTasks,
        };
        const contextAfter = buildDailyTaskContext(resetState);
        dailyTasks = syncDailyTasksState(dailyTasks, contextAfter, now);
        set({
          ...resetState,
          dailyTasks,
        });
        get().recompute();
        saveGame();
      },
      initializeDailyTasks: () => {
        const now = Date.now();
        set((s) => {
          const context = buildDailyTaskContext(s);
          const dailyTasks = syncDailyTasksState(s.dailyTasks, context, now);
          return { dailyTasks };
        });
      },
      claimDailyTaskReward: (taskId) => {
        const now = Date.now();
        set((s) => {
          const context = buildDailyTaskContext(s);
          const synced = syncDailyTasksState(s.dailyTasks, context, now);
          const { state: nextTasks } = claimDailyTaskRewardEffect(synced, taskId, now);
          return { dailyTasks: nextTasks };
        });
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
        const permanent = computePermanentBonusesFromMaailma(maailma);
        if (version >= BigBeautifulBalancePath) {
          const existingPrestigeMult =
            typeof old?.prestigeMult === 'number' ? (old.prestigeMult as number) : 1;
          const prestigeMult = Math.max(
            existingPrestigeMult,
            permanent.saunaPrestigeBaseMultiplierMin,
          );
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
            prestigeMult,
            eraMult: typeof old?.eraMult === 'number' ? (old.eraMult as number) : 1,
            lastSave:
              typeof old?.lastSave === 'number' ? (old.lastSave as number) : Date.now(),
            lastMajorVersion,
            eraPromptAcknowledged: acknowledged,
            maailma,
            modifiers: { permanent },
            lampotilaRate: Math.max(0, permanent.lampotilaRateMult),
            dailyTasks: createInitialDailyTasksState(),
          };
        }

        needsEraPrompt = true;
        if (version >= 3) {
          const existingPrestigeMult =
            typeof old?.prestigeMult === 'number' ? (old.prestigeMult as number) : 1;
          const prestigeMult = Math.max(
            existingPrestigeMult,
            permanent.saunaPrestigeBaseMultiplierMin,
          );
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
            prestigeMult,
            eraMult:
              typeof old?.eraMult === 'number' ? (old.eraMult as number) : 1,
            lastSave:
              typeof old?.lastSave === 'number' ? (old.lastSave as number) : Date.now(),
            lastMajorVersion,
            eraPromptAcknowledged: acknowledged,
            maailma,
            modifiers: { permanent },
            lampotilaRate: Math.max(0, permanent.lampotilaRateMult),
            dailyTasks: createInitialDailyTasksState(),
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
          const baseState = createInitialBaseState();
          return {
            ...baseState,
            maailma,
            modifiers: { ...baseState.modifiers, permanent },
            prestigeMult: Math.max(
              baseState.prestigeMult,
              permanent.saunaPrestigeBaseMultiplierMin,
            ),
            lampotilaRate: Math.max(0, permanent.lampotilaRateMult),
          };
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

        const prestigeMult = Math.max(1, permanent.saunaPrestigeBaseMultiplierMin);
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
          prestigeMult,
          eraMult: 1,
          lastSave: Date.now(),
          lastMajorVersion,
          eraPromptAcknowledged: acknowledged,
          maailma,
          modifiers: { permanent },
          lampotilaRate: Math.max(0, permanent.lampotilaRateMult),
          dailyTasks: createInitialDailyTasksState(),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const now = Date.now();
        const last = state.lastSave ?? now;
        const normalizedMaailma = normalizeMaailma(state.maailma);
        state.maailma = normalizedMaailma;
        const permanent = computePermanentBonusesFromMaailma(normalizedMaailma);
        state.modifiers = { ...(state.modifiers ?? { permanent }), permanent };
        state.prestigeMult = Math.max(
          state.prestigeMult,
          permanent.saunaPrestigeBaseMultiplierMin,
        );
        state.lampotilaRate = Math.max(0, permanent.lampotilaRateMult);
        state.recompute();
        const delta = Math.max(0, Math.floor((now - last) / 1000));
        state.tick(delta, { offline: true });
        state.initializeDailyTasks();
        useGameStore.setState({ lastSave: now, maailma: normalizedMaailma });
        let acknowledged = state.eraPromptAcknowledged;
        try {
          if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw) as PersistedStorageValue;
              const parsedState = parsed.state as Record<string, unknown> | undefined;
              const parsedSave = parsed.save as Record<string, unknown> | undefined;
              if (parsedSave) {
                applyPermanentBonuses(parsedSave as Parameters<typeof applyPermanentBonuses>[0]);
              }
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
                const nextSave = { ...(parsedSave ?? {}), maailma: state.maailma } as Record<string, unknown>;
                applyPermanentBonuses(nextSave as Parameters<typeof applyPermanentBonuses>[0]);
                writePersistedStorage({
                  ...parsed,
                  version: parsed.version ?? BigBeautifulBalancePath,
                  state: { ...(parsedState ?? {}), maailma: state.maailma },
                  save: nextSave,
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

export interface TuhkaAwardPreview {
  current: bigint;
  totalEarned: bigint;
  award: bigint;
  availableAfter: bigint;
  totalEarnedAfter: bigint;
}

export const getTuhkaAwardPreview = (): TuhkaAwardPreview => {
  const state = useGameStore.getState();
  const current = toBigInt(state.maailma.tuhka);
  const totalEarned = toBigInt(state.maailma.totalTuhkaEarned);
  const rawTier = new Decimal(state.tierLevel ?? 0);
  const tier = rawTier.isFinite() ? Decimal.max(rawTier, decimalZero) : decimalZero;
  const rawMultiplier = new Decimal(state.prestigeMult ?? 0);
  const multiplier = rawMultiplier.isFinite()
    ? Decimal.max(rawMultiplier, decimalZero)
    : decimalZero;

  let awardDecimal = decimalZero;
  if (tier.gt(0)) {
    const logTerm = Decimal.log10(multiplier.plus(1));
    if (logTerm.isFinite() && logTerm.gt(0)) {
      const product = tier.mul(logTerm);
      if (product.isFinite() && product.gt(0)) {
        awardDecimal = product.sqrt().floor();
      }
    }
  }

  const award =
    awardDecimal.isFinite() && awardDecimal.gte(0)
      ? BigInt(awardDecimal.toFixed(0))
      : 0n;

  return {
    current,
    totalEarned,
    award,
    availableAfter: current + award,
    totalEarnedAfter: totalEarned + award,
  };
};

export interface PoltaMaailmaResult {
  awarded: bigint;
  availableTuhka: bigint;
  totalTuhkaEarned: bigint;
}

export const poltaMaailmaConfirm = (): PoltaMaailmaResult => {
  const preview = getTuhkaAwardPreview();
  const nextTuhka = preview.availableAfter.toString();
  const nextTotal = preview.totalEarnedAfter.toString();

  let updatedMaailma: MaailmaState | undefined;

  useGameStore.setState((state) => {
    const totalResets = getSafeCount(state.maailma.totalResets);
    updatedMaailma = normalizeMaailma({
      ...state.maailma,
      tuhka: nextTuhka,
      totalTuhkaEarned: nextTotal,
      totalResets: totalResets + 1,
    });
    const resetState = createProgressResetState(state, updatedMaailma);
    return {
      ...resetState,
      maailma: updatedMaailma,
    };
  });

  if (updatedMaailma) {
    const saveForBonuses = { maailma: updatedMaailma } as Parameters<
      typeof applyPermanentBonuses
    >[0];
    applyPermanentBonuses(saveForBonuses);
  }

  useGameStore.getState().recompute();
  saveGame();

  return {
    awarded: preview.award,
    availableTuhka: preview.availableAfter,
    totalTuhkaEarned: preview.totalEarnedAfter,
  };
};

export const getCloudSavePayload = () => {
  const state = useGameStore.getState();
  const sanitized = sanitizeState(state);
  return buildPersistedData(sanitized);
};

