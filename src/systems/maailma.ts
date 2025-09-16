import Decimal from 'decimal.js';
import maailmaShopData from '../data/maailma_shop.json' assert { type: 'json' };
import type {
  DecimalString,
  GameState,
  MaailmaPurchase,
  MaailmaState,
} from '../state/schema';
import { telemetry } from '../telemetry';

interface HardResetOptions {
  includeSaunaMultiplier?: boolean;
}

interface RawMaailmaShopEffect {
  readonly type: string;
  readonly value_per_level?: number;
  readonly stack_mode?: 'add' | 'mult';
  readonly value?: number;
  readonly floor?: number;
  readonly from_tier_inclusive?: number;
  readonly value_per_tier_per_level?: number;
  readonly value_per_tuhka?: number;
}

interface RawMaailmaShopItem {
  readonly id: string;
  readonly name_fi: string;
  readonly icon: string;
  readonly description_fi: string;
  readonly effect: RawMaailmaShopEffect;
  readonly max_level: number;
  readonly cost_tuhka: number[];
}

interface RawMaailmaShopData {
  readonly currency: Record<string, unknown>;
  readonly shop: RawMaailmaShopItem[];
}

export interface MaailmaShopItem {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly description: string;
  readonly effect: RawMaailmaShopEffect;
  readonly maxLevel: number;
  readonly costs: readonly Decimal[];
}

const rawData = maailmaShopData as RawMaailmaShopData;

const shopCatalog: readonly MaailmaShopItem[] = rawData.shop.map((item) => ({
  id: item.id,
  name: item.name_fi,
  icon: item.icon,
  description: item.description_fi,
  effect: item.effect,
  maxLevel: item.max_level,
  costs: item.cost_tuhka.map((cost) => new Decimal(cost)),
}));

const zero = new Decimal(0);

const decimalFrom = (value: Decimal.Value): Decimal => new Decimal(value);

const decimalToDecimalString = (value: Decimal): DecimalString =>
  value.toFixed() as DecimalString;

const findShopItem = (id: string) => shopCatalog.find((item) => item.id === id);

const cloneMaailmaPurchases = (purchases: Record<string, MaailmaPurchase>): Record<string, MaailmaPurchase> =>
  Object.fromEntries(
    Object.entries(purchases).map(([key, purchase]) => [key, { ...purchase }]),
  );

const createPurchaseSnapshot = (purchases: Record<string, MaailmaPurchase>): Record<string, number> =>
  Object.fromEntries(Object.entries(purchases).map(([id, purchase]) => [id, purchase.level]));

const getSafeTotalResets = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

const hardResetEverything = (state: GameState, options: HardResetOptions = {}): GameState => {
  const { includeSaunaMultiplier = false } = options;
  return {
    ...state,
    population: 0,
    totalPopulation: includeSaunaMultiplier ? 0 : state.totalPopulation,
    tierLevel: 1,
    buildings: {},
    techCounts: {},
    multipliers: { population_cps: 1 },
    cps: 0,
    clickPower: 1,
    prestigePoints: includeSaunaMultiplier ? 0 : state.prestigePoints,
    prestigeMult: includeSaunaMultiplier ? 1 : state.prestigeMult,
    eraMult: includeSaunaMultiplier ? 1 : state.eraMult,
  };
};

const reapplyPermanentBonuses = (state: GameState): GameState => {
  const multiplierBase = decimalFrom(state.multipliers.population_cps || 1);
  let bonusMultiplier = new Decimal(1);
  let saunaPrestigeBaseMultiplier = new Decimal(1);

  const maailmastate = state.maailma;
  const totalEarned = decimalFrom(maailmastate.totalTuhkaEarned ?? '0');
  const currentTuhka = decimalFrom(maailmastate.tuhka ?? '0');
  const spentTuhka = Decimal.max(totalEarned.minus(currentTuhka), zero);

  for (const item of shopCatalog) {
    const purchase = maailmastate.purchases[item.id];
    if (!purchase || purchase.level <= 0) continue;
    const level = purchase.level;
    const { effect } = item;

    switch (effect.type) {
      case 'tech_mult_bonus_add': {
        const value = effect.value_per_level ?? 0;
        const additiveBonus = new Decimal(value).mul(level);
        bonusMultiplier = bonusMultiplier.mul(new Decimal(1).plus(additiveBonus));
        break;
      }
      case 'base_prod_mult': {
        const value = effect.value_per_level ?? 1;
        if (value > 0) {
          bonusMultiplier = bonusMultiplier.mul(new Decimal(value).pow(level));
        }
        break;
      }
      case 'sauna_prestige_base_multiplier_min': {
        const value = effect.value ?? 1;
        if (value > 1) {
          saunaPrestigeBaseMultiplier = Decimal.max(
            saunaPrestigeBaseMultiplier,
            new Decimal(value),
          );
        }
        break;
      }
      case 'global_cps_add_per_tuhka_spent': {
        const value = effect.value_per_tuhka ?? 0;
        if (value !== 0) {
          const bonus = spentTuhka.mul(value).mul(level);
          bonusMultiplier = bonusMultiplier.mul(new Decimal(1).plus(bonus));
        }
        break;
      }
      default:
        break;
    }
  }

  const updatedMultipliers = {
    ...state.multipliers,
    population_cps: multiplierBase.mul(bonusMultiplier).toNumber(),
  };

  const updatedPrestigeMult = Decimal.max(
    new Decimal(state.prestigeMult || 1),
    saunaPrestigeBaseMultiplier,
  ).toNumber();

  return {
    ...state,
    multipliers: updatedMultipliers,
    prestigeMult: updatedPrestigeMult,
  };
};

