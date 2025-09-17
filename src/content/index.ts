import buildingsData from './buildings.json' assert { type: 'json' };
import techData from './tech.json' assert { type: 'json' };
import tiersData from './tiers.json' assert { type: 'json' };
import prestigeData from './prestige.json' assert { type: 'json' };
import dailyTasksData from './dailyTasks.json' assert { type: 'json' };
import type { BuildingDef, TechDef, TierDef, PrestigeDef } from './types';

export const buildings = buildingsData as BuildingDef[];
export const tech = techData as TechDef[];
export const tiers = tiersData as TierDef[];
export const prestige = prestigeData as PrestigeDef;
export const dailyTasks = dailyTasksData;

export const getBuilding = (id: string) => buildings.find((b) => b.id === id);
export const getTech = (id: string) => tech.find((t) => t.id === id);
export const getTier = (tier: number) => tiers.find((t) => t.tier === tier);

export const getBuildingCost = (b: BuildingDef, count: number) =>
  b.baseCost * Math.pow(b.costMult, count);
