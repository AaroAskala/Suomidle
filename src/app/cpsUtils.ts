import { buildings } from '../content';

export const computeCpsBase = (buildingCounts: Record<string, number>): number => {
  let total = 0;
  for (const building of buildings) {
    const count = buildingCounts[building.id] ?? 0;
    if (!Number.isFinite(count) || count <= 0) continue;
    total += building.baseProd * count;
  }
  return total;
};

export const computeTotalBuildingCount = (buildingCounts: Record<string, number>): number => {
  let total = 0;
  for (const building of buildings) {
    const count = buildingCounts[building.id] ?? 0;
    if (!Number.isFinite(count) || count <= 0) continue;
    total += Math.floor(count);
  }
  return total;
};

export const computeTierBonusMultiplier = (
  tierLevel: number,
  perTierBonuses: Record<string, number>,
): number => {
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