const updateTuhkaTotals = (maailma: MaailmaState, award: Decimal): MaailmaState => {
  if (award.lte(0)) return maailma;
  const current = decimalFrom(maailma.tuhka ?? '0');
  const totalEarned = decimalFrom(maailma.totalTuhkaEarned ?? '0');
  const nextCurrent = current.add(award).floor();
  const nextTotalEarned = totalEarned.add(award).floor();
  return {
    ...maailma,
    tuhka: decimalToDecimalString(nextCurrent),
    totalTuhkaEarned: decimalToDecimalString(nextTotalEarned),
  };
};

export const getTuhkaAwardPreview = (state: GameState): Decimal => {
  const tier = decimalFrom(state.tierLevel ?? 0);
  const multiplier = decimalFrom(state.prestigeMult ?? 0);
  if (tier.lte(0) || multiplier.lte(0)) return zero;
  const logTerm = multiplier.plus(1).log();
  if (!logTerm.isFinite() || logTerm.lte(0)) return zero;
  return tier.mul(logTerm).sqrt().floor();
};

export const canPoltaMaailma = (state: GameState): boolean =>
  getTuhkaAwardPreview(state).gt(0);

export const poltaMaailmaConfirm = (state: GameState): GameState => {
  const award = getTuhkaAwardPreview(state);
  if (award.lte(0)) return state;

  const previousTotalResets = getSafeTotalResets(state.maailma.totalResets);
  const resetState = hardResetEverything(state, { includeSaunaMultiplier: true });
  const withBonuses = reapplyPermanentBonuses(resetState);
  const clonedPurchases = cloneMaailmaPurchases(withBonuses.maailma.purchases);
  const updatedMaailma = updateTuhkaTotals({
    ...withBonuses.maailma,
    purchases: clonedPurchases,
  }, award);
  const nextTotalResets = previousTotalResets + 1;
  const finalMaailma: MaailmaState = {
    ...updatedMaailma,
    totalResets: nextTotalResets,
  };
  const result: GameState = {
    ...withBonuses,
    maailma: finalMaailma,
  };

  telemetry.emit('polta_maailma', {
    highestTier: state.tierLevel,
    saunaMultiplier: result.prestigeMult,
    tuhkaAward: decimalToDecimalString(award),
    purchases: createPurchaseSnapshot(clonedPurchases),
    totalResets: nextTotalResets,
  });

  return result;
};

export const getShopCatalog = () => shopCatalog;

export const getPurchaseLevel = (maailma: MaailmaState, id: string): number =>
  maailmastateHasPurchase(maailma, id) ? maailmastateGetPurchase(maailma, id).level : 0;

const maailmastateHasPurchase = (maailma: MaailmaState, id: string): boolean =>
  Object.prototype.hasOwnProperty.call(maailma.purchases, id);

const maailmastateGetPurchase = (maailma: MaailmaState, id: string): MaailmaPurchase =>
  maailmastateHasPurchase(maailma, id)
    ? (maailma.purchases[id] as MaailmaPurchase)
    : { id, level: 0 };

export const getNextCost = (maailma: MaailmaState, id: string): Decimal | null => {
  const item = findShopItem(id);
  if (!item) return null;
  const currentLevel = getPurchaseLevel(maailma, id);
  if (currentLevel >= item.maxLevel) return null;
  const cost = item.costs[currentLevel];
  return cost ? new Decimal(cost) : null;
};

export const canPurchase = (maailma: MaailmaState, id: string): boolean => {
  const cost = getNextCost(maailma, id);
  if (!cost) return false;
  const available = decimalFrom(maailma.tuhka ?? '0');
  return available.gte(cost);
};

export const purchase = (maailma: MaailmaState, id: string): MaailmaState => {
  const cost = getNextCost(maailma, id);
  if (!cost) return maailma;
  const available = decimalFrom(maailma.tuhka ?? '0');
  if (available.lt(cost)) return maailma;

  const remaining = available.minus(cost).floor();
  const nextLevel = getPurchaseLevel(maailma, id) + 1;
  const nextPurchases = cloneMaailmaPurchases(maailma.purchases);
  nextPurchases[id] = { id, level: nextLevel };

  const remainingString = decimalToDecimalString(remaining);
  const costString = decimalToDecimalString(cost);

  const nextState: MaailmaState = {
    ...maailma,
    tuhka: remainingString,
    purchases: nextPurchases,
  };

  telemetry.emit('maailma_purchase', {
    itemId: id,
    level: nextLevel,
    cost: costString,
    remainingTuhka: remainingString,
  });

  return nextState;
};
