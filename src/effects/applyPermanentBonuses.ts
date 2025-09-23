import shopData from '../data/maailma_shop.json' assert { type: 'json' };
import { buildings } from '../content';
import type { MaailmaPurchase } from '../state/schema';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

type StackMode = 'add' | 'mult';

type TechMultBonusAddEffect = {
  type: 'tech_mult_bonus_add';
  value_per_level: number;
  stack_mode: StackMode;
  cap?: number;
};

type BaseProdMultEffect = {
  type: 'base_prod_mult';
  value_per_level: number;
  stack_mode: StackMode;
  cap?: number;
};

type SaunaPrestigeBaseMultiplierMinEffect = {
  type: 'sauna_prestige_base_multiplier_min';
  value: number;
  cap?: number;
};

type TierUnlockOffsetEffect = {
  type: 'tier_unlock_offset';
  value: number;
  cap?: number;
};

type BuildingCostMultDeltaEffect = {
  type: 'building_cost_mult_delta';
  value_per_level: number;
  stack_mode: StackMode;
  floor?: number;
  cap?: number;
};

type OfflineProdMultEffect = {
  type: 'offline_prod_mult';
  value_per_level: number;
  stack_mode: StackMode;
  cap?: number;
};

type PerTierGlobalCpsAddEffect = {
  type: 'per_tier_global_cps_add';
  from_tier_inclusive: number;
  value_per_tier_per_level: number;
  stack_mode: StackMode;
  cap?: number;
};

type LampotilaRateMultEffect = {
  type: 'lampotila_rate_mult';
  value_per_level: number;
  stack_mode: StackMode;
  cap?: number;
};

type TemperatureMultInstantEffect = {
  type: 'temperature_mult_instant';
  value: number;
};

type KeepTechOnSaunaResetEffect = {
  type: 'keep_tech_on_sauna_reset';
  value: boolean;
};

type GlobalCpsAddPerTuhkaSpentEffect = {
  type: 'global_cps_add_per_tuhka_spent';
  value_per_tuhka: number;
  cap?: number;
};

type MaailmaShopEffect =
  | TechMultBonusAddEffect
  | BaseProdMultEffect
  | SaunaPrestigeBaseMultiplierMinEffect
  | TierUnlockOffsetEffect
  | BuildingCostMultDeltaEffect
  | OfflineProdMultEffect
  | PerTierGlobalCpsAddEffect
  | LampotilaRateMultEffect
  | TemperatureMultInstantEffect
  | KeepTechOnSaunaResetEffect
  | GlobalCpsAddPerTuhkaSpentEffect;

type RawMaailmaShopItem = {
  id: string;
  max_level?: number;
  cost_tuhka?: unknown;
  effect: MaailmaShopEffect;
};

type MaailmaPurchases = Record<string, MaailmaPurchase | number | string | null | undefined>;

type RawSave = {
  maailma?: Record<string, unknown> & { purchases?: unknown };
  modifiers?: Record<string, unknown>;
} & Record<string, unknown>;

export interface BuildingCostModifier {
  delta: number;
  floor: number | null;
}

export interface PermanentBonuses {
  techMultiplierBonusAdd: number;
  baseProdMult: number;
  offlineProdMult: number;
  lampotilaRateMult: number;
  tierUnlockOffset: number;
  buildingCostMultiplier: BuildingCostModifier;
  saunaPrestigeBaseMultiplierMin: number;
  keepTechOnSaunaReset: boolean;
  perTierGlobalCpsAdd: Record<string, number>;
  globalCpsAddPerTuhkaSpent: number;
  totalTuhkaSpent: number;
  globalCpsAddFromTuhkaSpent: number;
}

const createDefaultPermanentBonuses = (): PermanentBonuses => ({
  techMultiplierBonusAdd: 0,
  baseProdMult: 1,
  offlineProdMult: 1,
  lampotilaRateMult: 1,
  tierUnlockOffset: 0,
  buildingCostMultiplier: { delta: 0, floor: null },
  saunaPrestigeBaseMultiplierMin: 1,
  keepTechOnSaunaReset: false,
  perTierGlobalCpsAdd: {},
  globalCpsAddPerTuhkaSpent: 0,
  totalTuhkaSpent: 0,
  globalCpsAddFromTuhkaSpent: 0,
});

