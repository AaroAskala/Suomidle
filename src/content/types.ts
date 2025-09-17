export interface Resource {
  id: string;
  name: string;
  iconKey?: string;
}

export interface BuildingDef {
  id: string;
  name: string;
  iconKey: string;
  baseCost: number;
  costMult: number;
  baseProd: number;
  description?: string;
  flavorText?: string;
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
  iconKey: string;
  cost: number;
  effects: TechEffect[];
  limit?: number;
  description?: string;
  flavorText?: string;
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
  iconKey?: string;
  minPopulation: number;
  formula: PrestigeFormula;
}
