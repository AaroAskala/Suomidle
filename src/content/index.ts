import { iconMap, type IconKey } from '../icons';
import buildingsData from './buildings.json' assert { type: 'json' };
import techData from './tech.json' assert { type: 'json' };
import tiersData from './tiers.json' assert { type: 'json' };
import prestigeData from './prestige.json' assert { type: 'json' };
import type { BuildingDef, TechDef, TierDef, PrestigeDef } from './types';

type WithIconKey<T extends { icon: string }> = Omit<T, 'icon'> & { icon: IconKey };

const assertIconKey = (icon: string, context: string): IconKey => {
  if (icon in iconMap) {
    return icon as IconKey;
  }
  throw new Error(`Unknown icon key "${icon}" in ${context}`);
};

const normalizeIconKeys = <T extends { id: string; icon: string }>(
  collection: readonly T[],
  kind: string,
): WithIconKey<T>[] =>
  collection.map((item) => {
    const icon = assertIconKey(item.icon, `${kind}:${item.id}`);
    return { ...item, icon } as WithIconKey<T>;
  });

const normalizeIconKey = <T extends { id: string; icon: string }>(value: T, kind: string): WithIconKey<T> => {
  const icon = assertIconKey(value.icon, `${kind}:${value.id}`);
  return { ...value, icon } as WithIconKey<T>;
};

export const buildings = normalizeIconKeys(buildingsData, 'building') as BuildingDef[];
export const tech = normalizeIconKeys(techData, 'tech') as TechDef[];
export const tiers = tiersData as TierDef[];
export const prestige = normalizeIconKey(prestigeData, 'prestige') as PrestigeDef;

export const getBuilding = (id: string) => buildings.find((b) => b.id === id);
export const getTech = (id: string) => tech.find((t) => t.id === id);
export const getTier = (tier: number) => tiers.find((t) => t.tier === tier);

export const getBuildingCost = (b: BuildingDef, count: number) =>
  b.baseCost * Math.pow(b.costMult, count);