const rawShopItems = (shopData as { shop?: RawMaailmaShopItem[] }).shop ?? [];
const shopItemsById = new Map<string, RawMaailmaShopItem>();
for (const item of rawShopItems) {
  if (item && typeof item.id === 'string') {
    shopItemsById.set(item.id, item);
  }
}

const minBuildingCostMultiplier = Math.min(...buildings.map((b) => b.costMult));

const parseLevel = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.floor(parsed));
    }
  }
  return 0;
};

const normalizePurchases = (raw: unknown): Map<string, number> => {
  const levels = new Map<string, number>();
  if (!raw) return levels;

  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (typeof entry !== 'string') continue;
      const current = levels.get(entry) ?? 0;
      levels.set(entry, current + 1);
    }
    return levels;
  }

  if (!isRecord(raw)) return levels;

  const purchases = raw as MaailmaPurchases;
  for (const [key, value] of Object.entries(purchases)) {
    if (value === undefined || value === null) continue;
    let id = key;
    let levelSource: unknown = value;
    if (isRecord(value)) {
      const candidateId = value.id;
      if (typeof candidateId === 'string' && candidateId.length > 0) {
        id = candidateId;
      }
      levelSource = value.level;
    }
    const level = parseLevel(levelSource);
    if (level <= 0) continue;
    levels.set(id, level);
  }

  return levels;
};

const computeTotalCost = (costs: unknown, level: number): number => {
  if (!Array.isArray(costs) || level <= 0) return 0;
  const limit = Math.min(level, costs.length);
  let sum = 0;
  for (let i = 0; i < limit; i += 1) {
    const cost = costs[i];
    if (typeof cost !== 'number' || !Number.isFinite(cost)) continue;
    sum += cost;
  }
  return sum;
};

const applyCap = (value: number, cap: number | undefined, isPositive: boolean): number => {
  if (cap === undefined) return value;
  return isPositive ? Math.min(value, cap) : Math.max(value, cap);
};

