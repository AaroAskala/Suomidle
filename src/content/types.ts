import type { IconKey } from '../icons';

export interface Resource {
  id: string;
  name: string;
  icon?: IconKey;
}

export interface BuildingDef {
  id: string;
  name: string;
  icon: IconKey;
  baseCost: number;
  costMult: number;
  baseProd: number;
  unlock?: {
    tier: number;
  };
}

export interface TechEffect {
  type: 'mult' | 'add';
  target: string;
  value: number;
}

export interface TechDef {
  id: string;
  name: string;
  icon: IconKey;
  cost: number;
  effects: TechEffect[];
  limit?: number;
  unlock?: {
    tier: number;
  };
}

export interface TierDef {
  name: string;
  tier: number;
  population: number;
}

export interface PrestigeFormula {
  type: 'sqrt';
  k: number;
  multPerPoint: number;
  base: number;
  stacking: 'add';
}

export interface PrestigeDef {
  id: string;
  name: string;
  icon: IconKey;
  minPopulation: number;
  formula: PrestigeFormula;
}
