import type { BuildingDef } from '../content/types';
import type { PermanentBonuses } from '../effects/applyPermanentBonuses';

const MIN_COST_MULTIPLIER = 0.0001;
export const BUILDING_PURCHASE_EPSILON = 1e-6;

export interface BuildingPurchaseState {
  costMultiplier: number;
  nextPrice: number;
}

const clampMultiplier = (value: number) =>
  Number.isFinite(value) ? Math.max(MIN_COST_MULTIPLIER, value) : MIN_COST_MULTIPLIER;

const clampCount = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);

/**
 * Computes the effective cost multiplier and next purchase price for a building.
 */
export const createBuildingPurchaseState = (
  building: BuildingDef,
  currentCount: number,
  permanent: PermanentBonuses,
): BuildingPurchaseState => {
  const safeCount = clampCount(currentCount);
  const baseCostMult = building.costMult + permanent.buildingCostMultiplier.delta;
  const floor = permanent.buildingCostMultiplier.floor;
  const adjustedMultiplier =
    typeof floor === 'number' && Number.isFinite(floor) ? Math.max(baseCostMult, floor) : baseCostMult;
  const costMultiplier = clampMultiplier(adjustedMultiplier);
  const nextPriceRaw = building.baseCost * Math.pow(costMultiplier, safeCount);
  const nextPrice =
    Number.isFinite(nextPriceRaw) && nextPriceRaw > 0 ? nextPriceRaw : Number.POSITIVE_INFINITY;
  return { costMultiplier, nextPrice };
};

const isApproximatelyEqual = (a: number, b: number) => Math.abs(a - b) <= BUILDING_PURCHASE_EPSILON;

/**
 * Computes the total cost for purchasing a number of buildings using a precomputed state.
 */
export const getTotalCostForPurchases = (
  state: BuildingPurchaseState,
  additionalCount: number,
): number => {
  const count = clampCount(additionalCount);
  if (count <= 0) return 0;
  const { costMultiplier, nextPrice } = state;
  if (!Number.isFinite(nextPrice) || nextPrice <= 0) return Number.POSITIVE_INFINITY;
  if (isApproximatelyEqual(costMultiplier, 1)) {
    return nextPrice * count;
  }
  const ratioPower = Math.pow(costMultiplier, count);
  if (!Number.isFinite(ratioPower)) return Number.POSITIVE_INFINITY;
  return (nextPrice * (ratioPower - 1)) / (costMultiplier - 1);
};

const searchAffordablePurchases = (
  state: BuildingPurchaseState,
  availablePopulation: number,
): number => {
  let low = 0;
  let high = 1;
  while (high < Number.MAX_SAFE_INTEGER) {
    const cost = getTotalCostForPurchases(state, high);
    if (!Number.isFinite(cost) || cost > availablePopulation + BUILDING_PURCHASE_EPSILON) {
      break;
    }
    low = high;
    if (high >= 1_000_000) {
      break;
    }
    high *= 2;
  }
  while (low < high) {
    const mid = low + Math.floor((high - low + 1) / 2);
    const cost = getTotalCostForPurchases(state, mid);
    if (Number.isFinite(cost) && cost <= availablePopulation + BUILDING_PURCHASE_EPSILON) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return low;
};

/**
 * Determines how many buildings can be afforded with the available population currency.
 */
export const getMaxAffordablePurchases = (
  state: BuildingPurchaseState,
  availablePopulation: number,
): number => {
  if (!Number.isFinite(availablePopulation) || availablePopulation <= 0) return 0;
  const { costMultiplier, nextPrice } = state;
  if (!Number.isFinite(nextPrice) || nextPrice <= 0) return 0;
  if (availablePopulation + BUILDING_PURCHASE_EPSILON < nextPrice) return 0;

  let maxPurchases = 0;
  if (isApproximatelyEqual(costMultiplier, 1)) {
    maxPurchases = Math.floor((availablePopulation + BUILDING_PURCHASE_EPSILON) / nextPrice);
  } else {
    const target = 1 + (availablePopulation * (costMultiplier - 1)) / nextPrice;
    if (target <= 0) {
      maxPurchases = searchAffordablePurchases(state, availablePopulation);
    } else {
      const raw = Math.log(target) / Math.log(costMultiplier);
      if (Number.isFinite(raw) && raw > 0) {
        maxPurchases = Math.floor(raw);
      }
    }
  }

  if (maxPurchases <= 0) return 0;

  let totalCost = getTotalCostForPurchases(state, maxPurchases);
  while (maxPurchases > 0 && (!Number.isFinite(totalCost) || totalCost > availablePopulation + BUILDING_PURCHASE_EPSILON)) {
    maxPurchases -= 1;
    totalCost = getTotalCostForPurchases(state, maxPurchases);
  }

  return maxPurchases > 0 ? maxPurchases : 0;
};