export const applyPermanentBonuses = (save: RawSave): PermanentBonuses => {
  const permanent = createDefaultPermanentBonuses();
  const modifiers = isRecord(save.modifiers) ? save.modifiers : {};

  const maailma = save.maailma;
  if (!maailma || !isRecord(maailma)) {
    save.modifiers = { ...modifiers, permanent };
    return permanent;
  }

  const levels = normalizePurchases(maailma.purchases);
  if (levels.size === 0) {
    save.modifiers = { ...modifiers, permanent };
    return permanent;
  }

  let techBonusAdd = 0;
  let baseProdMult = 1;
  let offlineAdd = 0;
  let offlineMult = 1;
  let lampotilaAdd = 0;
  let lampotilaMult = 1;
  let tierUnlockOffset = 0;
  let buildingCostDelta = 0;
  let buildingCostFloor: number | null = null;
  let saunaPrestigeMin = 1;
  let keepTech = false;
  const perTierGlobalCpsAdd: Record<string, number> = {};
  let perTuhkaBonusRate = 0;
  let totalTuhkaSpent = 0;

  for (const [id, rawLevel] of levels) {
    const item = shopItemsById.get(id);
    if (!item) continue;
    const level = Math.max(0, Math.min(rawLevel, item.max_level ?? rawLevel));
    if (level <= 0) continue;
    const effect = item.effect;
    totalTuhkaSpent += computeTotalCost(item.cost_tuhka, level);

    switch (effect.type) {
      case 'tech_mult_bonus_add': {
        const addition = effect.stack_mode === 'mult'
          ? Math.pow(effect.value_per_level, level) - 1
          : effect.value_per_level * level;
        techBonusAdd = effect.stack_mode === 'mult'
          ? (techBonusAdd + 1) * (addition + 1) - 1
          : techBonusAdd + addition;
        techBonusAdd = applyCap(techBonusAdd, effect.cap, true);
        break;
      }
      case 'base_prod_mult': {
        if (effect.stack_mode === 'mult') {
          baseProdMult *= Math.pow(effect.value_per_level, level);
        } else {
          baseProdMult += effect.value_per_level * level;
        }
        baseProdMult = applyCap(baseProdMult, effect.cap, true);
        break;
      }
      case 'sauna_prestige_base_multiplier_min': {
        const value = effect.cap !== undefined ? Math.min(effect.value, effect.cap) : effect.value;
        if (value > saunaPrestigeMin && level > 0) saunaPrestigeMin = value;
        break;
      }
      case 'tier_unlock_offset': {
        const delta = effect.value * level;
        tierUnlockOffset += delta;
        tierUnlockOffset = applyCap(tierUnlockOffset, effect.cap, effect.value >= 0);
        break;
      }
      case 'building_cost_mult_delta': {
        const delta =
          effect.stack_mode === 'mult'
            ? Math.pow(effect.value_per_level, level) - 1
            : effect.value_per_level * level;
        buildingCostDelta += delta;
        if (typeof effect.floor === 'number' && Number.isFinite(effect.floor)) {
          buildingCostFloor =
            buildingCostFloor === null ? effect.floor : Math.max(buildingCostFloor, effect.floor);
        }
        buildingCostDelta = applyCap(buildingCostDelta, effect.cap, effect.value_per_level >= 0);
        break;
      }
      case 'offline_prod_mult': {
        if (effect.stack_mode === 'mult') {
          offlineMult *= Math.pow(effect.value_per_level, level);
        } else {
          offlineAdd += effect.value_per_level * level;
        }
        break;
      }
      case 'per_tier_global_cps_add': {
        const key = String(effect.from_tier_inclusive);
        const current = perTierGlobalCpsAdd[key] ?? (effect.stack_mode === 'mult' ? 1 : 0);
        if (effect.stack_mode === 'mult') {
          perTierGlobalCpsAdd[key] = current * Math.pow(effect.value_per_tier_per_level, level);
        } else {
          const addition = effect.value_per_tier_per_level * level;
          perTierGlobalCpsAdd[key] = current + addition;
        }
        perTierGlobalCpsAdd[key] = applyCap(
          perTierGlobalCpsAdd[key],
          effect.cap,
          effect.stack_mode === 'mult' ? perTierGlobalCpsAdd[key] >= 1 : effect.value_per_tier_per_level >= 0,
        );
        break;
      }
      case 'lampotila_rate_mult': {
        if (effect.stack_mode === 'mult') {
          lampotilaMult *= Math.pow(effect.value_per_level, level);
        } else {
          lampotilaAdd += effect.value_per_level * level;
        }
        break;
      }
      case 'temperature_mult_instant': {
        // Instant effects are applied at purchase time and do not affect permanent bonuses.
        break;
      }
      case 'keep_tech_on_sauna_reset': {
        if (effect.value && level > 0) keepTech = true;
        break;
      }
      case 'global_cps_add_per_tuhka_spent': {
        const addition = effect.value_per_tuhka * level;
        perTuhkaBonusRate += addition;
        perTuhkaBonusRate = applyCap(perTuhkaBonusRate, effect.cap, effect.value_per_tuhka >= 0);
        break;
      }
      default: {
        // Ignore unknown effects but continue computing other bonuses.
        break;
      }
    }
  }

  if (buildingCostFloor !== null && Number.isFinite(buildingCostFloor)) {
    const minimalDelta = buildingCostFloor - minBuildingCostMultiplier;
    if (buildingCostDelta < minimalDelta) buildingCostDelta = minimalDelta;
  }

  const offlineMultiplier = offlineMult * (1 + offlineAdd);
  const lampotilaMultiplier = lampotilaMult * (1 + lampotilaAdd);

  const permanentPerTier: Record<string, number> = {};
  for (const [key, value] of Object.entries(perTierGlobalCpsAdd)) {
    if (!Number.isFinite(value)) continue;
    if (value === 0) continue;
    permanentPerTier[key] = value;
  }

  permanent.techMultiplierBonusAdd = techBonusAdd;
  permanent.baseProdMult = baseProdMult;
  permanent.offlineProdMult = offlineMultiplier;
  permanent.lampotilaRateMult = lampotilaMultiplier;
  permanent.tierUnlockOffset = tierUnlockOffset;
  permanent.buildingCostMultiplier = {
    delta: buildingCostDelta,
    floor: buildingCostFloor,
  };
  permanent.saunaPrestigeBaseMultiplierMin = saunaPrestigeMin;
  permanent.keepTechOnSaunaReset = keepTech;
  permanent.perTierGlobalCpsAdd = permanentPerTier;
  permanent.globalCpsAddPerTuhkaSpent = perTuhkaBonusRate;
  permanent.totalTuhkaSpent = totalTuhkaSpent;
  permanent.globalCpsAddFromTuhkaSpent = perTuhkaBonusRate * totalTuhkaSpent;

  save.modifiers = { ...modifiers, permanent };
  return permanent;
};
